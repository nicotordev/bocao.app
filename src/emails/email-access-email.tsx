import { Button, Link, Section, Text } from "@react-email/components";
import {
  EmailLayout,
  emailStyles,
} from "@/emails/components/email-layout";

type EmailAccessEmailProps = {
  url: string;
  otp: string;
};

export function EmailAccessEmail({ url, otp }: EmailAccessEmailProps) {
  return (
    <EmailLayout
      preview="Tu acceso a Bocao: usa el link o el código de 6 dígitos."
      title="Tu acceso a Bocao"
    >
      <Text style={emailStyles.paragraph}>
        Hola, usa cualquiera de estas opciones para ingresar. Expiran en 5
        minutos.
      </Text>

      <Section style={{ marginBottom: "24px" }}>
        <Text style={emailStyles.muted}>Opción 1: link de acceso</Text>
        <Button href={url} style={emailStyles.button}>
          Ingresar a Bocao
        </Button>
        <Text style={{ ...emailStyles.muted, marginTop: "12px", marginBottom: 0 }}>
          O copia este enlace:{" "}
          <Link href={url} style={{ color: emailStyles.brandColor }}>
            {url}
          </Link>
        </Text>
      </Section>

      <Section>
        <Text style={emailStyles.muted}>Opción 2: código de 6 dígitos</Text>
        <Text style={emailStyles.codeBox}>{otp}</Text>
      </Section>
    </EmailLayout>
  );
}
