import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, magicLink } from "better-auth/plugins";
import {
  queueMagicLinkForEmailAccess,
  queueOtpForEmailAccess,
} from "@/lib/email-access-coordinator";
import { sendOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        queueMagicLinkForEmailAccess(email, url);
      },
    }),
    emailOTP({
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          queueOtpForEmailAccess(email, otp);
          return;
        }

        void sendOtpEmail({ email, otp, type }).catch((error) => {
          console.error("[auth] failed to send OTP email", error);
        });
      },
    }),
  ],

  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : undefined,
});

export async function getServerSession() {
  const { headers } = await import("next/headers");
  return auth.api.getSession({
    headers: await headers(),
  });
}
