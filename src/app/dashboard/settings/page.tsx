import { getTranslations } from "next-intl/server";
import { SettingsPageClient } from "@/components/dashboard/settings/settings-page-client";
import { buildSettingsMockData } from "@/components/dashboard/settings/mock-data";
import type {
  BusinessType,
  SettingsLabels,
  SettingsSectionId,
} from "@/components/dashboard/settings/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { loadSettingsPageData } from "@/lib/settings/server";

const SECTION_IDS: SettingsSectionId[] = [
  "profile",
  "locales",
  "hours",
  "whatsapp",
  "team",
  "appearance",
  "security",
];

const BUSINESS_TYPES: BusinessType[] = [
  "restaurant",
  "cafe",
  "sushi",
  "dark_kitchen",
  "food_truck",
  "bar",
  "bakery",
];

function buildLabels(
  t: Awaited<ReturnType<typeof getTranslations<"dashboard.settings">>>,
): SettingsLabels {
  const businessTypes = Object.fromEntries(
    BUSINESS_TYPES.map((type) => [
      type,
      t(`sections.profile.businessTypes.${type}`),
    ]),
  ) as SettingsLabels["sections"]["profile"]["businessTypes"];

  const nav = Object.fromEntries(
    SECTION_IDS.map((sectionId) => [sectionId, t(`nav.${sectionId}`)]),
  ) as SettingsLabels["nav"];

  return {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
      activeRestaurant: t("header.activeRestaurant"),
    },
    nav,
    sections: {
      profile: {
        title: t("sections.profile.title"),
        description: t("sections.profile.description"),
        fields: {
          name: t("sections.profile.fields.name"),
          businessType: t("sections.profile.fields.businessType"),
          email: t("sections.profile.fields.email"),
          emailHint: t("sections.profile.fields.emailHint"),
          phone: t("sections.profile.fields.phone"),
          address: t("sections.profile.fields.address"),
          addressHint: t("sections.profile.fields.addressHint"),
          city: t("sections.profile.fields.city"),
          country: t("sections.profile.fields.country"),
          timezone: t("sections.profile.fields.timezone"),
          currency: t("sections.profile.fields.currency"),
        },
        businessTypes,
      },
      locales: {
        title: t("sections.locales.title"),
        description: t("sections.locales.description"),
        addLanguage: t("sections.locales.addLanguage"),
        addLanguagePlaceholder: t("sections.locales.addLanguagePlaceholder"),
        enabledLanguages: t("sections.locales.enabledLanguages"),
        empty: t("sections.locales.empty"),
        remove: t("sections.locales.remove"),
        save: t("sections.locales.save"),
        saving: t("sections.locales.saving"),
        success: t("sections.locales.success"),
        error: t("sections.locales.error"),
        minOne: t("sections.locales.minOne"),
      },
      hours: {
        title: t("sections.hours.title"),
        description: t("sections.hours.description"),
        acceptOrders: t("sections.hours.acceptOrders"),
        acceptOrdersHint: t("sections.hours.acceptOrdersHint"),
        acceptReservations: t("sections.hours.acceptReservations"),
        acceptReservationsHint: t("sections.hours.acceptReservationsHint"),
        weeklySchedule: t("sections.hours.weeklySchedule"),
        weeklyScheduleHint: t("sections.hours.weeklyScheduleHint"),
        averagePrep: t("sections.hours.averagePrep"),
        averagePrepHint: t("sections.hours.averagePrepHint"),
        tableCapacity: t("sections.hours.tableCapacity"),
        tableCapacityHint: t("sections.hours.tableCapacityHint"),
        tableCapacityFromFloorPlan: t(
          "sections.hours.tableCapacityFromFloorPlan",
        ),
        closedMessage: t("sections.hours.closedMessage"),
        closedMessageHint: t("sections.hours.closedMessageHint"),
        closed: t("sections.hours.closed"),
        open: t("sections.hours.openTime"),
        close: t("sections.hours.closeTime"),
        statusOpen: t("sections.hours.statusOpen"),
        day: t("sections.hours.day"),
        days: {
          monday: t("sections.hours.days.monday"),
          tuesday: t("sections.hours.days.tuesday"),
          wednesday: t("sections.hours.days.wednesday"),
          thursday: t("sections.hours.days.thursday"),
          friday: t("sections.hours.days.friday"),
          saturday: t("sections.hours.days.saturday"),
          sunday: t("sections.hours.days.sunday"),
        },
      },
      whatsapp: {
        title: t("sections.whatsapp.title"),
        description: t("sections.whatsapp.description"),
        connection: t("sections.whatsapp.connection"),
        statusConnected: t("sections.whatsapp.statusConnected"),
        statusPending: t("sections.whatsapp.statusPending"),
        connectedNumber: t("sections.whatsapp.connectedNumber"),
        autoReply: t("sections.whatsapp.autoReply"),
        autoReplyHint: t("sections.whatsapp.autoReplyHint"),
        humanApproval: t("sections.whatsapp.humanApproval"),
        humanApprovalHint: t("sections.whatsapp.humanApprovalHint"),
        tone: t("sections.whatsapp.tone"),
        toneHint: t("sections.whatsapp.toneHint"),
        tones: {
          friendly: t("sections.whatsapp.tones.friendly"),
          professional: t("sections.whatsapp.tones.professional"),
          casual: t("sections.whatsapp.tones.casual"),
        },
        instructions: t("sections.whatsapp.instructions"),
        instructionsHint: t("sections.whatsapp.instructionsHint"),
        testAssistant: t("sections.whatsapp.testAssistant"),
        mockHint: t("sections.whatsapp.mockHint"),
      },
      team: {
        title: t("sections.team.title"),
        description: t("sections.team.description"),
        inviteMember: t("sections.team.inviteMember"),
        manageTeam: t("sections.team.manageTeam"),
        securityNote: t("sections.team.securityNote"),
        columns: {
          member: t("sections.team.columns.member"),
          role: t("sections.team.columns.role"),
          email: t("sections.team.columns.email"),
          status: t("sections.team.columns.status"),
        },
        roles: {
          owner: t("sections.team.roles.owner"),
          manager: t("sections.team.roles.manager"),
          staff: t("sections.team.roles.staff"),
        },
        statuses: {
          active: t("sections.team.statuses.active"),
          pending: t("sections.team.statuses.pending"),
          inactive: t("sections.team.statuses.inactive"),
        },
      },
      appearance: {
        title: t("sections.appearance.title"),
        description: t("sections.appearance.description"),
        language: t("sections.appearance.language"),
        languageHint: t("sections.appearance.languageHint"),
        theme: t("sections.appearance.theme"),
        themeHint: t("sections.appearance.themeHint"),
        themes: {
          system: t("sections.appearance.themes.system"),
          light: t("sections.appearance.themes.light"),
          dark: t("sections.appearance.themes.dark"),
        },
        logo: t("sections.appearance.logo"),
        logoHint: t("sections.appearance.logoHint"),
        uploadLogo: t("sections.appearance.uploadLogo"),
        uploadingLogo: t("sections.appearance.uploadingLogo"),
        logoAlt: t("sections.appearance.logoAlt"),
        invalidLogoType: t("sections.appearance.invalidLogoType"),
        logoTooLarge: t("sections.appearance.logoTooLarge"),
        logoUploadError: t("sections.appearance.logoUploadError"),
        brandColor: t("sections.appearance.brandColor"),
        brandColorHint: t("sections.appearance.brandColorHint"),
        previewTitle: t("sections.appearance.previewTitle"),
        previewSubtitle: t("sections.appearance.previewSubtitle"),
        previewCta: t("sections.appearance.previewCta"),
        brandColorMockHint: t("sections.appearance.brandColorMockHint"),
      },
      security: {
        title: t("sections.security.title"),
        description: t("sections.security.description"),
        twoFactor: t("sections.security.twoFactor"),
        twoFactorEnabled: t("sections.security.twoFactorEnabled"),
        twoFactorDisabled: t("sections.security.twoFactorDisabled"),
        changePassword: t("sections.security.changePassword"),
        signOutSessions: t("sections.security.signOutSessions"),
        sessionsHint: t("sections.security.sessionsHint", { count: 0 }),
        dangerZone: t("sections.security.dangerZone"),
        dangerDescription: t("sections.security.dangerDescription"),
        deactivateRestaurant: t("sections.security.deactivateRestaurant"),
        deleteRestaurant: t("sections.security.deleteRestaurant"),
      },
    },
    actions: {
      save: t("actions.save"),
      saving: t("actions.saving"),
      comingSoon: t("actions.comingSoon"),
      testAssistantSuccess: t("actions.testAssistantSuccess"),
      saveSuccess: t("actions.saveSuccess"),
      saveError: t("actions.saveError"),
      readOnly: t("actions.readOnly"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
    },
  };
}

export default async function SettingsPage() {
  const t = await getTranslations("dashboard.settings");
  const context = await getDashboardContext();
  const labels = buildLabels(t);

  if (!context) {
    return null;
  }

  const payload = await loadSettingsPageData(context);
  const restaurantName = context.activeRestaurant?.name ?? "";

  if (!payload) {
    const fallbackData = buildSettingsMockData({
      restaurantName,
      timezone: "America/Santiago",
      currency: "CLP",
    });

    return (
      <SettingsPageClient
        labels={labels}
        data={fallbackData}
        restaurantName={restaurantName}
        restaurantId={null}
        canEdit={false}
        canInviteTeam={false}
        showEmptyState
      />
    );
  }

  return (
    <SettingsPageClient
      labels={labels}
      data={payload.data}
      restaurantName={restaurantName}
      restaurantId={payload.restaurantId}
      canEdit={payload.canEdit}
      canInviteTeam={payload.canInviteTeam}
    />
  );
}
