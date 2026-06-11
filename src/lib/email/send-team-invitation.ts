import { render } from "@react-email/render";
import { Resend } from "resend";
import { TeamInvitationEmail } from "@/emails/team-invitation-email";
import type { TeamRole } from "@/lib/team/permissions";

const resend = new Resend(process.env.RESEND_API_KEY);

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "Bocao <onboarding@resend.dev>";
}

function ensureResendConfigured() {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[email] RESEND_API_KEY is not set — team invitation email was not sent",
    );
    return false;
  }

  return true;
}

export async function sendTeamInvitationEmail({
  email,
  organizationName,
  role,
  acceptUrl,
}: {
  email: string;
  organizationName: string;
  role: TeamRole;
  acceptUrl: string;
}) {
  if (!ensureResendConfigured()) {
    return;
  }

  const react = TeamInvitationEmail({ organizationName, role, acceptUrl });
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);

  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: `Invitación a ${organizationName} en Bocao`,
    html,
    text,
  });
}
