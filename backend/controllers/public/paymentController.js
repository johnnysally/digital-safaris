import Customer from "../../models/customer/Customer.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import BookingQuote from "../../models/customer/BookingQuote.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import Trip from "../../models/trans/Trip.js";
import Commission from "../../models/admin/Commission.js";
import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import * as mpesaService from "../../services/mpesaService.js";
import * as stripeService from "../../services/stripeService.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const creditWalletIfTopup = async (payment) => {
  if (payment.purpose !== "topup") return;
  if (payment.meta?.walletCredited === true) return;

  const wallet = await CustomerWallet.findOne({ customer: payment.customer });
  if (!wallet) return;

  wallet.balance += payment.amount;
  wallet.totalCredited += payment.amount;
  await wallet.save();

  payment.meta = { ...(payment.meta || {}), walletCredited: true };
  await payment.save();
};

const creditOrderIfPaid = async (payment) => {
  if (payment.purpose !== "food_order") return;
  if (!payment.relatedId) return;

  const order = await FoodOrder.findOne({
    _id: payment.relatedId,
    paymentStatus: "pending",
  });
  if (!order) return;

  order.paymentStatus = "paid";
  await order.save();

  const existing = await Commission.findOne({ order: order._id }).lean();
  if (existing) return;

  await Commission.create({
    type: "food",
    rate: order.commissionRate,
    partner: order.restaurant,
    partnerType: "restaurant",
    order: order._id,
    amount: order.subtotal,
    commissionAmount: order.commissionAmount,
    status: "owed",
  });

  await RestaurantWallet.findOneAndUpdate(
    { restaurant: order.restaurant },
    {
      $inc: {
        balance: order.restaurantEarnings,
        totalEarned: order.restaurantEarnings,
        totalCommissionOwed: order.commissionAmount,
      },
    },
    { upsert: true }
  );
};

const creditTripIfPaid = async (payment) => {
  if (payment.purpose !== "transport") return;
  if (!payment.relatedId) return;

  const trip = await Trip.findOne({
    _id: payment.relatedId,
    paymentStatus: "pending",
  });
  if (!trip) return;

  trip.paymentStatus = "paid";
  await trip.save();

  const existing = await Commission.findOne({ order: trip._id }).lean();
  if (existing) return;

  await Commission.create({
    type: "transport",
    rate: trip.commissionRate,
    partner: trip.partner,
    partnerType: "transport",
    order: trip._id,
    amount: trip.fare,
    commissionAmount: trip.commissionAmount,
    status: "owed",
  });

  await TransportWallet.findOneAndUpdate(
    { partner: trip.partner },
    {
      $inc: {
        balance: trip.partnerEarnings,
        totalEarned: trip.partnerEarnings,
        totalCommissionOwed: trip.commissionAmount,
      },
    },
    { upsert: true }
  );
};

const initiate = asyncHandler(async (req, res) => {
  const { method, amount, purpose, quoteId, phone } = req.body;

  if (!["mpesa", "stripe", "wallet"].includes(method)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Invalid amount");
  }

  let quote = null;
  if (quoteId) {
    quote = await BookingQuote.findOne({
      quoteId,
      customer: req.customer._id,
      consumed: false,
    });
    if (!quote) throw new ApiError(400, "Invalid or consumed quote");
    if (quote.expiresAt < new Date()) throw new ApiError(400, "Quote expired");
    if (Math.abs(quote.total - numericAmount) > 1) {
      throw new ApiError(400, "Amount does not match the quote");
    }
  }

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method,
    purpose,
    amount: numericAmount,
    currency: quote?.currency ?? "KES",
    status: "pending",
    meta: { quoteId: quoteId ?? null, phone: phone ?? null },
  });

  if (method === "wallet") {
    const wallet = await CustomerWallet.findOne({ customer: req.customer._id });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    if (wallet.status === "frozen") throw new ApiError(403, "Wallet frozen");
    if (wallet.balance < numericAmount) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    wallet.balance -= numericAmount;
    wallet.totalDebited += numericAmount;
    await wallet.save();

    payment.status = "success";
    await payment.save();

    await creditWalletIfTopup(payment);
    await creditOrderIfPaid(payment);
    await creditTripIfPaid(payment);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { reference, status: "success" },
          "Paid with wallet"
        )
      );
  }

  if (method === "mpesa") {
    if (!phone) throw new ApiError(400, "Phone required for M-Pesa");
    const result = await mpesaService.initiateSTKPush({
      phone,
      amount: numericAmount,
      accountReference: reference,
      description: `DigitalSafaris ${purpose}`,
    });
    if (!result.success) {
      payment.status = "failed";
      payment.failureReason = result.error?.errorMessage || "STK failed";
      await payment.save();
      throw new ApiError(
        400,
        result.error?.errorMessage || "Failed to initiate STK"
      );
    }
    payment.meta = {
      ...payment.meta,
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
    };
    await payment.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            reference,
            status: "pending",
            checkoutRequestId: result.checkoutRequestId,
          },
          result.customerMessage
        )
      );
  }

  const result = await stripeService.createPaymentIntent({
    amount: numericAmount,
    currency: "usd",
    metadata: {
      reference,
      quoteId: quoteId ?? "",
      customerId: req.customer._id.toString(),
    },
    customerEmail: req.customer.email,
  });
  if (!result.success) {
    payment.status = "failed";
    payment.failureReason = result.error;
    await payment.save();
    throw new ApiError(400, result.error || "Stripe failed");
  }
  payment.transactionId = result.id;
  await payment.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reference, status: "pending", clientSecret: result.clientSecret },
        "Payment intent created"
      )
    );
});

