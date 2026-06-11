import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/email-layout";
import type { TeamRole } from "@/lib/team/permissions";

type TeamInvitationEmailProps = {
  organizationName: string;
  role: TeamRole;
  acceptUrl: string;
};

export function TeamInvitationEmail({
  organizationName,
  role,
  acceptUrl,
}: TeamInvitationEmailProps) {
  return (
    <EmailLayout
      preview={`Invitación a ${organizationName}`}
      title={`Invitación a ${organizationName}`}
    >
      <Heading className="text-xl font-semibold text-slate-900">
        Te invitaron a {organizationName}
      </Heading>
      <Text className="text-slate-600">
        Has sido invitado a colaborar en Bocao con el rol <strong>{role}</strong>.
      </Text>
      <Button
        href={acceptUrl}
        className="rounded-lg bg-slate-900 px-5 py-3 text-white"
      >
        Aceptar invitación
      </Button>
      <Text className="text-sm text-slate-500">
        Este enlace expira en 7 días. Si no esperabas esta invitación, puedes
        ignorar este correo.
      </Text>
    </EmailLayout>
  );
}
