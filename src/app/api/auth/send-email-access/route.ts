import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { appRoutes, authRoutes } from "@/lib/auth-routes";

type SendEmailAccessBody = {
  email: string;
  name?: string;
  mode: "sign-in" | "sign-up";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendEmailAccessBody;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return Response.json({ error: "Email requerido" }, { status: 400 });
    }

    const [magicResult, otpResult] = await Promise.allSettled([
      auth.api.signInMagicLink({
        body: {
          email,
          name: body.mode === "sign-up" ? body.name : undefined,
          callbackURL: appRoutes.dashboard,
          newUserCallbackURL: appRoutes.dashboard,
          errorCallbackURL: authRoutes.error,
        },
        headers: request.headers,
      }),
      auth.api.sendVerificationOTP({
        body: {
          email,
          type: "sign-in",
        },
        headers: request.headers,
      }),
    ]);

    const magicError =
      magicResult.status === "rejected"
        ? magicResult.reason
        : null;
    const otpError =
      otpResult.status === "rejected" ? otpResult.reason : null;

    if (magicError && otpError) {
      const message =
        getErrorMessage(magicError) ??
        getErrorMessage(otpError) ??
        "No se pudo enviar el acceso por email";
      return Response.json({ error: message }, { status: 400 });
    }

    if (magicError) {
      return Response.json(
        { error: getErrorMessage(magicError) ?? "No se pudo enviar el link" },
        { status: 400 },
      );
    }

    if (otpError) {
      return Response.json(
        { error: getErrorMessage(otpError) ?? "No se pudo enviar el código" },
        { status: 400 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[auth] send-email-access failed", error);
    return Response.json(
      { error: "No se pudo enviar el acceso por email" },
      { status: 500 },
    );
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}
