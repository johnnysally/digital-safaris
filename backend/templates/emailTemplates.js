import {
  buildEmailLayout,
  buildEmailText,
  heading,
  paragraph,
  ctaButton,
  dataTable,
  highlightBox,
  divider,
  smallNote,
} from "./emailLayout.js";

const render = (ctx, bodyHtml, extra = {}) => ({
  subject: extra.subject || "",
  html: buildEmailLayout({ ...ctx, ...extra, bodyHtml }),
  text: buildEmailText(extra.textLines || []),
});

const resolveContext = (payload = {}) => {
  const branding = payload.branding || {};
  const settings = payload.settings || {};
  const site = settings.websiteUrl || "https://digitalsafaris.co.ke";
  return {
    logoUrl: branding.logoUrl || branding.logo || null,
    appName: settings.appName || "Digital Safaris",
    primaryColor: branding.primaryColor || "#1A1F2E",
    secondaryColor: branding.secondaryColor || "#C9A063",
    supportEmail: settings.supportEmail || "support@digitalsafaris.co.ke",
    supportPhone: settings.supportPhone || "",
    websiteUrl: site,
    legalTermsUrl: settings.legalTermsUrl || `${site}/terms`,
    legalPrivacyUrl: settings.legalPrivacyUrl || `${site}/privacy`,
    clientUrl: settings.clientUrl || settings.appUrl || site,
    partnerUrl: settings.partnerUrl || `${site}/partner`,
    adminUrl: settings.adminUrl || `${site}/admin`,
    socialLinks: settings.socialLinks || {},
  };
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const fmtMoney = (amount, currency = "KES") => {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${currency} ${amount}`;
  return `${currency} ${n.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
};

// ══════════════════════════════════════════════════════════════
// CUSTOMER — AUTH & ACCOUNT
// ══════════════════════════════════════════════════════════════

const welcomeCustomer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading(`Welcome to ${ctx.appName}, ${recipient.firstName}!`)}
    ${paragraph(`Your account is ready. Explore verified stays, local restaurants, and reliable transport across Kenya — all in one app.`)}
    ${highlightBox({ label: "What you can do", value: "Stays · Food · Transport", secondaryColor: ctx.secondaryColor })}
    ${ctaButton({ label: "Start exploring", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Need help? Reply to this email or contact ${ctx.supportEmail}.`)}
  `;
  return render(ctx, body, {
    subject: `Welcome to ${ctx.appName}`,
    textLines: [`Welcome, ${recipient.firstName}!`, `Explore: ${ctx.clientUrl}`, `Support: ${ctx.supportEmail}`],
    preheader: `Your Digital Safaris account is ready to use.`,
  });
};

const emailVerificationLink = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { link } = payload;
  const body = `
    ${heading("Verify your email")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Thanks for signing up. Click the button below to verify your email and activate your account.`)}
    ${ctaButton({ label: "Verify email", href: link, secondaryColor: ctx.secondaryColor })}
    ${paragraph(`Or paste this link into your browser:`, { margin: "12px 0 6px", size: 13, color: "#6b7280" })}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:8px;margin-bottom:16px;">
      <tr><td style="padding:14px 16px;font-family:Consolas,Monaco,monospace;font-size:12px;color:#374151;word-break:break-all;">${link}</td></tr>
    </table>
    ${smallNote(`This link expires in 48 hours. If you did not create this account, ignore this email.`)}
  `;
  return render(ctx, body, {
    subject: `Verify your email — ${ctx.appName}`,
    textLines: [`Verify your email: ${link}`, `Link expires in 48 hours.`],
    preheader: `Click to activate your ${ctx.appName} account.`,
  });
};

const passwordResetOTP = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Reset your password")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Use the code below to reset your password. It expires in 10 minutes.`)}
    ${highlightBox({ label: "Your code", value: payload.otp, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`If you did not request this, ignore this email.`)}
  `;
  return render(ctx, body, {
    subject: `Your password reset code: ${payload.otp}`,
    textLines: [`Your password reset code is ${payload.otp}. Expires in 10 minutes.`],
    preheader: `Your password reset code: ${payload.otp}`,
  });
};

const passwordChanged = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Password changed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your password was changed successfully.`)}
    ${paragraph(`If this wasn't you, contact us immediately at <a href="mailto:${ctx.supportEmail}" style="color:${ctx.secondaryColor};text-decoration:none;">${ctx.supportEmail}</a>.`)}
  `;
  return render(ctx, body, {
    subject: `Your ${ctx.appName} password was changed`,
    textLines: [`Your ${ctx.appName} password was changed.`],
    preheader: `Password change confirmed.`,
  });
};

const newDeviceLogin = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("New login detected")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A new login was detected on your account from:`)}
    ${dataTable([{ label: "Device", value: payload.device || "Unknown" }])}
    ${paragraph(`If this wasn't you, reset your password immediately and contact <a href="mailto:${ctx.supportEmail}" style="color:${ctx.secondaryColor};text-decoration:none;">${ctx.supportEmail}</a>.`)}
  `;
  return render(ctx, body, {
    subject: `New login to your account`,
    textLines: [`New login detected: ${payload.device}`],
    preheader: `A new device logged into your account.`,
  });
};

const accountSuspended = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Account suspended")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your account has been suspended.`)}
    ${dataTable([{ label: "Reason", value: payload.reason || "Not specified" }])}
    ${paragraph(`Contact <a href="mailto:${ctx.supportEmail}" style="color:${ctx.secondaryColor};text-decoration:none;">${ctx.supportEmail}</a> for assistance.`)}
  `;
  return render(ctx, body, {
    subject: `Your account has been suspended`,
    textLines: [`Your account was suspended. Reason: ${payload.reason}`],
    preheader: `Account suspended: ${payload.reason}`,
  });
};

const accountReactivated = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Account reactivated")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your account has been reactivated. You can now use all services.`)}
    ${ctaButton({ label: "Open app", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Your account is active again`,
    textLines: [`Your account has been reactivated.`],
    preheader: `Welcome back.`,
  });
};

const accountDeleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Account deleted")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your account has been permanently deleted. We're sorry to see you go.`)}
    ${smallNote(`If you believe this was in error, contact ${ctx.supportEmail} within 30 days.`)}
  `;
  return render(ctx, body, {
    subject: `Your ${ctx.appName} account has been deleted`,
    textLines: [`Your ${ctx.appName} account has been deleted.`],
    preheader: `Your account has been deleted.`,
  });
};

// ══════════════════════════════════════════════════════════════
// CUSTOMER — BOOKING LIFECYCLE
// ══════════════════════════════════════════════════════════════

const bookingConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const body = `
    ${heading("Booking confirmed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your stay at <strong>${property?.name || "your property"}</strong> is confirmed. We can't wait to host you.`)}
    ${highlightBox({ label: "Confirmation number", value: booking.reference, secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Property", value: property?.name || "—" },
      { label: "Location", value: [property?.town, property?.address].filter(Boolean).join(" · ") || "—" },
      { label: "Check-in", value: fmtDate(booking.checkIn) },
      { label: "Check-out", value: fmtDate(booking.checkOut) },
      { label: "Nights", value: String(booking.nights) },
      { label: "Guests", value: `${booking.guests?.adults ?? 0} adult${booking.guests?.adults === 1 ? "" : "s"}${booking.guests?.children ? ` · ${booking.guests.children} children` : ""}` },
      { label: "Rooms booked", value: String(booking.roomsBooked) },
      { label: "Total paid", value: fmtMoney(booking.total, booking.currency) },
    ])}
    ${ctaButton({ label: "View booking", href: `${ctx.clientUrl}/booking`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`You'll receive a reminder 24 hours before check-in. Contact the property directly if you need to make changes.`)}
  `;
  return render(ctx, body, {
    subject: `Booking confirmed — ${booking.reference}`,
    textLines: [
      `Booking confirmed at ${property?.name || "your property"}`,
      `Reference: ${booking.reference}`,
      `Check-in: ${fmtDate(booking.checkIn)}`,
      `Total: ${fmtMoney(booking.total, booking.currency)}`,
    ],
    preheader: `Your stay at ${property?.name || "the property"} is confirmed. Ref ${booking.reference}.`,
  });
};

const bookingReminder24h = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const body = `
    ${heading("Your stay is tomorrow")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A friendly reminder: your check-in at <strong>${property?.name || "the property"}</strong> is tomorrow.`)}
    ${dataTable([
      { label: "Address", value: `${property?.address || ""}, ${property?.town || ""}` },
      { label: "Check-in", value: fmtDate(booking.checkIn) },
      { label: "Check-in from", value: property?.checkInTime || "14:00" },
      { label: "Reference", value: booking.reference },
    ])}
    ${ctaButton({ label: "View directions", href: `${ctx.clientUrl}/booking`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Have your booking reference or QR code ready at reception.`)}
  `;
  return render(ctx, body, {
    subject: `Reminder: Check-in tomorrow at ${property?.name || "the property"}`,
    textLines: [`Check-in tomorrow at ${property?.name || "the property"}.`, `Ref: ${booking.reference}`],
    preheader: `Your check-in is tomorrow. Ref ${booking.reference}.`,
  });
};

const bookingReminder2h = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const body = `
    ${heading("Check-in in 2 hours")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your check-in at <strong>${property?.name || "the property"}</strong> is in 2 hours.`)}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Address", value: `${property?.address || ""}, ${property?.town || ""}` },
    ])}
    ${paragraph(`Have your QR code ready at reception for a smooth check-in.`)}
  `;
  return render(ctx, body, {
    subject: `Check-in in 2 hours — ${property?.name || "the property"}`,
    textLines: [`Check-in in 2 hours.`, `Ref: ${booking.reference}`],
    preheader: `Your check-in is in 2 hours.`,
  });
};

const bookingModified = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const body = `
    ${heading("Booking updated")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your booking${property?.name ? ` at <strong>${property.name}</strong>` : ""} has been updated.`)}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Check-in", value: fmtDate(booking.checkIn) },
      { label: "Check-out", value: fmtDate(booking.checkOut) },
      { label: "Total", value: fmtMoney(booking.total, booking.currency) },
    ])}
    ${ctaButton({ label: "View updated booking", href: `${ctx.clientUrl}/booking`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Booking updated — ${booking.reference}`,
    textLines: [`Booking ${booking.reference} updated.`],
    preheader: `Your booking has been updated.`,
  });
};

const bookingCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, reason } = payload;
  const body = `
    ${heading("Booking cancelled")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your booking <strong>${booking.reference}</strong> has been cancelled.`)}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Reason", value: reason || "Not provided" },
    ])}
    ${paragraph(`Any refund due will be processed within 3–5 business days to your original payment method.`)}
    ${ctaButton({ label: "Book another stay", href: `${ctx.clientUrl}/accommodation`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Booking cancelled — ${booking.reference}`,
    textLines: [`Booking ${booking.reference} cancelled.`, `Reason: ${reason || "Not provided"}`],
    preheader: `Your booking has been cancelled.`,
  });
};

const checkInConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const body = `
    ${heading("You're checked in")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`You've successfully checked in at <strong>${property?.name || "the property"}</strong>. Enjoy your stay!`)}
    ${highlightBox({ label: "Enjoy", value: "Have a great stay", secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Need anything during your stay? Contact the property directly.`)}
  `;
  return render(ctx, body, {
    subject: `Welcome to ${property?.name || "the property"}`,
    textLines: [`Checked in at ${property?.name || "the property"}.`],
    preheader: `You're checked in. Enjoy your stay.`,
  });
};

const checkOutConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const body = `
    ${heading("You're checked out")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Thank you for staying at <strong>${property?.name || "the property"}</strong>. We'd love to hear how it went.`)}
    ${ctaButton({ label: "Leave a review", href: `${ctx.clientUrl}/reviews`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Your review helps other travelers make better choices.`)}
  `;
  return render(ctx, body, {
    subject: `Thanks for staying at ${property?.name || "the property"}`,
    textLines: [`Thank you for staying at ${property?.name || "the property"}.`],
    preheader: `Thanks for staying with us. Leave a review.`,
  });
};

const refundProcessed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, reference } = payload;
  const body = `
    ${heading("Refund processed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A refund has been processed for your booking.`)}
    ${highlightBox({ label: "Refund amount", value: amount, secondaryColor: ctx.secondaryColor })}
    ${dataTable([{ label: "Reference", value: reference }])}
    ${smallNote(`Refunds typically appear in your account within 3–5 business days.`)}
  `;
  return render(ctx, body, {
    subject: `Refund processed — ${reference}`,
    textLines: [`Refund of ${amount} for ${reference} processed.`],
    preheader: `Your refund of ${amount} has been processed.`,
  });
};

const reviewRequest = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("How was your experience?")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`How was <strong>${payload.targetName || "your recent experience"}</strong>? Your feedback helps other travelers and rewards great hosts.`)}
    ${ctaButton({ label: "Write a review", href: `${ctx.clientUrl}/reviews`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `How was ${payload.targetName || "your recent experience"}?`,
    textLines: [`Please review ${payload.targetName || "your experience"}.`],
    preheader: `We'd love your review.`,
  });
};

