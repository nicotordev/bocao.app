import { z } from "zod";
import { businessTypeSchema } from "@/lib/onboarding/schema";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/onboarding/countries";

const countryCodes = COUNTRY_OPTIONS.map((country) => country.code) as [
  (typeof COUNTRY_OPTIONS)[number]["code"],
  ...(typeof COUNTRY_OPTIONS)[number]["code"][],
];

const currencyCodes = [...CURRENCY_OPTIONS] as [string, ...string[]];
const timezoneCodes = [...TIMEZONE_OPTIONS] as [string, ...string[]];

const uiBusinessTypeSchema = z.enum([
  "restaurant",
  "cafe",
  "sushi",
  "dark_kitchen",
  "food_truck",
  "bar",
  "bakery",
]);

export const updateRestaurantProfileSchema = z.object({
  restaurantId: z.string().cuid(),
  name: z.string().trim().min(2).max(80),
  businessType: uiBusinessTypeSchema,
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.enum(countryCodes),
  timezone: z.enum(timezoneCodes),
  currency: z.enum(currencyCodes),
});

export type UpdateRestaurantProfileInput = z.infer<
  typeof updateRestaurantProfileSchema
>;
