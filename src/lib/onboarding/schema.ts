import { z } from "zod";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  type CountryCode,
} from "@/lib/onboarding/countries";

const countryCodes = COUNTRY_OPTIONS.map((country) => country.code) as [
  CountryCode,
  ...CountryCode[],
];
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

export type OnboardingValidationMessages = {
  minChars: string;
  maxChars80: string;
  maxChars24: string;
};

const defaultValidationMessages: OnboardingValidationMessages = {
  minChars: "Enter at least 2 characters",
  maxChars80: "Maximum 80 characters",
  maxChars24: "Maximum 24 characters",
};

export function createOnboardingSchema(
  messages: OnboardingValidationMessages = defaultValidationMessages,
) {
  return z.object({
    organizationName: z
      .string()
      .trim()
      .min(2, messages.minChars)
      .max(80, messages.maxChars80),
    restaurantName: z
      .string()
      .trim()
      .min(2, messages.minChars)
      .max(80, messages.maxChars80),
    country: z.enum(countryCodes),
    currency: z.enum(currencyCodes),
    timezone: z.enum(timezoneCodes),
    primaryGoal: primaryGoalSchema,
    city: z
      .string()
      .trim()
      .max(80, messages.maxChars80)
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(24, messages.maxChars24)
      .optional()
      .or(z.literal("")),
    businessType: businessTypeSchema.optional(),
    serviceModes: z.array(serviceModeSchema).default([]),
  });
}

export const onboardingSchema = createOnboardingSchema();

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export function createOnboardingStepOneSchema(
  messages: OnboardingValidationMessages = defaultValidationMessages,
) {
  return createOnboardingSchema(messages).pick({
    organizationName: true,
    country: true,
  });
}

export function createOnboardingStepTwoSchema(
  messages: OnboardingValidationMessages = defaultValidationMessages,
) {
  return createOnboardingSchema(messages).pick({
    restaurantName: true,
    city: true,
    phone: true,
    currency: true,
    timezone: true,
  });
}

export function createOnboardingStepThreeSchema(
  messages: OnboardingValidationMessages = defaultValidationMessages,
) {
  return createOnboardingSchema(messages).pick({
    primaryGoal: true,
    businessType: true,
    serviceModes: true,
  });
}

export const onboardingStepOneSchema = createOnboardingStepOneSchema();
export const onboardingStepTwoSchema = createOnboardingStepTwoSchema();
export const onboardingStepThreeSchema = createOnboardingStepThreeSchema();

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