const roomAssigned = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property, roomNumber, floor } = payload;
  const roomLabel = floor ? `Room ${roomNumber} · Floor ${floor}` : `Room ${roomNumber}`;
  const body = `
    ${heading("Your room is ready")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`We've assigned your room at <strong>${property?.name || "the property"}</strong>. See you soon!`)}
    ${highlightBox({ label: "Your room", value: roomLabel, secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Check-in", value: fmtDate(booking.checkIn) },
      { label: "Check-out", value: fmtDate(booking.checkOut) },
      { label: "Property", value: property?.name || "—" },
    ])}
    ${ctaButton({ label: "View booking", href: `${ctx.clientUrl}/booking`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Have your booking reference or QR code ready at reception for a smooth check-in.`)}
  `;
  return render(ctx, body, {
    subject: `Room assigned — ${booking.reference}`,
    textLines: [
      `Your room is ${roomLabel}.`,
      `Booking: ${booking.reference}`,
      `Check-in: ${fmtDate(booking.checkIn)}`,
    ],
    preheader: `You're in ${roomLabel}.`,
  });
};

// ══════════════════════════════════════════════════════════════
// CUSTOMER — ORDER LIFECYCLE
// ══════════════════════════════════════════════════════════════

const orderConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const itemRows = (order.items || [])
    .map((i) => `<tr><td style="padding:8px 16px;font-size:13px;color:#374151;">${i.quantity}× ${i.name}</td><td style="padding:8px 16px;font-size:13px;color:#111827;text-align:right;">${fmtMoney(i.subtotal, order.currency)}</td></tr>`)
    .join("");
  const body = `
    ${heading("Order confirmed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your order is in. We've sent it to the restaurant — you'll get a notification when they accept.`)}
    ${highlightBox({ label: "Order number", value: order.reference, secondaryColor: ctx.secondaryColor })}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:10px;overflow:hidden;margin:16px 0;">
      ${itemRows}
      <tr>
        <td style="padding:12px 16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Delivery fee</td>
        <td style="padding:12px 16px;border-top:1px solid #e5e7eb;font-size:13px;color:#111827;text-align:right;">${fmtMoney(order.deliveryFee || 0, order.currency)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;">Total</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;text-align:right;">${fmtMoney(order.total, order.currency)}</td>
      </tr>
    </table>
    ${ctaButton({ label: "Track order", href: `${ctx.clientUrl}/orders`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Order confirmed — ${order.reference}`,
    textLines: [`Order ${order.reference} confirmed. Total: ${fmtMoney(order.total, order.currency)}`],
    preheader: `Your order ${order.reference} is confirmed.`,
  });
};

const orderAccepted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, restaurant } = payload;
  const body = `
    ${heading("Order accepted")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`<strong>${restaurant?.name || "The restaurant"}</strong> has accepted your order and will start preparing it shortly.`)}
    ${dataTable([{ label: "Reference", value: order.reference }])}
    ${ctaButton({ label: "Track order", href: `${ctx.clientUrl}/orders`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Order accepted — ${order.reference}`,
    textLines: [`Order ${order.reference} accepted by ${restaurant?.name || "the restaurant"}.`],
    preheader: `Your order is being prepared.`,
  });
};

const orderPreparing = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const body = `
    ${heading("Your food is being prepared")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your order is being prepared in the kitchen. We'll notify you when it's ready.`)}
    ${dataTable([{ label: "Reference", value: order.reference }])}
  `;
  return render(ctx, body, {
    subject: `Preparing your order — ${order.reference}`,
    textLines: [`Order ${order.reference} is being prepared.`],
    preheader: `Your order is being prepared.`,
  });
};

const orderOutForDelivery = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, driver } = payload;
  const body = `
    ${heading("Out for delivery")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your order is on the way!`)}
    ${dataTable([
      { label: "Reference", value: order.reference },
      ...(driver ? [{ label: "Driver", value: `${driver.firstName} ${driver.lastName}` }, { label: "Driver phone", value: driver.phone }] : []),
    ])}
    ${ctaButton({ label: "Track delivery", href: `${ctx.clientUrl}/tracking`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Out for delivery — ${order.reference}`,
    textLines: [`Order ${order.reference} out for delivery.`],
    preheader: `Your order is on the way.`,
  });
};

const orderDelivered = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const body = `
    ${heading("Delivered")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your order has been delivered. Enjoy your meal!`)}
    ${dataTable([{ label: "Reference", value: order.reference }])}
    ${ctaButton({ label: "Rate your order", href: `${ctx.clientUrl}/reviews`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Order delivered — ${order.reference}`,
    textLines: [`Order ${order.reference} delivered.`],
    preheader: `Your order has arrived.`,
  });
};

const orderCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, reason } = payload;
  const body = `
    ${heading("Order cancelled")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your order <strong>${order.reference}</strong> has been cancelled.`)}
    ${dataTable([
      { label: "Reference", value: order.reference },
      { label: "Reason", value: reason || "Not provided" },
    ])}
    ${paragraph(`Any refund due will be processed within 3–5 business days.`)}
  `;
  return render(ctx, body, {
    subject: `Order cancelled — ${order.reference}`,
    textLines: [`Order ${order.reference} cancelled.`],
    preheader: `Your order has been cancelled.`,
  });
};

const deliveryReceipt = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const body = `
    ${heading("Delivery receipt")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Thank you for your order. Here's your receipt.`)}
    ${highlightBox({ label: "Total paid", value: fmtMoney(order.total, order.currency), secondaryColor: ctx.secondaryColor })}
    ${dataTable([{ label: "Order", value: order.reference }])}
  `;
  return render(ctx, body, {
    subject: `Receipt — ${order.reference}`,
    textLines: [`Receipt: ${fmtMoney(order.total, order.currency)}`],
    preheader: `Your receipt for order ${order.reference}.`,
  });
};

// ══════════════════════════════════════════════════════════════
// CUSTOMER — DINE-IN
// ══════════════════════════════════════════════════════════════

const dineInBookingConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const body = `
    ${heading("Table booked")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your table at <strong>${restaurant?.name || "the restaurant"}</strong> is confirmed.`)}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Date", value: fmtDateTime(booking.scheduledAt) },
      { label: "Party size", value: String(booking.partySize) },
      { label: "Restaurant", value: restaurant?.name || "—" },
    ])}
    ${ctaButton({ label: "View booking", href: `${ctx.clientUrl}/booking`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Table confirmed at ${restaurant?.name || "the restaurant"}`,
    textLines: [`Table confirmed at ${restaurant?.name || "the restaurant"}.`, `Ref: ${booking.reference}`],
    preheader: `Your table is booked.`,
  });
};

const dineInReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const body = `
    ${heading("Your table is in 2 hours")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Reminder: your reservation at <strong>${restaurant?.name || "the restaurant"}</strong> is coming up.`)}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Time", value: fmtDateTime(booking.scheduledAt) },
      { label: "Party size", value: String(booking.partySize) },
    ])}
  `;
  return render(ctx, body, {
    subject: `Reminder: Table at ${restaurant?.name || "the restaurant"}`,
    textLines: [`Reminder: Table at ${restaurant?.name || "the restaurant"}.`],
    preheader: `Your table is in 2 hours.`,
  });
};

const dineInAccepted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const body = `
    ${heading("Reservation accepted")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`<strong>${restaurant?.name || "The restaurant"}</strong> has accepted your reservation.`)}
    ${dataTable([{ label: "Reference", value: booking.reference }])}
  `;
  return render(ctx, body, {
    subject: `Booking accepted — ${booking.reference}`,
    textLines: [`Booking ${booking.reference} accepted.`],
    preheader: `Your reservation is confirmed.`,
  });
};

const dineInCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, reason } = payload;
  const body = `
    ${heading("Reservation cancelled")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your reservation <strong>${booking.reference}</strong> has been cancelled.`)}
    ${dataTable([
      { label: "Reference", value: booking.reference },
      { label: "Reason", value: reason || "Not provided" },
    ])}
  `;
  return render(ctx, body, {
    subject: `Reservation cancelled — ${booking.reference}`,
    textLines: [`Reservation ${booking.reference} cancelled.`],
    preheader: `Your reservation has been cancelled.`,
  });
};

