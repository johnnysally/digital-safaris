import crypto from "crypto";
import mongoose from "mongoose";
import FoodOrder from "../../models/rest/FoodOrder.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import MenuItem from "../../models/rest/MenuItem.js";
import OrderQuote from "../../models/customer/OrderQuote.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import Commission from "../../models/admin/Commission.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return {
    branding,
    settings: general?.value || {},
    commission: commission?.value || { food: 10 },
  };
};

const quote = asyncHandler(async (req, res) => {
  const { restaurantId, items, type, deliveryAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one item is required");
  }

  const restaurant = await RestaurantPartner.findById(restaurantId);
  if (!restaurant) throw new ApiError(404, "Restaurant not found");
  if (restaurant.status !== "active")
    throw new ApiError(400, "Restaurant not available");
  if (!restaurant.isAcceptingOrders)
    throw new ApiError(400, "Restaurant not accepting orders");

  const menuItemIds = items.map((i) => i.menuItem);
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurant: restaurantId,
  });

  if (menuItems.length !== menuItemIds.length) {
    throw new ApiError(400, "One or more items invalid");
  }

  const builtItems = items.map((i) => {
    const mi = menuItems.find((m) => m._id.toString() === i.menuItem);
    const price = mi.discountPrice ?? mi.price;
    return {
      menuItem: mi._id,
      name: mi.name,
      price,
      quantity: Number(i.quantity) || 1,
      subtotal: price * (Number(i.quantity) || 1),
      notes: i.notes || null,
    };
  });

  const subtotal = builtItems.reduce((s, i) => s + i.subtotal, 0);
  if (subtotal < restaurant.minimumOrder) {
    throw new ApiError(400, `Minimum order KES ${restaurant.minimumOrder}`);
  }

  const deliveryFee = type === "delivery" ? restaurant.deliveryFee ?? 0 : 0;
  const total = subtotal + deliveryFee;

  const { commission } = await getContext();
  const commissionRate = commission.food || 10;
  const commissionAmount = (subtotal * commissionRate) / 100;

  const quoteDoc = await OrderQuote.create({
    quoteId: crypto.randomBytes(12).toString("hex"),
    customer: req.customer._id,
    restaurant: restaurantId,
    type,
    items: builtItems,
    subtotal,
    deliveryFee,
    total,
    currency: "KES",
    commissionRate,
    commissionAmount,
    restaurantEarnings: subtotal - commissionAmount,
    deliveryAddress:
      type === "delivery" ? deliveryAddress ?? null : null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        quoteId: quoteDoc.quoteId,
        expiresAt: quoteDoc.expiresAt,
        restaurantId,
        type,
        items: builtItems,
        subtotal,
        deliveryFee,
        total,
        currency: "KES",
        commissionRate,
        commissionAmount,
        partnerEarnings: subtotal - commissionAmount,
      },
      "Quote created"
    )
  );
});

