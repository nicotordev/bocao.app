import "server-only";

import type { OrderType } from "@/generated/prisma/client";
import type { SettingsMockData } from "@/components/dashboard/settings/types";
import type { DashboardContext } from "@/lib/dashboard/types";
import { COUNTRY_OPTIONS } from "@/lib/onboarding/countries";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getTeamPageData } from "@/lib/team/service";
import {
  mapMembershipStatusToSettingsStatus,
  mapTeamRoleToSettingsRole,
  toUiBusinessType,
} from "@/lib/settings/mappers";

export type SettingsPagePayload = {
  restaurantId: string;
  canEdit: boolean;
  canInviteTeam: boolean;
  data: SettingsMockData;
};

function resolveCountryLabel(countryCode: string): string {
  return (
    COUNTRY_OPTIONS.find((country) => country.code === countryCode)?.label ??
    countryCode
  );
}

function acceptsOrders(serviceModes: OrderType[]): boolean {
  return serviceModes.length > 0;
}

const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_SCHEDULE = [
  { dayKey: "monday", open: "12:00", close: "23:00", closed: false },
  { dayKey: "tuesday", open: "12:00", close: "23:00", closed: false },
  { dayKey: "wednesday", open: "12:00", close: "23:00", closed: false },
  { dayKey: "thursday", open: "12:00", close: "00:00", closed: false },
  { dayKey: "friday", open: "12:00", close: "01:00", closed: false },
  { dayKey: "saturday", open: "13:00", close: "01:00", closed: false },
  { dayKey: "sunday", open: "13:00", close: "22:00", closed: false },
];

async function loadOrCreateOperatingHours(restaurantId: string) {
  let hours = await prisma.restaurantOperatingHours.findMany({
    where: { restaurantId },
    orderBy: { dayOfWeek: "asc" },
  });

  if (hours.length === 0) {
    hours = await Promise.all(
      DEFAULT_SCHEDULE.map((day, index) =>
        prisma.restaurantOperatingHours.create({
          data: {
            restaurantId,
            dayOfWeek: index,
            openTime: day.open,
            closeTime: day.close,
            isClosed: day.closed,
          },
        }),
      ),
    );
  }

  return hours;
}

function buildHoursFromDb(
  dbHours: Awaited<ReturnType<typeof loadOrCreateOperatingHours>>,
  serviceModes: OrderType[],
  tableCapacity: number,
): SettingsMockData["hours"] {
  return {
    acceptOrders: acceptsOrders(serviceModes),
    acceptReservations: true,
    averagePrepMinutes: 22,
    tableCapacity,
    closedMessage:
      "Estamos cerrados por ahora. Puedes ver el menú y volver en nuestro horario de atención.",
    weeklySchedule: dbHours.map((h) => ({
      dayKey: DAY_NAMES[h.dayOfWeek],
      open: h.openTime,
      close: h.closeTime,
      closed: h.isClosed,
    })),
  };
}

export async function loadSettingsPageData(
  context: DashboardContext,
): Promise<SettingsPagePayload | null> {
  const restaurantId = context.activeRestaurant?.id;

  if (!restaurantId) {
    return null;
  }

  const canEdit = context.membership.permissions.includes(
    PERMISSIONS.SETTINGS_WRITE,
  );

  const [restaurant, tableCapacity, teamPage, sessionCount, dbHours] =
    await Promise.all([
      prisma.restaurant.findFirst({
        where: {
          id: restaurantId,
          organizationId: context.organization.id,
        },
        select: {
          id: true,
          name: true,
          city: true,
          phone: true,
          businessType: true,
          timezone: true,
          currency: true,
          brandColor: true,
          logoUrl: true,
          serviceModes: true,
          contentLocales: true,
          organization: {
            select: {
              country: true,
            },
          },
          whatsAppConfig: {
            select: {
              displayPhoneNumber: true,
            },
          },
        },
      }),
      prisma.diningTable.count({
        where: {
          surface: {
            restaurantId,
          },
        },
      }),
      getTeamPageData(context).catch(() => null),
      prisma.session.count({
        where: {
          userId: context.user.id,
        },
      }),
      loadOrCreateOperatingHours(restaurantId),
    ]);

  if (!restaurant) {
    return null;
  }

  const whatsappConnected = Boolean(restaurant.whatsAppConfig);
  const hours = buildHoursFromDb(
    dbHours,
    restaurant.serviceModes,
    tableCapacity,
  );

  const teamMembers =
    teamPage?.members
      .filter((member) => member.status !== "removed")
      .slice(0, 8)
      .map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image,
        role: mapTeamRoleToSettingsRole(member.role),
        status: mapMembershipStatusToSettingsStatus(member.status),
      })) ?? [];

  const pendingInvitations =
    teamPage?.invitations
      .filter((invitation) => invitation.status === "pending")
      .slice(0, 4)
      .map((invitation) => ({
        id: invitation.id,
        name: invitation.email.split("@")[0] ?? invitation.email,
        email: invitation.email,
        image: null,
        role: mapTeamRoleToSettingsRole(invitation.role),
        status: "pending" as const,
      })) ?? [];

  const data: SettingsMockData = {
    profile: {
      name: restaurant.name,
      businessType: toUiBusinessType(restaurant.businessType),
      email: context.user.email,
      phone: restaurant.phone ?? "",
      address: "",
      city: restaurant.city ?? "",
      country: resolveCountryLabel(restaurant.organization.country),
      countryCode: restaurant.organization.country,
      timezone: restaurant.timezone,
      currency: restaurant.currency,
    },
    contentLocales: restaurant.contentLocales,
    hours,
    whatsapp: {
      status: whatsappConnected ? "connected" : "pending",
      phoneNumber:
        restaurant.whatsAppConfig?.displayPhoneNumber ??
        restaurant.phone ??
        "—",
      autoReply: true,
      humanApproval: false,
      tone: "friendly",
      instructions:
        "Eres el asistente del restaurante. Responde de forma cálida, confirma reservas y deriva pedidos complejos al equipo humano.",
    },
    team: [...teamMembers, ...pendingInvitations],
    appearance: {
      brandColor: restaurant.brandColor ?? "#E85D3B",
      logoUrl: restaurant.logoUrl,
    },
    security: {
      twoFactorEnabled: false,
      activeSessions: sessionCount,
    },
  };

  return {
    restaurantId,
    canEdit,
    canInviteTeam: teamPage?.permissions.canInvite ?? false,
    data,
  };
}
