export type CountryCode = "CL" | "MX" | "CO" | "AR" | "PE" | "US" | "ES";

export type CountryOption = {
  code: CountryCode;
  label: string;
  currency: string;
  timezone: string;
};

export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  {
    code: "CL",
    label: "Chile",
    currency: "CLP",
    timezone: "America/Santiago",
  },
  {
    code: "MX",
    label: "México",
    currency: "MXN",
    timezone: "America/Mexico_City",
  },
  {
    code: "CO",
    label: "Colombia",
    currency: "COP",
    timezone: "America/Bogota",
  },
  {
    code: "AR",
    label: "Argentina",
    currency: "ARS",
    timezone: "America/Argentina/Buenos_Aires",
  },
  {
    code: "PE",
    label: "Perú",
    currency: "PEN",
    timezone: "America/Lima",
  },
  {
    code: "US",
    label: "Estados Unidos",
    currency: "USD",
    timezone: "America/New_York",
  },
  {
    code: "ES",
    label: "España",
    currency: "EUR",
    timezone: "Europe/Madrid",
  },
] as const;

export const TIMEZONE_OPTIONS = [
  "America/Santiago",
  "America/Mexico_City",
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
  "America/Lima",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Madrid",
] as const;

export const CURRENCY_OPTIONS = [
  "CLP",
  "MXN",
  "COP",
  "ARS",
  "PEN",
  "USD",
  "EUR",
] as const;

export function getCountryOption(code: CountryCode): CountryOption {
  const country = COUNTRY_OPTIONS.find((option) => option.code === code);

  if (!country) {
    return COUNTRY_OPTIONS[0];
  }

  return country;
}
