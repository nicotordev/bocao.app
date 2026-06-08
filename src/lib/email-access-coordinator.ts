import {
  sendEmailAccessEmail,
  sendMagicLinkEmail,
  sendOtpEmail,
} from "@/lib/email";

type PendingEmailAccess = {
  email: string;
  url?: string;
  otp?: string;
  timer?: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingEmailAccess>();
const FLUSH_DELAY_MS = 300;

function scheduleFlush(email: string) {
  const entry = pending.get(email);
  if (!entry) {
    return;
  }

  if (entry.timer) {
    clearTimeout(entry.timer);
  }

  entry.timer = setTimeout(() => {
    void flush(email);
  }, FLUSH_DELAY_MS);
}

async function flush(email: string) {
  const entry = pending.get(email);
  if (!entry) {
    return;
  }

  pending.delete(email);

  if (entry.timer) {
    clearTimeout(entry.timer);
  }

  try {
    if (entry.url && entry.otp) {
      await sendEmailAccessEmail({
        email: entry.email,
        url: entry.url,
        otp: entry.otp,
      });
      return;
    }

    if (entry.url) {
      await sendMagicLinkEmail({ email: entry.email, url: entry.url });
      return;
    }

    if (entry.otp) {
      await sendOtpEmail({
        email: entry.email,
        otp: entry.otp,
        type: "sign-in",
      });
    }
  } catch (error) {
    console.error("[auth] failed to send email access", error);
  }
}

export function queueMagicLinkForEmailAccess(email: string, url: string) {
  const key = email.toLowerCase();
  const entry = pending.get(key) ?? { email: key };
  entry.url = url;
  pending.set(key, entry);
  scheduleFlush(key);
}

export function queueOtpForEmailAccess(email: string, otp: string) {
  const key = email.toLowerCase();
  const entry = pending.get(key) ?? { email: key };
  entry.otp = otp;
  pending.set(key, entry);
  scheduleFlush(key);
}
