import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/email-layout";
import type { Locale } from "@/i18n/locales";

export type TeamInvitationEmailLabels = {
  preview: string;
  title: string;
  heading: string;
  body: string;
  acceptButton: string;
  footer: string;
};

type TeamInvitationEmailProps = {
  locale: Locale;
  acceptUrl: string;
  labels: TeamInvitationEmailLabels;
};

export function TeamInvitationEmail({
  locale,
  acceptUrl,
  labels,
}: TeamInvitationEmailProps) {
  return (
    <EmailLayout preview={labels.preview} title={labels.title} lang={locale}>
      <Heading className="text-xl font-semibold text-slate-900">
        {labels.heading}
      </Heading>
      <Text className="text-slate-600">{labels.body}</Text>
      <Button
        href={acceptUrl}
        className="rounded-lg bg-slate-900 px-5 py-3 text-white"
      >
        {labels.acceptButton}
      </Button>
      <Text className="text-sm text-slate-500">{labels.footer}</Text>
    </EmailLayout>
  );
}