const initiateMpesa = asyncHandler(async (req, res) => {
  const { phone, amount, purpose, relatedId } = req.body;

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "mpesa",
    purpose,
    relatedId: relatedId || null,
    amount,
    status: "pending",
    meta: { phone },
  });

  const result = await mpesaService.initiateSTKPush({
    phone,
    amount,
    accountReference: reference,
    description: `DigitalSafaris ${purpose}`,
  });

  if (!result.success) {
    payment.status = "failed";
    payment.failureReason = result.error?.errorMessage || "STK failed";
    await payment.save();
    throw new ApiError(
      400,
      result.error?.errorMessage || "Failed to initiate payment"
    );
  }

  payment.meta = {
    ...payment.meta,
    checkoutRequestId: result.checkoutRequestId,
    merchantRequestId: result.merchantRequestId,
  };
  await payment.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reference, checkoutRequestId: result.checkoutRequestId },
        result.customerMessage
      )
    );
});

const mpesaCallback = asyncHandler(async (req, res) => {
  const parsed = mpesaService.parseCallback(req.body);

  if (!parsed.checkoutRequestId) {
    return res.status(200).json({ success: true });
  }

  if (mpesaService.isDuplicateCallback(parsed.checkoutRequestId)) {
    return res.status(200).json({ success: true });
  }

  const payment = await CustomerPayment.findOne({
    "meta.checkoutRequestId": parsed.checkoutRequestId,
  });

  if (!payment) return res.status(200).json({ success: true });

  if (parsed.success) {
    const wasAlreadySuccess = payment.status === "success";

    if (!wasAlreadySuccess) {
      payment.status = "success";
      payment.transactionId = parsed.mpesaReceiptNumber;
      payment.receiptNumber = parsed.mpesaReceiptNumber;
      payment.meta = {
        ...payment.meta,
        transactionDate: parsed.transactionDate,
        phoneNumber: parsed.phoneNumber,
      };
      await payment.save();

      await creditWalletIfTopup(payment);
      await creditOrderIfPaid(payment);
      await creditTripIfPaid(payment);

      const customer = await Customer.findById(payment.customer);
      if (customer) {
        const { branding, settings } = await getContext();
        try {
          await emailService.paymentReceived(customer, {
            payment: {
              amount: payment.amount,
              reference: payment.reference,
              method: "M-Pesa",
              currency: payment.currency || "KES",
            },
            branding,
            settings,
          });
        } catch (err) {
          logger.error("Payment received email failed", { error: err.message });
        }
        try {
          await smsService.paymentReceived(customer, {
            amount: `KES ${payment.amount}`,
            reference: payment.reference,
          });
        } catch (err) {
          logger.error("Payment received SMS failed", { error: err.message });
        }
      }
    } else {
      await creditWalletIfTopup(payment);
      await creditOrderIfPaid(payment);
      await creditTripIfPaid(payment);
    }
  } else {
    if (payment.status !== "success") {
      payment.status = "failed";
      payment.failureReason = parsed.resultDesc || "M-Pesa failed";
      await payment.save();
    }
  }

  res.status(200).json({ success: true });
});

