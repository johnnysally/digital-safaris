import { env } from "../config/env.js";

const DEFAULT_PRIMARY = "#1A1F2E";
const DEFAULT_SECONDARY = "#C9A063";

const fallbackLogo = (primary, secondary) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding-right:12px;">
      <svg width="40" height="40" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
        <circle cx="21" cy="21" r="21" fill="${secondary}"/>
        <path d="M13 21 L21 12 L29 21 L29 30 L13 30 Z" fill="${primary}" opacity="0.9"/>
      </svg>
    </td>
    <td>
      <span style="font-family:Georgia,serif;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
        Digital Safaris
      </span>
    </td>
  </tr>
</table>
`;

export function buildEmailLayout({
  logoUrl,
  appName,
  primaryColor,
  secondaryColor,
  supportEmail,
  supportPhone,
  websiteUrl,
  preheader,
  bodyHtml,
  footerNote,
  unsubscribeUrl,
  legalTermsUrl,
  legalPrivacyUrl,
  socialLinks = {},
}) {
  const primary = primaryColor || DEFAULT_PRIMARY;
  const secondary = secondaryColor || DEFAULT_SECONDARY;
  const brand = appName || "Digital Safaris";
  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${brand}" width="160" style="display:block;max-width:160px;height:auto;border:0;" />`
    : fallbackLogo(primary, secondary);

  const socialBar = Object.entries(socialLinks)
    .filter(([, url]) => Boolean(url))
    .map(
      ([key, url]) =>
        `<a href="${url}" style="display:inline-block;margin:0 6px;color:${secondary};text-decoration:none;font-size:12px;font-weight:600;">${key}</a>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${brand}</title>
<style type="text/css">
  body { margin:0; padding:0; width:100% !important; }
  img { border:0; outline:none; text-decoration:none; }
  a { color:${secondary}; }
  table { border-collapse:collapse; }
  @media only screen and (max-width:600px) {
    .container { width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:22px !important; line-height:1.3 !important; }
    .btn { display:block !important; width:100% !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;">

<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7;">
  ${preheader || ""}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.06);">
        <tr>
          <td style="background-color:${primary};padding:28px 32px;" class="px">
            ${logo}
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.65;color:#1f2937;" class="px">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:28px 32px;border-top:1px solid #e5e7eb;" class="px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">
                  <p style="margin:0 0 6px;font-weight:700;color:${primary};font-size:14px;">${brand}</p>
                  ${supportEmail ? `<p style="margin:0 0 4px;"><a href="mailto:${supportEmail}" style="color:${secondary};text-decoration:none;">${supportEmail}</a></p>` : ""}
                  ${supportPhone ? `<p style="margin:0 0 4px;">${supportPhone}</p>` : ""}
                  ${websiteUrl ? `<p style="margin:0 0 12px;"><a href="${websiteUrl}" style="color:${secondary};text-decoration:none;">${websiteUrl}</a></p>` : ""}
                  ${socialBar ? `<p style="margin:0 0 12px;">${socialBar}</p>` : ""}
                  <p style="margin:0 0 8px;font-size:12px;">
                    <a href="${legalTermsUrl || "#"}" style="color:${secondary};text-decoration:none;">Terms</a>
                    &nbsp;·&nbsp;
                    <a href="${legalPrivacyUrl || "#"}" style="color:${secondary};text-decoration:none;">Privacy</a>
                    ${unsubscribeUrl ? `&nbsp;·&nbsp;<a href="${unsubscribeUrl}" style="color:${secondary};text-decoration:none;">Unsubscribe</a>` : ""}
                  </p>
                  ${footerNote ? `<p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">${footerNote}</p>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:#9ca3af;text-align:center;">
        This is an automated message from ${brand}. Please do not reply directly.
      </p>
    </td>
  </tr>
</table>

</body>
</html>`;
}

export function buildEmailText(lines = []) {
  return lines.filter(Boolean).join("\n");
}

// ──────────────────────────────────────────────────────────────
// Reusable HTML fragments for templates
// ──────────────────────────────────────────────────────────────

export function heading(text, { color = "#111827", size = 24 } = {}) {
  return `<h1 class="h1" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:${size}px;line-height:1.25;font-weight:700;color:${color};letter-spacing:-0.3px;">${text}</h1>`;
}

export function paragraph(text, { color = "#374151", size = 15, margin = "0 0 16px" } = {}) {
  return `<p style="margin:${margin};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:${size}px;line-height:1.65;color:${color};">${text}</p>`;
}

export function ctaButton({ label, href, secondaryColor }) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="background-color:${secondaryColor || "#C9A063"};border-radius:8px;">
      <a href="${href}" class="btn" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td>
  </tr>
</table>`;
}

export function dataTable(rows) {
  const body = rows
    .map(
      ({ label, value }) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f3f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:#6b7280;width:45%;">${label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f3f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:600;color:#111827;text-align:right;">${value}</td>
    </tr>`,
    )
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:10px;overflow:hidden;margin:20px 0;">
  ${body}
</table>`;
}

export function highlightBox({ label, value, secondaryColor }) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbf3;border:1px solid ${secondaryColor || "#C9A063"}33;border-radius:12px;margin:20px 0;">
  <tr>
    <td style="padding:24px;text-align:center;">
      <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">${label}</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:${secondaryColor || "#C9A063"};letter-spacing:-0.5px;">${value}</p>
    </td>
  </tr>
</table>`;
}

export function divider() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;
}

export function smallNote(text) {
  return `<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:1.55;color:#9ca3af;">${text}</p>`;
}

export { env };