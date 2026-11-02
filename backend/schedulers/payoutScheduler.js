import RestaurantWallet from "../models/rest/RestaurantWallet.js";
import TransportWallet from "../models/trans/TransportWallet.js";
import AccommodationWallet from "../models/accom/AccommodationWallet.js";
import Payout from "../models/admin/Payout.js";
import SystemSetting from "../models/admin/SystemSetting.js";
import { generateRef } from "../utils/helpers.js";
import logger from "../utils/logger.js";

const getPayoutSettings = async () => {
  const doc = await SystemSetting.findOne({ key: "payout" });
  return (
    doc?.value || {
      minAmount: 500,
      schedule: "weekly",
      day: "friday",
      time: "17:00",
    }
  );
};

const processWallet = async (wallet, partnerType, settings) => {
  if (!wallet || wallet.balance <= 0) return null;
  if (wallet.balance < (wallet.minimumPayout || settings.minAmount)) return null;

  // Idempotency guard: don't create a second pending payout for the same wallet
  const existing = await Payout.findOne({
    partner: wallet.partner,
    partnerType,
    status: { $in: ["pending", "processing"] },
  });
  if (existing) return null;

  const payout = await Payout.create({
    partner: wallet.partner,
    partnerType,
    amount: wallet.balance,
    method: wallet.payoutMethod,
    type: "auto",
    status: "pending",
    reference: generateRef("PAY"),
    meta: {
      phone: wallet.payoutDetails?.phone || null,
      bank: wallet.payoutDetails?.bankName || null,
      accountNumber: wallet.payoutDetails?.accountNumber || null,
    },
  });

  wallet.pendingPayout = wallet.balance;
  wallet.balance = 0;
  wallet.lastPayoutAt = new Date();
  await wallet.save();

  return payout;
};

const runPayoutJob = async ({ force = false, partnerType = null } = {}) => {
  const settings = await getPayoutSettings();
  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  if (!force) {
    if (settings.schedule === "weekly" && dayNames[now.getDay()] !== settings.day) {
      return { skipped: true, reason: "outside weekly window", created: 0, partners: [] };
    }
    if (settings.schedule === "monthly" && now.getDate() !== 1) {
      return { skipped: true, reason: "outside monthly window", created: 0, partners: [] };
    }
    const [rh, rm] = settings.time.split(":").map(Number);
    if (now.getHours() !== rh || now.getMinutes() !== rm) {
      return { skipped: true, reason: "outside scheduled time", created: 0, partners: [] };
    }
  }

  const wantRest = !partnerType || partnerType === "restaurant";
  const wantTrans = !partnerType || partnerType === "transport";
  const wantAccom = !partnerType || partnerType === "accommodation";

  const [restWallets, transWallets, accomWallets] = await Promise.all([
    wantRest ? RestaurantWallet.find({ status: "active" }) : [],
    wantTrans ? TransportWallet.find({ status: "active" }) : [],
    wantAccom ? AccommodationWallet.find({ status: "active" }) : [],
  ]);

  const created = [];
  for (const w of restWallets) {
    const p = await processWallet(w, "restaurant", settings);
    if (p) created.push({ partner: w.partner, partnerType: "restaurant", payout: p.reference, amount: p.amount });
  }
  for (const w of transWallets) {
    const p = await processWallet(w, "transport", settings);
    if (p) created.push({ partner: w.partner, partnerType: "transport", payout: p.reference, amount: p.amount });
  }
  for (const w of accomWallets) {
    const p = await processWallet(w, "accommodation", settings);
    if (p) created.push({ partner: w.partner, partnerType: "accommodation", payout: p.reference, amount: p.amount });
  }

  logger.info(`Payout job completed. ${created.length} payouts queued.${force ? " (forced)" : ""}`);

  return { skipped: false, created: created.length, partners: created };
};

export { runPayoutJob };