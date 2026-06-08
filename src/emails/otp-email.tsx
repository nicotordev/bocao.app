import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  emailStyles,
} from "@/emails/components/email-layout";

export type OtpEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

type OtpEmailProps = {
  otp: string;
  type: OtpEmailType;
};

function getCopy(type: OtpEmailType) {
  switch (type) {
    case "sign-in":
      return {
        preview: "Tu código de acceso a Bocao.",
        title: "Tu código de acceso",
        description: "Usa este código para ingresar a Bocao.",
      };
    case "email-verification":
      return {
        preview: "Verifica tu email en Bocao.",
        title: "Verifica tu email",
        description: "Usa este código para verificar tu email en Bocao.",
      };
    case "forget-password":
      return {
        preview: "Restablece tu contraseña en Bocao.",
        title: "Restablece tu contraseña",
        description: "Usa este código para restablecer tu contraseña.",
      };
    case "change-email":
      return {
        preview: "Confirma el cambio de email en Bocao.",
        title: "Confirma tu nuevo email",
        description: "Usa este código para confirmar tu nuevo email.",
      };
  }
}

export function OtpEmail({ otp, type }: OtpEmailProps) {
  const copy = getCopy(type);

  return (
    <EmailLayout preview={copy.preview} title={copy.title}>
      <Text style={emailStyles.paragraph}>{copy.description}</Text>
      <Text style={emailStyles.muted}>El código expira en 5 minutos.</Text>
      <Section>
        <Text style={emailStyles.codeBox}>{otp}</Text>
      </Section>
    </EmailLayout>
  );
}
