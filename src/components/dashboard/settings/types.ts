export type SettingsSectionId =
  | "profile"
  | "locales"
  | "hours"
  | "whatsapp"
  | "team"
  | "appearance"
  | "security";

export type BusinessType =
  | "restaurant"
  | "cafe"
  | "sushi"
  | "dark_kitchen"
  | "food_truck"
  | "bar"
  | "bakery";

export type WhatsAppConnectionStatus = "connected" | "pending";

export type AssistantTone = "friendly" | "professional" | "casual";

export type BillingPlan = "starter" | "growth" | "enterprise";

export type TeamMemberRole = "owner" | "manager" | "staff";

export type MemberStatus = "active" | "pending" | "inactive";

export type SettingsMockData = {
  profile: {
    name: string;
    businessType: BusinessType;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    countryCode: string;
    timezone: string;
    currency: string;
  };
  contentLocales: string[];
  hours: {
    acceptOrders: boolean;
    acceptReservations: boolean;
    averagePrepMinutes: number;
    tableCapacity: number;
    closedMessage: string;
    weeklySchedule: Array<{
      dayKey: string;
      open: string;
      close: string;
      closed: boolean;
    }>;
  };
  whatsapp: {
    status: WhatsAppConnectionStatus;
    phoneNumber: string;
    autoReply: boolean;
    humanApproval: boolean;
    tone: AssistantTone;
    instructions: string;
  };
  team: Array<{
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: TeamMemberRole;
    status: MemberStatus;
  }>;
  appearance: {
    brandColor: string;
    logoUrl: string | null;
  };
  security: {
    twoFactorEnabled: boolean;
    activeSessions: number;
  };
};

export type SettingsLabels = {
  header: {
    title: string;
    subtitle: string;
    activeRestaurant: string;
  };
  nav: Record<SettingsSectionId, string>;
  sections: {
    profile: {
      title: string;
      description: string;
      fields: {
        name: string;
        businessType: string;
        email: string;
        emailHint: string;
        phone: string;
        address: string;
        addressHint: string;
        city: string;
        country: string;
        timezone: string;
        currency: string;
      };
      businessTypes: Record<BusinessType, string>;
    };
    locales: {
      title: string;
      description: string;
      addLanguage: string;
      addLanguagePlaceholder: string;
      enabledLanguages: string;
      empty: string;
      remove: string;
      save: string;
      saving: string;
      success: string;
      error: string;
      minOne: string;
    };
    hours: {
      title: string;
      description: string;
      acceptOrders: string;
      acceptOrdersHint: string;
      acceptReservations: string;
      acceptReservationsHint: string;
      weeklySchedule: string;
      weeklyScheduleHint: string;
      averagePrep: string;
      averagePrepHint: string;
      tableCapacity: string;
      tableCapacityHint: string;
      tableCapacityFromFloorPlan: string;
      closedMessage: string;
      closedMessageHint: string;
      closed: string;
      open: string;
      close: string;
      statusOpen: string;
      day: string;
      days: Record<string, string>;
    };
    whatsapp: {
      title: string;
      description: string;
      connection: string;
      statusConnected: string;
      statusPending: string;
      connectedNumber: string;
      autoReply: string;
      autoReplyHint: string;
      humanApproval: string;
      humanApprovalHint: string;
      tone: string;
      toneHint: string;
      tones: Record<AssistantTone, string>;
      instructions: string;
      instructionsHint: string;
      testAssistant: string;
      mockHint: string;
    };
    team: {
      title: string;
      description: string;
      inviteMember: string;
      manageTeam: string;
      securityNote: string;
      columns: {
        member: string;
        role: string;
        email: string;
        status: string;
      };
      roles: Record<TeamMemberRole, string>;
      statuses: Record<MemberStatus, string>;
    };
    appearance: {
      title: string;
      description: string;
      language: string;
      languageHint: string;
      theme: string;
      themeHint: string;
      themes: {
        system: string;
        light: string;
        dark: string;
      };
      logo: string;
      logoHint: string;
      uploadLogo: string;
      uploadingLogo: string;
      logoAlt: string;
      invalidLogoType: string;
      logoTooLarge: string;
      logoUploadError: string;
      brandColor: string;
      brandColorHint: string;
      previewTitle: string;
      previewSubtitle: string;
      previewCta: string;
      brandColorMockHint: string;
    };
    security: {
      title: string;
      description: string;
      twoFactor: string;
      twoFactorEnabled: string;
      twoFactorDisabled: string;
      changePassword: string;
      signOutSessions: string;
      sessionsHint: string;
      dangerZone: string;
      dangerDescription: string;
      deactivateRestaurant: string;
      deleteRestaurant: string;
    };
  };
  actions: {
    save: string;
    saving: string;
    comingSoon: string;
    testAssistantSuccess: string;
    saveSuccess: string;
    saveError: string;
    readOnly: string;
  };
  empty: {
    title: string;
    description: string;
  };
};
