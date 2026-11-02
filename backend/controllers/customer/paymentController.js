import CustomerPayment from "../../models/customer/CustomerPayment.js";
import Customer from "../../models/customer/Customer.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import BookingQuote from "../../models/customer/BookingQuote.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import * as mpesaService from "../../services/mpesaService.js";
import * as stripeService from "../../services/stripeService.js";
import * as emailService from "../../services/emailService.js";
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

  if (method === "stripe") {
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
  }
});

const list = asyncHandler(async (req, res) => {
  const { method, status, purpose, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (method) filter.method = method;
  if (status) filter.status = status;
  if (purpose) filter.purpose = purpose;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerPayment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerPayment.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  }).lean();

  if (!payment) throw new ApiError(404, "Payment not found");

  res.status(200).json(new ApiResponse(200, payment));
});

const retry = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });

  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status === "success")
    throw new ApiError(400, "Payment already completed");
  if (payment.method !== "mpesa")
    throw new ApiError(400, "Only M-Pesa payments can be retried here");

  const phone =
    req.body.phone ||
    payment.meta?.phone ||
    (await Customer.findById(req.customer._id).select("phone").lean())?.phone;

  if (!phone) throw new ApiError(400, "No M-Pesa phone on file");

  const result = await mpesaService.initiateSTKPush({
    phone,
    amount: payment.amount,
    accountReference: payment.reference,
    description: `Retry ${payment.purpose}`,
  });

  if (!result.success) {
    throw new ApiError(400, result.error?.errorMessage || "STK failed");
  }

  payment.status = "pending";
  payment.failureReason = null;
  payment.meta = {
    ...(payment.meta || {}),
    phone,
    checkoutRequestId: result.checkoutRequestId,
    merchantRequestId: result.merchantRequestId,
    retriedAt: new Date().toISOString(),
  };
  await payment.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          reference: payment.reference,
          checkoutRequestId: result.checkoutRequestId,
        },
        result.customerMessage || "STK sent"
      )
    );
});

const confirm = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });

  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status === "success") {
    return res
      .status(200)
      .json(new ApiResponse(200, payment, "Already completed"));
  }
  if (payment.method !== "mpesa")
    throw new ApiError(400, "Only M-Pesa payments can be confirmed here");

  const checkoutRequestId = payment.meta?.checkoutRequestId;
  if (!checkoutRequestId) throw new ApiError(400, "No STK request to check");

  const statusResult = await mpesaService.querySTKStatus(checkoutRequestId);
  if (!statusResult.success) {
    throw new ApiError(400, statusResult.error?.errorMessage || "Query failed");
  }

  if (statusResult.resultCode === "0") {
    payment.status = "success";
    payment.transactionId = payment.transactionId || `RETRY-${Date.now()}`;
    await payment.save();

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
      } catch {}
    }

    return res
      .status(200)
      .json(new ApiResponse(200, payment, "Payment completed"));
  }

  if (statusResult.resultCode && statusResult.resultCode !== "0") {
    payment.status = "failed";
    payment.failureReason = statusResult.resultDesc || "Payment failed";
    await payment.save();
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, payment, statusResult.resultDesc || "Still pending")
    );
});

export { initiate, list, details, retry, confirm };