import { Button, Link, Section, Text } from "@react-email/components";
import {
  EmailLayout,
  emailStyles,
} from "@/emails/components/email-layout";

type MagicLinkEmailProps = {
  url: string;
};

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <EmailLayout
      preview="Haz clic para ingresar a Bocao. El link expira en 5 minutos."
      title="Tu link de acceso"
    >
      <Text style={emailStyles.paragraph}>
        Hola, haz clic en el botón para ingresar a Bocao. El link expira en 5
        minutos.
      </Text>

      <Section>
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
    </EmailLayout>
  );
}
