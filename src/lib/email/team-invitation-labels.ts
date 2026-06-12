import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";
import type { Locale } from "@/i18n/locales";
import { defaultLocale, locales } from "@/i18n/locales";
import type { TeamRole } from "@/lib/team/permissions";

type TeamMessages = (typeof enMessages)["team"];

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}

function getTeamMessages(locale: string): TeamMessages {
  return resolveLocale(locale) === "en" ? enMessages.team : esMessages.team;
}

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

export function getTeamInvitationEmailLabels(
  locale: string,
  organizationName: string,
  role: TeamRole,
) {
  const team = getTeamMessages(locale);
  const roleLabel = team.roles[role] ?? role;
  const values = { organizationName, role: roleLabel };
  const email = team.invitationEmail;

  return {
    locale: resolveLocale(locale),
    preview: formatTemplate(email.preview, values),
    title: formatTemplate(email.title, values),
    heading: formatTemplate(email.heading, values),
    body: formatTemplate(email.body, values),
    acceptButton: email.acceptButton,
    footer: email.footer,
    subject: formatTemplate(email.subject, values),
  };
}
