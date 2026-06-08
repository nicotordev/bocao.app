import { z } from "zod";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  type CountryCode,
} from "@/lib/onboarding/countries";

const countryCodes = COUNTRY_OPTIONS.map(
  (country) => country.code,
) as [CountryCode, ...CountryCode[]];
const currencyCodes = [...CURRENCY_OPTIONS] as [string, ...string[]];
const timezoneCodes = [...TIMEZONE_OPTIONS] as [string, ...string[]];

export const businessTypeSchema = z.enum([
  "RESTAURANT",
  "BAR",
  "CAFE",
  "DARK_KITCHEN",
  "OTHER",
]);

export const primaryGoalSchema = z.enum([
  "ORDERS",
  "RESERVATIONS",
  "WHATSAPP",
  "MENU",
]);

export const serviceModeSchema = z.enum(["DINE_IN", "TAKEOUT", "DELIVERY"]);

export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Ingresa al menos 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  restaurantName: z
    .string()
    .trim()
    .min(2, "Ingresa al menos 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  country: z.enum(countryCodes),
  currency: z.enum(currencyCodes),
  timezone: z.enum(timezoneCodes),
  primaryGoal: primaryGoalSchema,
  city: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(24, "Máximo 24 caracteres")
    .optional()
    .or(z.literal("")),
  businessType: businessTypeSchema.optional(),
  serviceModes: z.array(serviceModeSchema).default([]),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const onboardingStepOneSchema = onboardingSchema.pick({
  organizationName: true,
  country: true,
});

export const onboardingStepTwoSchema = onboardingSchema.pick({
  restaurantName: true,
  city: true,
  phone: true,
  currency: true,
  timezone: true,
});

export const onboardingStepThreeSchema = onboardingSchema.pick({
  primaryGoal: true,
  businessType: true,
  serviceModes: true,
});

export function getPrimaryGoalRedirectPath(
  goal: z.infer<typeof primaryGoalSchema>,
): string {
  const routes: Record<z.infer<typeof primaryGoalSchema>, string> = {
    ORDERS: "/dashboard/orders",
    RESERVATIONS: "/dashboard/reservations",
    WHATSAPP: "/dashboard/whatsapp",
    MENU: "/dashboard/menu",
  };

  return routes[goal];
}
