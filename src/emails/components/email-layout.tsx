import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const brandColor = "#2f8f5b";
const mutedColor = "#6b7280";
const borderColor = "#e5e7eb";

type EmailLayoutProps = {
  preview: string;
  title: string;
  lang?: string;
  children: ReactNode;
};

export function EmailLayout({
  preview,
  title,
  lang = "es",
  children,
}: EmailLayoutProps) {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Bocao</Text>
          </Section>

          <Section style={card}>
            <Heading style={heading}>{title}</Heading>
            {children}
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Si no solicitaste este acceso, puedes ignorar este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  brandColor,
  mutedColor,
  borderColor,
  paragraph: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  } as const,
  muted: {
    color: mutedColor,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 12px",
  } as const,
  button: {
    backgroundColor: brandColor,
    borderRadius: "10px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: "1",
    padding: "14px 24px",
    textDecoration: "none",
  } as const,
  codeBox: {
    backgroundColor: "#f3f4f6",
    border: `1px solid ${borderColor}`,
    borderRadius: "12px",
    color: "#111827",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "28px",
    fontWeight: 700,
    letterSpacing: "8px",
    margin: "8px 0 0",
    padding: "16px 20px",
    textAlign: "center" as const,
  },
};

const body = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "24px 0",
};

const container = {
  margin: "0 auto",
  maxWidth: "560px",
  padding: "0 16px",
};

const header = {
  marginBottom: "16px",
};

const logo = {
  color: brandColor,
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: "0",
};

const card = {
  backgroundColor: "#ffffff",
  border: `1px solid ${borderColor}`,
  borderRadius: "16px",
  padding: "28px 24px",
};

const heading = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "28px",
  margin: "0 0 16px",
};

const divider = {
  borderColor,
  margin: "24px 0 16px",
};

const footer = {
  color: mutedColor,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
  textAlign: "center" as const,
};
