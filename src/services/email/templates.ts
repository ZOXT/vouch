import { escapeHtml } from "../../utils/html";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const ACCENT = "#4f46e5";

/**
 * Shared minimal layout: small wordmark, white card on light gray, compact
 * footer. All styles are inline for email-client compatibility.
 */
const layout = (preheader: string, content: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vouch</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f7f9;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f9;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <tr>
          <td style="padding:0 8px 20px;">
            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;font-weight:700;color:${ACCENT};letter-spacing:-0.02em;">Vouch</span>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border:1px solid #ececf1;border-radius:12px;padding:32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0;text-align:center;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#9ca3af;line-height:1.6;">
              Vouch — collect testimonials that convert<br>
              <a href="https://tryvouch.me" style="color:#9ca3af;text-decoration:underline;">tryvouch.me</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";

const heading = (text: string) =>
  `<h1 style="margin:0 0 12px;${FONT}font-size:20px;font-weight:650;color:#111827;letter-spacing:-0.01em;">${text}</h1>`;

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;${FONT}font-size:14px;line-height:1.6;color:#4b5563;">${text}</p>`;

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:8px;background-color:${ACCENT};"><a href="${href}" style="display:inline-block;padding:12px 24px;${FONT}font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a></td></tr></table>`;

const muted = (text: string) =>
  `<p style="margin:16px 0 0;${FONT}font-size:12px;line-height:1.6;color:#9ca3af;">${text}</p>`;

export const otpTemplate = (name: string, otp: string, expiresInMinutes: number): EmailTemplate => {
  const safeName = escapeHtml(name);
  const html = layout(
    `Your Vouch verification code is ${otp}`,
    `${heading("Verify your email")}
     ${paragraph(`Hi ${safeName}, use this code to finish verifying your Vouch account:`)}
     <p style="margin:8px 0 20px;${FONT}font-size:30px;font-weight:700;letter-spacing:6px;color:#111827;">${escapeHtml(otp)}</p>
     ${muted(`This code expires in ${expiresInMinutes} minutes. If you didn't request it, you can ignore this email.`)}`,
  );

  return {
    subject: `${otp} is your Vouch verification code`,
    html,
    text: `Hi ${name},\n\nYour Vouch verification code is ${otp}. It expires in ${expiresInMinutes} minutes.\n\nIf you didn't request this, ignore this email.`,
  };
};

export interface TestimonialRequestEmailInput {
  clientName: string;
  ownerName: string;
  requestUrl: string;
  message?: string | null;
  expiresAt?: Date | null;
}

export const testimonialRequestTemplate = (
  input: TestimonialRequestEmailInput,
): EmailTemplate => {
  const clientName = escapeHtml(input.clientName);
  const ownerName = escapeHtml(input.ownerName);
  const customMessage = input.message?.trim()
    ? paragraph(`&ldquo;${escapeHtml(input.message.trim())}&rdquo;`)
    : "";
  const expiry = input.expiresAt
    ? muted(`This link expires on ${input.expiresAt.toUTCString()}.`)
    : "";

  const html = layout(
    `${input.ownerName} is asking for a quick video testimonial`,
    `${heading("We'd love your feedback")}
     ${paragraph(`Hi ${clientName},`)}
     ${paragraph(`<strong>${ownerName}</strong> is collecting testimonials and would really appreciate a short video from you. It only takes a couple of minutes — just click below and record.`)}
     ${customMessage}
     ${button(input.requestUrl, "Record your testimonial")}
     ${muted(`If the button doesn't work, paste this link into your browser:<br><a href="${input.requestUrl}" style="color:${ACCENT};word-break:break-all;">${input.requestUrl}</a>`)}
     ${expiry}`,
  );

  return {
    subject: `${input.ownerName} is asking for a quick testimonial`,
    html,
    text: `Hi ${input.clientName},\n\n${input.ownerName} is collecting testimonials and would appreciate a short video from you.\n\nRecord here: ${input.requestUrl}\n\nThanks!`,
  };
};

export interface TestimonialReceivedEmailInput {
  ownerName: string;
  clientName: string;
  clientDesignation?: string | null;
  source: "request" | "campaign";
  dashboardUrl: string;
}

export const testimonialReceivedTemplate = (
  input: TestimonialReceivedEmailInput,
): EmailTemplate => {
  const ownerName = escapeHtml(input.ownerName);
  const clientName = escapeHtml(input.clientName);
  const designation = input.clientDesignation?.trim()
    ? ` <span style="color:#9ca3af;">· ${escapeHtml(input.clientDesignation)}</span>`
    : "";

  const html = layout(
    `New testimonial from ${input.clientName}`,
    `${heading("You received a new testimonial 🎉")}
     ${paragraph(`Hi ${ownerName},`)}
     ${paragraph(`<strong>${clientName}</strong>${designation} just submitted a video testimonial${input.source === "campaign" ? " to your campaign" : ""}. It's being processed now — captions and insights will be ready shortly.`)}
     ${button(input.dashboardUrl, "View in your dashboard")}`,
  );

  return {
    subject: `New testimonial from ${input.clientName}`,
    html,
    text: `Hi ${input.ownerName},\n\n${input.clientName} just submitted a video testimonial. It's being processed now.\n\nView it here: ${input.dashboardUrl}`,
  };
};