const create = asyncHandler(async (req, res) => {
  const { quoteId, paymentReference, notes } = req.body;

  if (!quoteId) throw new ApiError(400, "quoteId required");
  if (!paymentReference) throw new ApiError(400, "paymentReference required");

  const quote = await OrderQuote.findOne({
    quoteId,
    customer: req.customer._id,
    consumed: false,
  });
  if (!quote) throw new ApiError(400, "Invalid or consumed quote");
  if (quote.expiresAt < new Date()) throw new ApiError(400, "Quote expired");

  const payment = await CustomerPayment.findOne({
    reference: paymentReference,
    customer: req.customer._id,
    purpose: "food_order",
    status: "success",
  });
  if (!payment) throw new ApiError(400, "Payment not found or not successful");
  if (payment.amount < quote.total) {
    throw new ApiError(400, "Payment amount does not cover the order total");
  }

  const existing = await FoodOrder.findOne({ paymentReference });
  if (existing) {
    return res
      .status(200)
      .json(new ApiResponse(200, existing, "Order already created"));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let order;
  try {
    order = await FoodOrder.create(
      [
        {
          reference: generateRef("ORD"),
          customer: req.customer._id,
          restaurant: quote.restaurant,
          type: quote.type,
          items: quote.items,
          subtotal: quote.subtotal,
          deliveryFee: quote.deliveryFee,
          total: quote.total,
          currency: quote.currency,
          commissionRate: quote.commissionRate,
          commissionAmount: quote.commissionAmount,
          restaurantEarnings: quote.restaurantEarnings,
          paymentMethod: payment.method,
          paymentReference,
          deliveryAddress: quote.deliveryAddress,
          customerNotes: notes || null,
          status: "pending",
          paymentStatus: "paid",
          orderType: "direct",
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    await Commission.create(
      [
        {
          type: "food",
          rate: quote.commissionRate,
          partner: quote.restaurant,
          partnerType: "restaurant",
          order: order._id,
          amount: quote.subtotal,
          commissionAmount: quote.commissionAmount,
          status: "owed",
        },
      ],
      { session }
    );

    await RestaurantWallet.findOneAndUpdate(
      { restaurant: quote.restaurant },
      {
        $inc: {
          balance: quote.restaurantEarnings,
          totalEarned: quote.restaurantEarnings,
          totalCommissionOwed: quote.commissionAmount,
        },
      },
      { upsert: true, session }
    );

    payment.relatedId = order._id;
    await payment.save({ session });

    quote.consumed = true;
    await quote.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();

    try {
      if (payment.method === "wallet") {
        const wallet = await CustomerWallet.findOne({
          customer: req.customer._id,
        });
        if (wallet) {
          wallet.balance += payment.amount;
          wallet.totalDebited = Math.max(
            0,
            wallet.totalDebited - payment.amount
          );
          await wallet.save();
        }
        payment.status = "refunded";
        payment.meta = {
          ...(payment.meta || {}),
          refundedAt: new Date().toISOString(),
          refundReason: err.message,
        };
        await payment.save();
        logger.warn("[order.refund] wallet refund issued", {
          reference: payment.reference,
          amount: payment.amount,
        });
      } else {
        payment.meta = {
          ...(payment.meta || {}),
          refundPending: true,
          refundReason: err.message,
        };
        await payment.save();
        logger.error("[order.refund] manual refund required", {
          reference: payment.reference,
          method: payment.method,
          amount: payment.amount,
        });
      }
    } catch (refundErr) {
      logger.error("[order.refund] refund failed", {
        reference: payment.reference,
        error: refundErr.message,
      });
    }

    throw err;
  } finally {
    await session.endSession();
  }

  const { branding, settings } = await getContext();

  try {
    socketService.emitToRestaurant(quote.restaurant.toString(), "order:new", {
      reference: order.reference,
      total: order.total,
      items: order.items.length,
    });
  } catch {
    /* socket optional */
  }

  try {
    await emailService.orderConfirmation(req.customer, {
      order,
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Order confirmation email failed", { error: err.message });
  }

  try {
    await smsService.orderConfirmation(req.customer, {
      reference: order.reference,
      total: `KES ${order.total}`,
    });
  } catch (err) {
    logger.error("Order confirmation SMS failed", { error: err.message });
  }

  try {
    const partner = await RestaurantPartner.findById(quote.restaurant)
      .select("name firstName lastName email phone town")
      .lean();

    if (partner?.email) {
      await emailService.newOrderReceived(partner, {
        order,
        customer: req.customer,
        branding,
        settings,
      });
    }
    if (partner?.phone) {
      await smsService.newOrderReceived(partner, {
        reference: order.reference,
        total: `KES ${order.total}`,
      });
    }
  } catch (err) {
    logger.error("Partner order notification failed", { error: err.message });
  }

  res.status(201).json(new ApiResponse(201, order, "Order placed"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    FoodOrder.find(filter)
      .populate("restaurant", "name logo town address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    FoodOrder.countDocuments(filter),
  ]);

  const enriched = items.map((o) => ({
    ...o,
    restaurantName: o.restaurant?.name || null,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: enriched,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  })
    .populate("restaurant", "name logo town address latitude longitude phone")
    .populate("deliveryJob")
    .lean();

  if (!order) throw new ApiError(404, "Order not found");

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...order,
        restaurantName: order.restaurant?.name || null,
      },
      "Order fetched"
    )
  );
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await FoodOrder.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (!["pending", "accepted"].includes(order.status)) {
    throw new ApiError(400, "Cannot cancel at this stage");
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelledBy = "customer";
  order.cancellationReason = reason || "Customer requested";
  await order.save();

  // Refund wallet-paid orders (mirrors booking refund-on-cancel)
  if (order.paymentStatus === "paid" && order.paymentReference) {
    const payment = await CustomerPayment.findOne({
      reference: order.paymentReference,
      customer: req.customer._id,
      status: "success",
    });
    if (payment) {
      try {
        if (payment.method === "wallet") {
          const wallet = await CustomerWallet.findOne({
            customer: req.customer._id,
          });
          if (wallet) {
            wallet.balance += payment.amount;
            wallet.totalDebited = Math.max(
              0,
              wallet.totalDebited - payment.amount
            );
            await wallet.save();
          }
          payment.status = "refunded";
          payment.meta = {
            ...(payment.meta || {}),
            refundedAt: new Date().toISOString(),
            refundReason: "Order cancelled by customer",
          };
          await payment.save();
          order.paymentStatus = "refunded";
          await order.save();

          // Reverse commission + restaurant wallet credit
          await Commission.findOneAndUpdate(
            { order: order._id },
            { status: "refunded" }
          );
          await RestaurantWallet.findOneAndUpdate(
            { restaurant: order.restaurant },
            {
              $inc: {
                balance: -(order.restaurantEarnings || 0),
                totalEarned: -(order.restaurantEarnings || 0),
                totalCommissionOwed: -(order.commissionAmount || 0),
              },
            }
          );
        } else {
          payment.meta = {
            ...(payment.meta || {}),
            refundPending: true,
            refundReason: "Order cancelled by customer",
          };
          await payment.save();
          logger.error("[order.cancel] manual refund required", {
            reference: payment.reference,
            method: payment.method,
          });
        }
      } catch (refundErr) {
        logger.error("[order.cancel] refund failed", {
          reference: payment.reference,
          error: refundErr.message,
        });
      }
    }
  }

  try {
    socketService.emitToRestaurant(order.restaurant.toString(), "order:cancelled", {
      reference: order.reference,
    });
  } catch {
    /* socket optional */
  }

  const { branding, settings } = await getContext();
  try {
    await emailService.orderCancelled(req.customer, {
      order,
      reason,
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Order cancellation email failed", { error: err.message });
  }
  try {
    await smsService.orderCancelled(req.customer, {
      reference: order.reference,
      reason,
    });
  } catch (err) {
    logger.error("Order cancellation SMS failed", { error: err.message });
  }

  res.status(200).json(new ApiResponse(200, order, "Order cancelled"));
});

const reorder = asyncHandler(async (req, res) => {
  const original = await FoodOrder.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!original) throw new ApiError(404, "Order not found");

  // Build a fresh quote from the original items (prices may have changed)
  req.body = {
    restaurantId: original.restaurant,
    items: original.items.map((i) => ({
      menuItem: i.menuItem,
      quantity: i.quantity,
      notes: i.notes,
    })),
    type: original.type,
    deliveryAddress: original.deliveryAddress,
  };

  return quote(req, res);
});

export { quote, create, list, details, cancel, reorder };