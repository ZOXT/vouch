import { Resend } from "resend";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  otpTemplate,
  testimonialReceivedTemplate,
  testimonialRequestTemplate,
  type EmailTemplate,
  type TestimonialRequestEmailInput,
} from "./email/templates";

const resend = new Resend(env.RESEND_API_KEY);

// The Resend SDK does not throw on API errors — it resolves with { error }.
const send = async (
  to: string,
  template: EmailTemplate,
  context: Record<string, unknown>,
): Promise<void> => {
  const { error } = await resend.emails.send({
    from: env.FROM_EMAIL,
    replyTo: env.REPLY_TO_EMAIL,
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (error) {
    logger.error({ error, to, ...context }, "Failed to send email");
    throw new ApiError(502, "Failed to send email");
  }
};

/**
 * Fire-and-forget variant for notification emails: delivery problems are
 * logged but must never fail the business operation that triggered them.
 */
const sendInBackground = (
  to: string,
  template: EmailTemplate,
  context: Record<string, unknown>,
): void => {
  void send(to, template, context).catch(() => {
    // send() already logged the failure — swallow to keep this unawaited.
  });
};

export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string,
  expiresInMinutes: number,
): Promise<void> => {
  await send(email, otpTemplate(name, otp, expiresInMinutes), {
    kind: "otp",
  });
};

export interface TestimonialReceivedNotification {
  clientName: string;
  clientDesignation?: string | null;
  source: "request" | "campaign";
}

/** Notifies the owner that a new testimonial arrived. Never throws. */
export const notifyTestimonialReceived = async (
  ownerUserId: string,
  input: TestimonialReceivedNotification,
): Promise<void> => {
  try {
    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { name: true, email: true },
    });

    if (!owner) {
      logger.warn({ ownerUserId }, "Skipping testimonial notification, owner not found");
      return;
    }

    sendInBackground(
      owner.email,
      testimonialReceivedTemplate({
        ownerName: owner.name,
        clientName: input.clientName,
        clientDesignation: input.clientDesignation,
        source: input.source,
        dashboardUrl: `${env.APP_URL}/dashboard`,
      }),
      { kind: "testimonial_received", ownerUserId },
    );
  } catch (err) {
    logger.error({ err, ownerUserId }, "Failed to prepare testimonial notification");
  }
};

/** Sends the testimonial request invite to the client. Never throws. */
export const notifyTestimonialRequest = (
  email: string,
  input: TestimonialRequestEmailInput,
): void => {
  sendInBackground(email, testimonialRequestTemplate(input), {
    kind: "testimonial_request",
  });
};
