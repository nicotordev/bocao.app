import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { EmailAccessEmail } from "@/emails/email-access-email";
import { MagicLinkEmail } from "@/emails/magic-link-email";
import { OtpEmail, type OtpEmailType } from "@/emails/otp-email";

const resend = new Resend(process.env.RESEND_API_KEY);

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "Bocao <onboarding@resend.dev>";
}

function ensureResendConfigured() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set — email was not sent");
    return false;
  }

  return true;
}

function otpSubject(type: OtpEmailType) {
  switch (type) {
    case "sign-in":
      return "Tu código de acceso a Bocao";
    case "email-verification":
      return "Verifica tu email en Bocao";
    case "forget-password":
      return "Restablece tu contraseña en Bocao";
    case "change-email":
      return "Confirma el cambio de email en Bocao";
  }
}

async function sendReactEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  if (!ensureResendConfigured()) {
    return;
  }

  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);

  await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  });
}

export async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  await sendReactEmail({
    to: email,
    subject: "Tu link de acceso a Bocao",
    react: MagicLinkEmail({ url }),
  });
}

export async function sendEmailAccessEmail({
  email,
  url,
  otp,
}: {
  email: string;
  url: string;
  otp: string;
}) {
  await sendReactEmail({
    to: email,
    subject: "Tu acceso a Bocao",
    react: EmailAccessEmail({ url, otp }),
  });
}

export async function sendOtpEmail({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: OtpEmailType;
}) {
  await sendReactEmail({
    to: email,
    subject: otpSubject(type),
    react: OtpEmail({ otp, type }),
  });
}

export type { OtpEmailType };