const pickupReady = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const body = `
    ${heading("Your order is ready for pickup")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your order at <strong>${restaurant?.name || "the restaurant"}</strong> is ready for pickup.`)}
    ${dataTable([{ label: "Reference", value: booking.reference }])}
    ${ctaButton({ label: "Get directions", href: `${ctx.clientUrl}/booking`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Ready for pickup — ${booking.reference}`,
    textLines: [`Order ready for pickup at ${restaurant?.name || "the restaurant"}.`],
    preheader: `Your order is ready.`,
  });
};

const pickupCompleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const body = `
    ${heading("Pickup completed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Thank you for picking up from <strong>${restaurant?.name || "the restaurant"}</strong>. We hope you enjoy it!`)}
    ${ctaButton({ label: "Leave a review", href: `${ctx.clientUrl}/reviews`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Thanks for your pickup`,
    textLines: [`Pickup completed at ${restaurant?.name || "the restaurant"}.`],
    preheader: `Thanks for your order.`,
  });
};

// ══════════════════════════════════════════════════════════════
// CUSTOMER — TRIP LIFECYCLE
// ══════════════════════════════════════════════════════════════

const tripBookingConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const body = `
    ${heading("Trip confirmed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your trip is confirmed. Your driver will be with you shortly.`)}
    ${highlightBox({ label: "Trip number", value: trip.reference, secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Pickup", value: trip.pickup?.address || "—" },
      { label: "Drop-off", value: trip.dropoff?.address || "—" },
      { label: "Scheduled", value: fmtDateTime(trip.scheduledAt) },
      { label: "Distance", value: `${trip.distanceKm || 0} km` },
      { label: "Fare", value: fmtMoney(trip.fare, trip.currency) },
    ])}
    ${ctaButton({ label: "Track trip", href: `${ctx.clientUrl}/tracking`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`You can cancel free of charge until 15 minutes before pickup.`)}
  `;
  return render(ctx, body, {
    subject: `Trip confirmed — ${trip.reference}`,
    textLines: [`Trip ${trip.reference} confirmed.`, `Pickup: ${trip.pickup?.address || "—"}`, `Fare: ${fmtMoney(trip.fare, trip.currency)}`],
    preheader: `Trip confirmed. Pickup ${trip.pickup?.address || "—"}.`,
  });
};

const driverAssigned = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip, driver, vehicle } = payload;
  const body = `
    ${heading("Your driver is assigned")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`<strong>${driver.firstName} ${driver.lastName}</strong> will be driving you for trip <strong>${trip.reference}</strong>.`)}
    ${dataTable([
      { label: "Driver", value: `${driver.firstName} ${driver.lastName}` },
      { label: "Phone", value: driver.phone || "—" },
      { label: "Vehicle", value: vehicle ? `${vehicle.make} ${vehicle.model}` : "—" },
      { label: "Plate", value: vehicle?.plateNumber || "—" },
      { label: "Pickup", value: trip.pickup?.address || "—" },
    ])}
    ${ctaButton({ label: "Track on map", href: `${ctx.clientUrl}/tracking`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Driver assigned — ${trip.reference}`,
    textLines: [`Driver ${driver.firstName} ${driver.lastName} assigned.`, `Phone: ${driver.phone}`],
    preheader: `Your driver is ${driver.firstName} ${driver.lastName}.`,
  });
};

const driverArrivingSoon = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { driver } = payload;
  const body = `
    ${heading("Driver arriving soon")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your driver <strong>${driver.firstName} ${driver.lastName}</strong> is arriving soon. Please be ready.`)}
    ${dataTable([
      { label: "Driver", value: `${driver.firstName} ${driver.lastName}` },
      { label: "Phone", value: driver.phone || "—" },
    ])}
  `;
  return render(ctx, body, {
    subject: `Driver arriving soon`,
    textLines: [`Driver arriving soon. Phone: ${driver.phone}`],
    preheader: `Your driver is almost there.`,
  });
};

const tripStarted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const body = `
    ${heading("Trip started")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your trip <strong>${trip.reference}</strong> has started. Safe travels!`)}
  `;
  return render(ctx, body, {
    subject: `Trip started — ${trip.reference}`,
    textLines: [`Trip ${trip.reference} started.`],
    preheader: `Your trip has started.`,
  });
};

const tripCompleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const body = `
    ${heading("Trip completed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your trip has been completed. Thank you for choosing ${ctx.appName}.`)}
    ${highlightBox({ label: "Total fare", value: fmtMoney(trip.fare, trip.currency), secondaryColor: ctx.secondaryColor })}
    ${ctaButton({ label: "Rate your driver", href: `${ctx.clientUrl}/reviews`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Trip completed — ${trip.reference}`,
    textLines: [`Trip ${trip.reference} completed. Total: ${fmtMoney(trip.fare, trip.currency)}`],
    preheader: `Your trip has completed.`,
  });
};

const tripCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip, reason } = payload;
  const body = `
    ${heading("Trip cancelled")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your trip <strong>${trip.reference}</strong> has been cancelled.`)}
    ${dataTable([
      { label: "Reference", value: trip.reference },
      { label: "Reason", value: reason || "Not provided" },
    ])}
  `;
  return render(ctx, body, {
    subject: `Trip cancelled — ${trip.reference}`,
    textLines: [`Trip ${trip.reference} cancelled.`],
    preheader: `Your trip has been cancelled.`,
  });
};

// ══════════════════════════════════════════════════════════════
// CUSTOMER — PAYMENTS & WALLET
// ══════════════════════════════════════════════════════════════

const paymentReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment } = payload;
  const body = `
    ${heading("Payment received")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`We've received your payment. Thank you!`)}
    ${highlightBox({ label: "Amount paid", value: fmtMoney(payment.amount, payment.currency), secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Reference", value: payment.reference },
      { label: "Method", value: payment.method },
      { label: "Date", value: fmtDateTime(new Date()) },
    ])}
    ${smallNote(`Keep this email for your records. Questions? Contact ${ctx.supportEmail}.`)}
  `;
  return render(ctx, body, {
    subject: `Payment received — ${payment.reference}`,
    textLines: [`Payment of ${fmtMoney(payment.amount, payment.currency)} received.`, `Reference: ${payment.reference}`],
    preheader: `Payment of ${fmtMoney(payment.amount, payment.currency)} received.`,
  });
};

const paymentFailed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment, reason } = payload;
  const body = `
    ${heading("Payment failed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your payment could not be completed.`)}
    ${dataTable([
      { label: "Reference", value: payment.reference },
      { label: "Amount", value: fmtMoney(payment.amount, payment.currency) },
      { label: "Reason", value: reason || "Unknown" },
    ])}
    ${ctaButton({ label: "Try again", href: `${ctx.clientUrl}/payments`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Payment failed — ${payment.reference}`,
    textLines: [`Payment failed. Reason: ${reason || "Unknown"}`],
    preheader: `Payment could not be completed.`,
  });
};

const walletToppedUp = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, balance } = payload;
  const body = `
    ${heading("Wallet topped up")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your wallet has been topped up.`)}
    ${highlightBox({ label: "New balance", value: balance, secondaryColor: ctx.secondaryColor })}
    ${dataTable([{ label: "Topped up", value: amount }])}
    ${ctaButton({ label: "Open wallet", href: `${ctx.clientUrl}/wallet`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Wallet topped up`,
    textLines: [`Wallet topped up by ${amount}. New balance: ${balance}`],
    preheader: `Your wallet has been credited.`,
  });
};

const refundIssued = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, reference } = payload;
  const body = `
    ${heading("Refund issued")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A refund has been issued to your original payment method.`)}
    ${highlightBox({ label: "Amount", value: amount, secondaryColor: ctx.secondaryColor })}
    ${dataTable([{ label: "Reference", value: reference }])}
    ${smallNote(`Refunds typically appear within 3–5 business days.`)}
  `;
  return render(ctx, body, {
    subject: `Refund issued — ${reference}`,
    textLines: [`Refund of ${amount} issued for ${reference}.`],
    preheader: `Refund of ${amount} issued.`,
  });
};

const payoutToWallet = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, balance } = payload;
  const body = `
    ${heading("Payout received")}
    ${paragraph(`Hi ${recipient.firstName || recipient.name},`)}
    ${paragraph(`A payout has been credited to your wallet.`)}
    ${highlightBox({ label: "Amount", value: amount, secondaryColor: ctx.secondaryColor })}
    ${dataTable([{ label: "New balance", value: balance }])}
  `;
  return render(ctx, body, {
    subject: `Payout received`,
    textLines: [`Payout of ${amount} received. Balance: ${balance}`],
    preheader: `Payout of ${amount} received.`,
  });
};

// ══════════════════════════════════════════════════════════════
// PARTNER — APPLICATION & APPROVAL
// ══════════════════════════════════════════════════════════════

const partnerApplicationReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name || "there";
  const body = `
    ${heading("Application received")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Thanks for applying to join ${ctx.appName}. Our team will review your application within 24–48 hours and email you with the outcome.`)}
    ${highlightBox({ label: "What happens next", value: "Review · Decision · Email", secondaryColor: ctx.secondaryColor })}
    ${paragraph(`In the meantime, gather photos and business documents so you can be onboarded faster.`)}
    ${smallNote(`Questions? Reply to this email — we read every message.`)}
  `;
  return render(ctx, body, {
    subject: `We've received your application`,
    textLines: [`We've received your application. We'll review it within 24–48 hours.`],
    preheader: `Your application is under review.`,
  });
};

const partnerApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name || "there";
  const body = `
    ${heading("You're approved!")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Great news — your partner account is approved. You can now sign in and start receiving bookings.`)}
    ${ctaButton({ label: "Open partner dashboard", href: ctx.partnerUrl, secondaryColor: ctx.secondaryColor })}
    ${divider()}
    ${paragraph(`<strong>Getting started tips:</strong>`, { margin: "0 0 8px" })}
    <ul style="margin:0 0 16px;padding-left:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.75;color:#374151;">
      <li>Add photos to help customers choose you</li>
      <li>Set your pricing and availability</li>
      <li>Turn on notifications so you never miss a booking</li>
    </ul>
    ${smallNote(`Questions? Reply to this email or contact ${ctx.supportEmail}.`)}
  `;
  return render(ctx, body, {
    subject: `Your partner account is approved`,
    textLines: [`Your partner account is approved.`, `Sign in: ${ctx.partnerUrl}`],
    preheader: `Your partner account is approved. Start receiving bookings today.`,
  });
};

const partnerRejected = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name || "there";
  const body = `
    ${heading("Application not approved")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Unfortunately, your application was not approved.`)}
    ${dataTable([{ label: "Reason", value: payload.reason || "Not provided" }])}
    ${paragraph(`You're welcome to reapply once the issues above have been addressed.`)}
  `;
  return render(ctx, body, {
    subject: `Application status update`,
    textLines: [`Application not approved. Reason: ${payload.reason || "Not provided"}`],
    preheader: `Application status update.`,
  });
};

const partnerSuspended = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name || "there";
  const body = `
    ${heading("Account suspended")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Your account has been suspended.`)}
    ${dataTable([{ label: "Reason", value: payload.reason || "Policy violation" }])}
    ${paragraph(`Contact ${ctx.supportEmail} to resolve this.`)}
  `;
  return render(ctx, body, {
    subject: `Your account has been suspended`,
    textLines: [`Account suspended. Reason: ${payload.reason}`],
    preheader: `Account suspended.`,
  });
};

const partnerReactivated = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name || "there";
  const body = `
    ${heading("Account reactivated")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Your account has been reactivated. You can start receiving bookings again.`)}
    ${ctaButton({ label: "Open dashboard", href: ctx.partnerUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Account reactivated`,
    textLines: [`Account reactivated.`],
    preheader: `Welcome back.`,
  });
};

const vehicleApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { vehicle } = payload;
  const body = `
    ${heading("Vehicle approved")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your vehicle is approved and ready to accept trips.`)}
    ${dataTable([
      { label: "Vehicle", value: `${vehicle.make} ${vehicle.model}` },
      { label: "Plate", value: vehicle.plateNumber },
    ])}
  `;
  return render(ctx, body, {
    subject: `Vehicle approved`,
    textLines: [`Vehicle ${vehicle.plateNumber} approved.`],
    preheader: `Your vehicle is approved.`,
  });
};

const vehicleRejected = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { vehicle, reason } = payload;
  const body = `
    ${heading("Vehicle not approved")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your vehicle could not be approved.`)}
    ${dataTable([
      { label: "Vehicle", value: `${vehicle.make} ${vehicle.model}` },
      { label: "Plate", value: vehicle.plateNumber },
      { label: "Reason", value: reason || "Not provided" },
    ])}
  `;
  return render(ctx, body, {
    subject: `Vehicle not approved`,
    textLines: [`Vehicle not approved.`],
    preheader: `Vehicle review outcome.`,
  });
};

const propertyApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const body = `
    ${heading("Property approved")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`Your property is now live and bookable.`)}
    ${dataTable([{ label: "Property", value: property.name }])}
    ${ctaButton({ label: "View listing", href: `${ctx.partnerUrl}/accommodation/properties`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Property approved`,
    textLines: [`Property ${property.name} approved.`],
    preheader: `Your property is live.`,
  });
};

const propertyRejected = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property, reason } = payload;
  const body = `
    ${heading("Property not approved")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`Your property could not be approved.`)}
    ${dataTable([
      { label: "Property", value: property.name },
      { label: "Reason", value: reason || "Not provided" },
    ])}
  `;
  return render(ctx, body, {
    subject: `Property not approved`,
    textLines: [`Property not approved.`],
    preheader: `Property review outcome.`,
  });
};

const roomApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { room } = payload;
  const body = `
    ${heading("Room approved")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`Your room is now live and bookable.`)}
    ${dataTable([{ label: "Room", value: room.name }])}
  `;
  return render(ctx, body, {
    subject: `Room approved`,
    textLines: [`Room ${room.name} approved.`],
    preheader: `Your room is live.`,
  });
};

// ══════════════════════════════════════════════════════════════
// PARTNER — TRANSACTIONAL NOTIFICATIONS
// ══════════════════════════════════════════════════════════════

const newBookingReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property, customer } = payload;
  const guestName = customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "A customer";
  const body = `
    ${heading("New booking received")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`You have a new booking at <strong>${property?.name || "your property"}</strong>. Please review and confirm within 24 hours.`)}
    ${highlightBox({ label: "Booking reference", value: booking.reference, secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Guest", value: guestName },
      { label: "Guest phone", value: customer?.phone || "—" },
      { label: "Check-in", value: fmtDate(booking.checkIn) },
      { label: "Check-out", value: fmtDate(booking.checkOut) },
      { label: "Nights", value: String(booking.nights) },
      { label: "Rooms booked", value: String(booking.roomsBooked) },
      { label: "Guests", value: `${booking.guests?.adults ?? 0} adults${booking.guests?.children ? ` · ${booking.guests.children} children` : ""}` },
      { label: "You earn", value: fmtMoney(booking.partnerEarnings ?? booking.total, booking.currency) },
    ])}
    ${booking.specialRequests ? paragraph(`<strong>Special requests:</strong> ${booking.specialRequests}`, { margin: "8px 0 16px" }) : ""}
    ${ctaButton({ label: "Review booking", href: `${ctx.partnerUrl}/accommodation/bookings`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Confirming is instant and notifies the guest. If you can't host, please reject the booking so the guest can rebook elsewhere.`)}
  `;
  return render(ctx, body, {
    subject: `New booking — ${booking.reference}`,
    textLines: [
      `New booking from ${guestName}`,
      `Reference: ${booking.reference}`,
      `Check-in: ${fmtDate(booking.checkIn)}`,
      `Manage: ${ctx.partnerUrl}/accommodation/bookings`,
    ],
    preheader: `New booking from ${guestName}. Ref ${booking.reference}.`,
  });
};

const newOrderReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, customer } = payload;
  const guestName = customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "A customer";
  const itemRows = (order.items || [])
    .map((i) => `<tr><td style="padding:8px 16px;font-size:13px;color:#374151;">${i.quantity}× ${i.name}</td><td style="padding:8px 16px;font-size:13px;color:#111827;text-align:right;font-weight:600;">${fmtMoney(i.subtotal, order.currency)}</td></tr>`)
    .join("");
  const body = `
    ${heading("New order received")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`You have a new order from <strong>${guestName}</strong>. Please accept or reject it within 5 minutes.`)}
    ${highlightBox({ label: "Order total", value: fmtMoney(order.total, order.currency), secondaryColor: ctx.secondaryColor })}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:10px;overflow:hidden;margin:16px 0;">
      ${itemRows}
      <tr>
        <td style="padding:12px 16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Delivery fee</td>
        <td style="padding:12px 16px;border-top:1px solid #e5e7eb;font-size:13px;color:#111827;text-align:right;">${fmtMoney(order.deliveryFee || 0, order.currency)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;">Total</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;text-align:right;">${fmtMoney(order.total, order.currency)}</td>
      </tr>
    </table>
    ${paragraph(`<strong>Type:</strong> ${order.type === "delivery" ? "Delivery" : "Pickup"}`, { margin: "8px 0 16px", size: 13 })}
    ${ctaButton({ label: "Review order", href: `${ctx.partnerUrl}/restaurant/orders`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Orders auto-cancel if not accepted within 15 minutes.`)}
  `;
  return render(ctx, body, {
    subject: `New order — ${order.reference}`,
    textLines: [`New order ${order.reference}. Total: ${fmtMoney(order.total, order.currency)}.`, `Manage: ${ctx.partnerUrl}/restaurant/orders`],
    preheader: `New order from ${guestName}. Total ${fmtMoney(order.total, order.currency)}.`,
  });
};

const newBroadcastReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { request } = payload;
  const body = `
    ${heading("New food broadcast request")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`A customer near you is looking for food. First restaurant to accept wins.`)}
    ${dataTable([
      { label: "Food", value: request.foodType },
      { label: "Preparation", value: request.preparation },
      { label: "Needed by", value: fmtDateTime(request.timeNeeded) },
      { label: "Budget", value: fmtMoney(request.budget, request.currency) },
    ])}
    ${ctaButton({ label: "Accept request", href: `${ctx.partnerUrl}/restaurant/broadcasts`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`This request expires at ${fmtDateTime(request.broadcastExpiresAt)}.`)}
  `;
  return render(ctx, body, {
    subject: `New broadcast request — ${request.reference}`,
    textLines: [`New broadcast: ${request.foodType}`, `View: ${ctx.partnerUrl}/restaurant/broadcasts`],
    preheader: `New broadcast request. First to accept wins.`,
  });
};

const orderCancelledByCustomer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, reason } = payload;
  const body = `
    ${heading("Order cancelled by customer")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`Order <strong>${order.reference}</strong> has been cancelled by the customer.`)}
    ${dataTable([{ label: "Reason", value: reason || "Not provided" }])}
  `;
  return render(ctx, body, {
    subject: `Order cancelled — ${order.reference}`,
    textLines: [`Order ${order.reference} cancelled by customer.`],
    preheader: `Order cancelled by customer.`,
  });
};

const newTripRequest = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip, customer } = payload;
  const guestName = customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "A customer";
  const body = `
    ${heading("New trip request")}
    ${paragraph(`Hi ${recipient.firstName || "there"},`)}
    ${paragraph(`You have a new trip request from <strong>${guestName}</strong>.`)}
    ${dataTable([
      { label: "Pickup", value: trip.pickup?.address || "—" },
      { label: "Drop-off", value: trip.dropoff?.address || "—" },
      { label: "Distance", value: `${trip.distanceKm || 0} km` },
      { label: "Fare", value: fmtMoney(trip.fare, trip.currency) },
      { label: "Scheduled", value: fmtDateTime(trip.scheduledAt) },
      { label: "Passengers", value: String(trip.passengers || 1) },
    ])}
    ${ctaButton({ label: "Accept trip", href: `${ctx.partnerUrl}/transport/trips`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `New trip request — ${trip.reference}`,
    textLines: [`New trip ${trip.reference}. Fare ${fmtMoney(trip.fare, trip.currency)}.`],
    preheader: `New trip from ${guestName}.`,
  });
};

const guestCheckedIn = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { guest, booking } = payload;
  const body = `
    ${heading("Guest checked in")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`<strong>${guest.firstName} ${guest.lastName}</strong> has checked in.`)}
    ${dataTable([{ label: "Booking", value: booking.reference }])}
  `;
  return render(ctx, body, {
    subject: `Guest checked in`,
    textLines: [`${guest.firstName} ${guest.lastName} checked in for ${booking.reference}.`],
    preheader: `Guest has checked in.`,
  });
};

const guestCheckedOut = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { guest, booking } = payload;
  const body = `
    ${heading("Guest checked out")}
    ${paragraph(`Hi ${recipient.name || recipient.firstName || "there"},`)}
    ${paragraph(`<strong>${guest.firstName} ${guest.lastName}</strong> has checked out.`)}
    ${dataTable([{ label: "Booking", value: booking.reference }])}
  `;
  return render(ctx, body, {
    subject: `Guest checked out`,
    textLines: [`${guest.firstName} ${guest.lastName} checked out.`],
    preheader: `Guest has checked out.`,
  });
};

const paymentReceivedPartner = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment } = payload;
  const name = recipient.name || recipient.firstName || "there";
  const body = `
    ${heading("Payment received")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Payment for <strong>${payment.reference}</strong> has been received.`)}
    ${highlightBox({ label: "Amount", value: fmtMoney(payment.amount, payment.currency), secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Payment received`,
    textLines: [`Payment of ${fmtMoney(payment.amount, payment.currency)} received.`],
    preheader: `Payment received.`,
  });
};

const payoutProcessed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const name = recipient.name || recipient.firstName || "there";
  const body = `
    ${heading("Payout processed")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Your payout has been processed and is on its way.`)}
    ${highlightBox({ label: "Amount", value: fmtMoney(payout.amount, payout.currency), secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Method", value: payout.method },
      { label: "Reference", value: payout.reference },
    ])}
  `;
  return render(ctx, body, {
    subject: `Payout processed`,
    textLines: [`Payout of ${fmtMoney(payout.amount, payout.currency)} processed.`],
    preheader: `Payout processed.`,
  });
};

const payoutFailed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout, reason } = payload;
  const name = recipient.name || recipient.firstName || "there";
  const body = `
    ${heading("Payout failed")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Your payout could not be processed.`)}
    ${dataTable([
      { label: "Amount", value: fmtMoney(payout.amount, payout.currency) },
      { label: "Reason", value: reason || "Not provided" },
    ])}
    ${paragraph(`Contact ${ctx.supportEmail} for help.`)}
  `;
  return render(ctx, body, {
    subject: `Payout failed`,
    textLines: [`Payout failed. Reason: ${reason || "Not provided"}`],
    preheader: `Payout failed.`,
  });
};

const weeklyEarningsSummary = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { summary } = payload;
  const name = recipient.name || recipient.firstName || "there";
  const body = `
    ${heading("Weekly earnings summary")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`Here's your earnings summary for the week.`)}
    ${highlightBox({ label: "Net earnings", value: fmtMoney(summary.net, summary.currency), secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Orders", value: String(summary.orders) },
      { label: "Gross", value: fmtMoney(summary.gross, summary.currency) },
      { label: "Commission", value: fmtMoney(summary.commission, summary.currency) },
    ])}
  `;
  return render(ctx, body, {
    subject: `Weekly earnings summary`,
    textLines: [`Weekly earnings: ${fmtMoney(summary.net, summary.currency)}`],
    preheader: `Your weekly earnings summary.`,
  });
};

const reviewReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { review } = payload;
  const name = recipient.name || recipient.firstName || "there";
  const body = `
    ${heading("New review received")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph(`You received a <strong>${review.rating}-star</strong> review.`)}
    ${review.comment ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:10px;margin:16px 0;"><tr><td style="padding:16px;font-style:italic;color:#374151;">"${review.comment}"</td></tr></table>` : ""}
    ${ctaButton({ label: "Reply to review", href: `${ctx.partnerUrl}`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `New review received`,
    textLines: [`New ${review.rating}-star review received.`],
    preheader: `New ${review.rating}-star review received.`,
  });
};

// ══════════════════════════════════════════════════════════════
// ADMIN — OPERATIONAL
// ══════════════════════════════════════════════════════════════

const adminNewPartnerApplication = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { partnerType, partner } = payload;
  const name = partner.name || `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "Unnamed";
  const body = `
    ${heading("New partner application")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A new <strong>${partnerType}</strong> partner has applied to join. Please review.`)}
    ${dataTable([
      { label: "Type", value: partnerType },
      { label: "Name", value: name },
      { label: "Email", value: partner.email || "—" },
      { label: "Phone", value: partner.phone || "—" },
      { label: "Town", value: partner.town || "—" },
    ])}
    ${ctaButton({ label: "Review application", href: `${ctx.adminUrl}/partners`, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Partners expect a decision within 24–48 hours.`)}
  `;
  return render(ctx, body, {
    subject: `New ${partnerType} partner application`,
    textLines: [`New ${partnerType} application from ${partner.email}.`, `Review: ${ctx.adminUrl}/partners`],
    preheader: `New ${partnerType} application from ${name}.`,
  });
};

const adminNewDispute = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { dispute } = payload;
  const body = `
    ${heading("New dispute raised")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A new dispute has been raised. Please review and assign.`)}
    ${dataTable([
      { label: "Reference", value: dispute.reference },
      { label: "Category", value: dispute.category },
      { label: "Subject", value: dispute.subject },
    ])}
    ${ctaButton({ label: "Open dispute", href: `${ctx.adminUrl}/disputes`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `New dispute — ${dispute.reference}`,
    textLines: [`New dispute ${dispute.reference}.`, `View: ${ctx.adminUrl}/disputes`],
    preheader: `New dispute ${dispute.reference}.`,
  });
};

const adminNewContact = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { contact } = payload;
  const body = `
    ${heading("New contact message")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`You've received a new contact form submission.`)}
    ${dataTable([
      { label: "From", value: `${contact.name} (${contact.email})` },
      { label: "Subject", value: contact.subject },
    ])}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:10px;margin:16px 0;">
      <tr><td style="padding:16px;font-size:14px;color:#374151;line-height:1.6;">${contact.message}</td></tr>
    </table>
    ${ctaButton({ label: "Open in admin", href: `${ctx.adminUrl}/contacts`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `New contact message`,
    textLines: [`New contact from ${contact.email}`, `Open: ${ctx.adminUrl}/contacts`],
    preheader: `New contact from ${contact.name}.`,
  });
};

const adminPayoutApprovalRequired = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const body = `
    ${heading("Payout approval required")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A payout is awaiting your approval.`)}
    ${highlightBox({ label: "Amount", value: fmtMoney(payout.amount, payout.currency), secondaryColor: ctx.secondaryColor })}
    ${dataTable([{ label: "Reference", value: payout.reference }])}
    ${ctaButton({ label: "Review payout", href: `${ctx.adminUrl}/payouts`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Payout approval required`,
    textLines: [`Payout approval required: ${payout.reference}`, `Review: ${ctx.adminUrl}/payouts`],
    preheader: `Payout approval required.`,
  });
};

const adminManualPayoutRequest = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const body = `
    ${heading("Manual payout request")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A manual payout request has been submitted.`)}
    ${highlightBox({ label: "Amount", value: fmtMoney(payout.amount, payout.currency), secondaryColor: ctx.secondaryColor })}
    ${ctaButton({ label: "Review request", href: `${ctx.adminUrl}/payouts`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Manual payout request`,
    textLines: [`Manual payout request: ${payout.reference}`, `Review: ${ctx.adminUrl}/payouts`],
    preheader: `Manual payout request.`,
  });
};

const adminCommissionLedgerAlert = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { ledger } = payload;
  const body = `
    ${heading("Commission ledger alert")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Partner <strong>${ledger.partnerName}</strong> has outstanding commission.`)}
    ${highlightBox({ label: "Outstanding", value: fmtMoney(ledger.amount, ledger.currency), secondaryColor: ctx.secondaryColor })}
    ${ctaButton({ label: "Open ledger", href: `${ctx.adminUrl}/commissions`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Commission ledger alert`,
    textLines: [`Commission owed: ${fmtMoney(ledger.amount, ledger.currency)}`],
    preheader: `Commission ledger alert.`,
  });
};

const adminFailedPayment = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment } = payload;
  const body = `
    ${heading("Failed payment alert")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A customer payment failed.`)}
    ${dataTable([
      { label: "Reference", value: payment.reference },
      { label: "Reason", value: payment.failureReason || "Unknown" },
    ])}
    ${ctaButton({ label: "View payment", href: `${ctx.adminUrl}/payments`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Failed payment alert`,
    textLines: [`Payment ${payment.reference} failed.`],
    preheader: `Failed payment alert.`,
  });
};

const adminFailedPayout = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const body = `
    ${heading("Failed payout alert")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A payout failed.`)}
    ${dataTable([
      { label: "Reference", value: payout.reference },
      { label: "Reason", value: payout.failureReason || "Unknown" },
    ])}
    ${ctaButton({ label: "View payout", href: `${ctx.adminUrl}/payouts`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Failed payout alert`,
    textLines: [`Payout ${payout.reference} failed.`],
    preheader: `Failed payout alert.`,
  });
};

const adminBackupCompleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { backup } = payload;
  const body = `
    ${heading("Backup completed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`The scheduled backup completed successfully.`)}
    ${dataTable([
      { label: "Filename", value: backup.filename },
      { label: "Size", value: `${backup.size} bytes` },
    ])}
    ${ctaButton({ label: "View backups", href: `${ctx.adminUrl}/backups`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Backup completed`,
    textLines: [`Backup ${backup.filename} completed.`],
    preheader: `Backup completed.`,
  });
};

const adminBackupFailed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Backup failed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`The scheduled backup failed.`)}
    ${dataTable([{ label: "Reason", value: payload.reason || "Unknown" }])}
    ${ctaButton({ label: "Open backups", href: `${ctx.adminUrl}/backups`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Backup failed`,
    textLines: [`Backup failed: ${payload.reason}`],
    preheader: `Backup failed.`,
  });
};

const adminRevenueSummary = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { summary, period } = payload;
  const body = `
    ${heading(`${period} revenue summary`)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${highlightBox({ label: "Total revenue", value: fmtMoney(summary.total, summary.currency), secondaryColor: ctx.secondaryColor })}
    ${dataTable([
      { label: "Food", value: fmtMoney(summary.food, summary.currency) },
      { label: "Transport", value: fmtMoney(summary.transport, summary.currency) },
      { label: "Accommodation", value: fmtMoney(summary.accommodation, summary.currency) },
    ])}
    ${ctaButton({ label: "View reports", href: `${ctx.adminUrl}/reports`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `${period} revenue summary`,
    textLines: [`${period} revenue: ${fmtMoney(summary.total, summary.currency)}`],
    preheader: `${period} revenue summary.`,
  });
};

const adminSystemHealthAlert = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { alert } = payload;
  const body = `
    ${heading("System health alert")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${dataTable([{ label: "Alert", value: alert.title }])}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8f7;border:1px solid #eed3cf;border-radius:10px;margin:16px 0;">
      <tr><td style="padding:16px;color:#914940;font-size:14px;line-height:1.6;">${alert.message}</td></tr>
    </table>
    ${ctaButton({ label: "Open health", href: `${ctx.adminUrl}/health`, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `System alert — ${alert.title}`,
    textLines: [`System alert: ${alert.title}`, `Open: ${ctx.adminUrl}/health`],
    preheader: `System alert: ${alert.title}`,
  });
};

const adminInvited = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const inviterName = payload.inviter?.firstName
    ? `${payload.inviter.firstName}${payload.inviter.lastName ? " " + payload.inviter.lastName : ""}`
    : "The Digital Safaris team";
  const body = `
    ${heading("You're invited as admin")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`${inviterName} has invited you to join as an admin on ${ctx.appName}.`)}
    ${dataTable([
      { label: "Email", value: recipient.email },
      { label: "Temporary password", value: payload.tempPassword || "—" },
    ])}
    ${ctaButton({ label: "Log in to admin", href: ctx.adminUrl, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`You'll be prompted to change your password after first login.`)}
  `;
  return render(ctx, body, {
    subject: `You've been invited as admin`,
    textLines: [`Admin invitation. Temp password: ${payload.tempPassword}`, `Log in: ${ctx.adminUrl}`],
    preheader: `You've been invited to join ${ctx.appName} as admin.`,
  });
};

const adminAccountCreated = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Admin account created")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your admin account has been created.`)}
    ${ctaButton({ label: "Open admin", href: ctx.adminUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Admin account created`,
    textLines: [`Your admin account has been created.`],
    preheader: `Admin account created.`,
  });
};

const adminRoleChanged = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Your role has changed")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your role has been updated.`)}
    ${dataTable([
      { label: "Previous role", value: payload.oldRole },
      { label: "New role", value: payload.newRole },
    ])}
  `;
  return render(ctx, body, {
    subject: `Your role was changed`,
    textLines: [`Role changed from ${payload.oldRole} to ${payload.newRole}.`],
    preheader: `Role changed.`,
  });
};

const adminAccountSuspended = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Admin account suspended")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your admin account has been suspended.`)}
    ${dataTable([{ label: "Reason", value: payload.reason || "Policy violation" }])}
  `;
  return render(ctx, body, {
    subject: `Admin account suspended`,
    textLines: [`Admin account suspended. Reason: ${payload.reason}`],
    preheader: `Admin account suspended.`,
  });
};

// ══════════════════════════════════════════════════════════════
// MARKETING / LIFECYCLE
// ══════════════════════════════════════════════════════════════

const welcomeSeriesDay0 = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading(`Welcome to ${ctx.appName}`)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Start exploring accommodations, restaurants, and transport in one app.`)}
    ${ctaButton({ label: "Explore now", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Welcome to ${ctx.appName}`,
    textLines: [`Welcome to ${ctx.appName}.`],
    preheader: `Welcome to ${ctx.appName}.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const welcomeSeriesDay3 = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Have you tried the AI concierge?")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Ask our concierge anything — restaurant recommendations, local tips, or travel advice.`)}
    ${ctaButton({ label: "Try the concierge", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Try the ${ctx.appName} concierge`,
    textLines: [`Try the AI concierge.`],
    preheader: `Meet your AI travel concierge.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const welcomeSeriesDay7 = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Your first booking awaits")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Book your first stay and unlock exclusive member rates.`)}
    ${ctaButton({ label: "Book now", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Book your first stay`,
    textLines: [`Book your first stay.`],
    preheader: `Your first booking awaits.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const promotionalOffer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { offer } = payload;
  const body = `
    ${heading(offer.title)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(offer.message)}
    ${offer.code ? highlightBox({ label: "Use code", value: offer.code, secondaryColor: ctx.secondaryColor }) : ""}
    ${ctaButton({ label: "Claim offer", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: offer.title,
    textLines: [`${offer.title}: ${offer.message}`],
    preheader: offer.message,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const newRestaurantInTown = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const body = `
    ${heading(`New restaurant in ${recipient.town}`)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`<strong>${restaurant.name}</strong> just joined ${ctx.appName}.`)}
    ${restaurant.description ? paragraph(restaurant.description) : ""}
    ${ctaButton({ label: "View restaurant", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `New restaurant in ${recipient.town}`,
    textLines: [`New restaurant: ${restaurant.name}`],
    preheader: `New restaurant in ${recipient.town}.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const newAccommodationInTown = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { accommodation } = payload;
  const body = `
    ${heading(`New stay in ${recipient.town}`)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`<strong>${accommodation.name}</strong> just joined ${ctx.appName}.`)}
    ${accommodation.description ? paragraph(accommodation.description) : ""}
    ${ctaButton({ label: "View stay", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `New stay in ${recipient.town}`,
    textLines: [`New accommodation: ${accommodation.name}`],
    preheader: `New stay in ${recipient.town}.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const seasonalDeals = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { deals } = payload;
  const list = deals.map((d) => `<li style="margin-bottom:8px;"><strong>${d.title}</strong> — ${d.description}</li>`).join("");
  const body = `
    ${heading("Seasonal deals")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.75;color:#374151;">${list}</ul>
    ${ctaButton({ label: "View deals", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Seasonal deals for you`,
    textLines: [`Seasonal deals available.`],
    preheader: `Seasonal deals available.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const abandonedBookingReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const body = `
    ${heading("You left something behind")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`You were looking at <strong>${property.name}</strong>. Complete your booking before it's gone.`)}
    ${ctaButton({ label: "Complete booking", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Complete your booking`,
    textLines: [`Complete your booking at ${property.name}.`],
    preheader: `Complete your booking at ${property.name}.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const abandonedOrderReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const body = `
    ${heading("Still hungry?")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`You left items in your cart from <strong>${restaurant.name}</strong>.`)}
    ${ctaButton({ label: "Complete order", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Complete your order`,
    textLines: [`Complete your order at ${restaurant.name}.`],
    preheader: `Your cart is waiting.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const loyaltyMilestone = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { milestone } = payload;
  const body = `
    ${heading("Milestone reached")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`You've reached <strong>${milestone.title}</strong>! ${milestone.reward || ""}`)}
  `;
  return render(ctx, body, {
    subject: `You reached ${milestone.title}`,
    textLines: [`Milestone reached: ${milestone.title}`],
    preheader: `You reached ${milestone.title}.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const referralRewardEarned = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { reward } = payload;
  const body = `
    ${heading("Referral reward earned")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`You earned <strong>${reward.amount}</strong> for referring ${reward.friendName}.`)}
  `;
  return render(ctx, body, {
    subject: `You earned a reward`,
    textLines: [`Referral reward: ${reward.amount}`],
    preheader: `You earned a reward.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const referralJoined = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { friend } = payload;
  const body = `
    ${heading("Your friend joined")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`<strong>${friend.firstName}</strong> joined ${ctx.appName} using your referral code.`)}
  `;
  return render(ctx, body, {
    subject: `${friend.firstName} joined using your code`,
    textLines: [`${friend.firstName} joined using your code.`],
    preheader: `${friend.firstName} joined using your code.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const birthdayOffer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { offer } = payload;
  const body = `
    ${heading(`Happy birthday, ${recipient.firstName}!`)}
    ${paragraph(offer.message)}
    ${offer.code ? highlightBox({ label: "Use code", value: offer.code, secondaryColor: ctx.secondaryColor }) : ""}
  `;
  return render(ctx, body, {
    subject: `Happy birthday, ${recipient.firstName}!`,
    textLines: [`Happy birthday! ${offer.message}`],
    preheader: `Happy birthday from ${ctx.appName}.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const reEngagement = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading(`We miss you, ${recipient.firstName}`)}
    ${paragraph(`It's been a while. Come back and see what's new on ${ctx.appName}.`)}
    ${ctaButton({ label: "Come back", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `We miss you`,
    textLines: [`We miss you at ${ctx.appName}.`],
    preheader: `We miss you.`,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const newsletter = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { issue } = payload;
  const body = `
    ${heading(issue.title)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${issue.content}
  `;
  return render(ctx, body, {
    subject: issue.title,
    textLines: [issue.title],
    preheader: issue.title,
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

// ══════════════════════════════════════════════════════════════
// SECURITY / OTP
// ══════════════════════════════════════════════════════════════

const twoFactorCode = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Two-factor code")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your 2FA code is:`)}
    ${highlightBox({ label: "Your code", value: payload.code, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Your 2FA code`,
    textLines: [`Your 2FA code is ${payload.code}.`],
    preheader: `Your 2FA code: ${payload.code}`,
  });
};

const sessionRevoked = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Session revoked")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`A session on <strong>${payload.device}</strong> was revoked.`)}
    ${paragraph(`If this wasn't you, contact ${ctx.supportEmail}.`)}
  `;
  return render(ctx, body, {
    subject: `Session revoked`,
    textLines: [`Session on ${payload.device} was revoked.`],
    preheader: `A session was revoked.`,
  });
};

const suspiciousActivity = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Suspicious activity detected")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(payload.activity || "Unusual activity was detected on your account.")}
    ${paragraph(`If this wasn't you, contact ${ctx.supportEmail} immediately.`)}
  `;
  return render(ctx, body, {
    subject: `Suspicious activity on your account`,
    textLines: [`Suspicious activity: ${payload.activity}`],
    preheader: `Suspicious activity detected.`,
  });
};

const legalPolicyUpdate = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { policy } = payload;
  const body = `
    ${heading(`Policy update: ${policy.title}`)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`We've updated our ${policy.title}. Please take a moment to review the changes.`)}
    ${ctaButton({ label: "Read policy", href: ctx.websiteUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Policy update: ${policy.title}`,
    textLines: [`Policy updated: ${policy.title}`],
    preheader: `Policy update: ${policy.title}.`,
  });
};

const termsAcceptanceReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Please accept our updated terms")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Please accept the updated Terms of Service to continue using ${ctx.appName}.`)}
    ${ctaButton({ label: "Accept terms", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Accept updated terms`,
    textLines: [`Please accept updated terms.`],
    preheader: `Please accept updated terms.`,
  });
};

const dataExportReady = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Your data export is ready")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your data export is ready to download. The link expires in 24 hours.`)}
    ${ctaButton({ label: "Download", href: payload.downloadUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Your data export is ready`,
    textLines: [`Download your data: ${payload.downloadUrl}`],
    preheader: `Your data export is ready.`,
  });
};

const accountDeletionScheduled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading("Account deletion scheduled")}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Your account is scheduled for deletion on <strong>${payload.date}</strong>.`)}
    ${paragraph(`Log in before then to cancel the deletion.`)}
    ${ctaButton({ label: "Cancel deletion", href: ctx.clientUrl, secondaryColor: ctx.secondaryColor })}
  `;
  return render(ctx, body, {
    subject: `Account deletion scheduled`,
    textLines: [`Account deletion scheduled for ${payload.date}.`],
    preheader: `Account deletion scheduled for ${payload.date}.`,
  });
};

const changeContactOTP = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const body = `
    ${heading(`Confirm your ${payload.type} change`)}
    ${paragraph(`Hi ${recipient.firstName},`)}
    ${paragraph(`Use the code below to confirm your ${payload.type} change.`)}
    ${highlightBox({ label: "Your code", value: payload.otp, secondaryColor: ctx.secondaryColor })}
    ${smallNote(`Expires in 10 minutes.`)}
  `;
  return render(ctx, body, {
    subject: `Confirm your ${payload.type} change — ${payload.otp}`,
    textLines: [`Your ${payload.type} change code: ${payload.otp}`],
    preheader: `Your ${payload.type} change code: ${payload.otp}`,
  });
};

// ══════════════════════════════════════════════════════════════
// EXPORTS — order preserved from original
// ══════════════════════════════════════════════════════════════

export {
  welcomeCustomer,
  emailVerificationLink,
  passwordResetOTP,
  passwordChanged,
  newDeviceLogin,
  accountSuspended,
  accountReactivated,
  accountDeleted,
  bookingConfirmation,
  bookingReminder24h,
  bookingReminder2h,
  bookingModified,
  bookingCancelled,
  checkInConfirmation,
  checkOutConfirmation,
  refundProcessed,
  reviewRequest,
  orderConfirmation,
  orderAccepted,
  orderPreparing,
  orderOutForDelivery,
  orderDelivered,
  orderCancelled,
  deliveryReceipt,
  dineInBookingConfirmation,
  dineInReminder,
  dineInAccepted,
  dineInCancelled,
  pickupReady,
  pickupCompleted,
  tripBookingConfirmation,
  driverAssigned,
  driverArrivingSoon,
  tripStarted,
  tripCompleted,
  tripCancelled,
  paymentReceived,
  paymentFailed,
  walletToppedUp,
  refundIssued,
  payoutToWallet,
  partnerApplicationReceived,
  partnerApproved,
  partnerRejected,
  partnerSuspended,
  partnerReactivated,
  vehicleApproved,
  vehicleRejected,
  propertyApproved,
  propertyRejected,
  roomApproved,
  roomAssigned,
  newOrderReceived,
  newBroadcastReceived,
  orderCancelledByCustomer,
  newTripRequest,
  newBookingReceived,
  guestCheckedIn,
  guestCheckedOut,
  paymentReceivedPartner,
  payoutProcessed,
  payoutFailed,
  weeklyEarningsSummary,
  reviewReceived,
  adminNewPartnerApplication,
  adminNewDispute,
  adminNewContact,
  adminPayoutApprovalRequired,
  adminManualPayoutRequest,
  adminCommissionLedgerAlert,
  adminFailedPayment,
  adminFailedPayout,
  adminBackupCompleted,
  adminBackupFailed,
  adminRevenueSummary,
  adminSystemHealthAlert,
  adminInvited,
  adminAccountCreated,
  adminRoleChanged,
  adminAccountSuspended,
  welcomeSeriesDay0,
  welcomeSeriesDay3,
  welcomeSeriesDay7,
  promotionalOffer,
  newRestaurantInTown,
  newAccommodationInTown,
  seasonalDeals,
  abandonedBookingReminder,
  abandonedOrderReminder,
  loyaltyMilestone,
  referralRewardEarned,
  referralJoined,
  birthdayOffer,
  reEngagement,
  newsletter,
  twoFactorCode,
  sessionRevoked,
  suspiciousActivity,
  legalPolicyUpdate,
  termsAcceptanceReminder,
  dataExportReady,
  accountDeletionScheduled,
  changeContactOTP,
};