const initiateStripe = asyncHandler(async (req, res) => {
  const { amount, purpose, relatedId, currency } = req.body;

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "stripe",
    purpose,
    relatedId: relatedId || null,
    amount,
    currency: currency || "usd",
    status: "pending",
  });

  const result = await stripeService.createPaymentIntent({
    amount,
    currency: currency || "usd",
    metadata: {
      reference,
      customerId: req.customer._id.toString(),
      purpose,
    },
    customerEmail: req.customer.email,
  });

  if (!result.success) {
    payment.status = "failed";
    payment.failureReason = result.error;
    await payment.save();
    throw new ApiError(400, result.error || "Stripe init failed");
  }

  payment.transactionId = result.id;
  await payment.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reference, clientSecret: result.clientSecret },
        "Payment intent created"
      )
    );
});

const stripeCallback = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeService.constructWebhookEvent(
      req.rawBody || req.body,
      signature
    );
  } catch (err) {
    logger.error("Stripe webhook signature failed", { error: err.message });
    return res.status(400).json({ received: false });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const reference = intent.metadata?.reference;
    if (reference) {
      const payment = await CustomerPayment.findOne({ reference });
      if (payment && payment.status !== "success") {
        payment.status = "success";
        payment.transactionId = intent.id;
        await payment.save();

        await creditWalletIfTopup(payment);
        await creditOrderIfPaid(payment);
        await creditTripIfPaid(payment);

        const customer = await Customer.findById(payment.customer);
        if (customer) {
          const { branding, settings } = await getContext();
          try {
            await emailService.paymentReceived(customer, {
              payment: {
                amount: payment.amount,
                reference: payment.reference,
                method: "Card",
                currency: (payment.currency || "usd").toUpperCase(),
              },
              branding,
              settings,
            });
          } catch (err) {
            logger.error("Payment received email failed", { error: err.message });
          }
        }
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const reference = intent.metadata?.reference;
    if (reference) {
      const payment = await CustomerPayment.findOne({ reference });
      if (payment && payment.status !== "success") {
        payment.status = "failed";
        payment.failureReason =
          intent.last_payment_error?.message || "Card payment failed";
        await payment.save();

        const customer = await Customer.findById(payment.customer);
        if (customer) {
          const { branding, settings } = await getContext();
          try {
            await emailService.paymentFailed(customer, {
              payment: {
                amount: payment.amount,
                reference: payment.reference,
                currency: (payment.currency || "usd").toUpperCase(),
              },
              reason: payment.failureReason,
              branding,
              settings,
            });
          } catch (err) {
            logger.error("Payment failed email failed", { error: err.message });
          }
        }
      }
    }
  }

  res.status(200).json({ received: true });
});

const payWithWallet = asyncHandler(async (req, res) => {
  const { amount, purpose, relatedId } = req.body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Invalid amount");
  }

  const wallet = await CustomerWallet.findOne({ customer: req.customer._id });
  if (!wallet) throw new ApiError(404, "Wallet not found");
  if (wallet.status === "frozen") throw new ApiError(403, "Wallet frozen");
  if (wallet.balance < numericAmount) {
    throw new ApiError(400, "Insufficient balance");
  }

  wallet.balance -= numericAmount;
  wallet.totalDebited += numericAmount;
  await wallet.save();

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "wallet",
    purpose,
    relatedId: relatedId || null,
    amount: numericAmount,
    status: "success",
  });

  await creditWalletIfTopup(payment);
  await creditOrderIfPaid(payment);
  await creditTripIfPaid(payment);

  const { branding, settings } = await getContext();
  try {
    await emailService.paymentReceived(req.customer, {
      payment: { amount: numericAmount, reference, method: "Wallet", currency: "KES" },
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Payment received email failed", { error: err.message });
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reference, balance: wallet.balance },
        "Paid with wallet"
      )
    );
});

const status = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findOne({
    reference: req.params.reference,
    customer: req.customer._id,
  }).lean();
  if (!payment) throw new ApiError(404, "Payment not found");
  res.status(200).json(new ApiResponse(200, payment));
});

export {
  initiate,
  initiateMpesa,
  mpesaCallback,
  initiateStripe,
  stripeCallback,
  payWithWallet,
  status,
};