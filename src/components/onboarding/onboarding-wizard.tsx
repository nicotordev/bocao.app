"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingLocalePicker } from "@/components/onboarding/onboarding-locale-picker";
import { completeOnboarding } from "@/app/actions/complete-onboarding";
import type { DashboardUser } from "@/lib/dashboard/types";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  getCountryOption,
  type CountryCode,
} from "@/lib/onboarding/countries";
import {
  BUSINESS_TYPE_VALUES,
  PRIMARY_GOAL_VALUES,
  SERVICE_MODE_VALUES,
  type PrimaryGoalValue,
  type ServiceModeValue,
} from "@/lib/onboarding/labels";
import {
  createOnboardingStepOneSchema,
  createOnboardingStepThreeSchema,
  createOnboardingStepTwoSchema,
  type OnboardingFormValues,
} from "@/lib/onboarding/schema";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const onboardingBackgroundImage =
  "/img/auth/pexels-thien-binh-451964862-17264367.webp";

const STEP_IDS = [1, 2, 3] as const;

type StepId = (typeof STEP_IDS)[number];

function getStepTitle(
  t: ReturnType<typeof useTranslations<"onboarding">>,
  stepId: StepId,
) {
  switch (stepId) {
    case 1:
      return t("steps.1.title");
    case 2:
      return t("steps.2.title");
    case 3:
      return t("steps.3.title");
  }
}

function getStepDescription(
  t: ReturnType<typeof useTranslations<"onboarding">>,
  stepId: StepId,
) {
  switch (stepId) {
    case 1:
      return t("steps.1.description");
    case 2:
      return t("steps.2.description");
    case 3:
      return t("steps.3.description");
  }
}

type OnboardingWizardProps = {
  user: DashboardUser;
};

type FormErrors = Partial<Record<keyof OnboardingFormValues, string>>;

const defaultValues: OnboardingFormValues = {
  organizationName: "",
  restaurantName: "",
  country: "CL",
  currency: "CLP",
  timezone: "America/Santiago",
  primaryGoal: "ORDERS",
  city: "",
  phone: "",
  businessType: undefined,
  serviceModes: [],
};

function mapZodErrors(
  fieldErrors: Record<string, string[] | undefined>,
): FormErrors {
  const errors: FormErrors = {};

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) {
      errors[key as keyof OnboardingFormValues] = messages[0];
    }
  }

  return errors;
}

function FieldMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<OnboardingFormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessages = useMemo(
    () => ({
      minChars: t("validation.minChars"),
      maxChars80: t("validation.maxChars80"),
      maxChars24: t("validation.maxChars24"),
    }),
    [t],
  );

  const stepOneSchema = useMemo(
    () => createOnboardingStepOneSchema(validationMessages),
    [validationMessages],
  );
  const stepTwoSchema = useMemo(
    () => createOnboardingStepTwoSchema(validationMessages),
    [validationMessages],
  );
  const stepThreeSchema = useMemo(
    () => createOnboardingStepThreeSchema(validationMessages),
    [validationMessages],
  );

  const firstName = useMemo(
    () => user.name.split(" ").filter(Boolean)[0] ?? user.name,
    [user.name],
  );

  const updateValues = (patch: Partial<OnboardingFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors({});
    setFormError(null);
  };

  const handleCountryChange = (country: CountryCode) => {
    const option = getCountryOption(country);
    updateValues({
      country,
      currency: option.currency,
      timezone: option.timezone,
    });
  };

  const validateStep = (currentStepNumber: number): boolean => {
    if (currentStepNumber === 1) {
      const result = stepOneSchema.safeParse(values);
      if (!result.success) {
        setErrors(mapZodErrors(result.error.flatten().fieldErrors));
        return false;
      }
      return true;
    }

    if (currentStepNumber === 2) {
      const result = stepTwoSchema.safeParse(values);
      if (!result.success) {
        setErrors(mapZodErrors(result.error.flatten().fieldErrors));
        return false;
      }
      return true;
    }

    const result = stepThreeSchema.safeParse(values);
    if (!result.success) {
      setErrors(mapZodErrors(result.error.flatten().fieldErrors));
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) => Math.min(current + 1, STEP_IDS.length));
  };

  const handleBack = () => {
    setErrors({});
    setFormError(null);
    setStep((current) => Math.max(current - 1, 1));
  };

  const toggleServiceMode = (mode: ServiceModeValue, checked: boolean) => {
    updateValues({
      serviceModes: checked
        ? [...new Set([...values.serviceModes, mode])]
        : values.serviceModes.filter((current) => current !== mode),
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const result = await completeOnboarding(values);

    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        setErrors(mapZodErrors(result.fieldErrors));
      }

      setFormError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(t("success"));
    router.push(result.redirectTo);
    router.refresh();
  };

  return (
    <AuthShell sideImage={onboardingBackgroundImage}>
      <AuthPageHeader
        title={getStepTitle(t, step as StepId)}
        description={
          <>
            {t("greeting", { name: firstName })}{" "}
            {getStepDescription(t, step as StepId)}
          </>
        }
      />

      <div className="mt-8 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {STEP_IDS.map((item) => (
            <div
              key={item}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors",
                step === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : step > item
                    ? "border-border bg-muted/40 text-foreground"
                    : "border-border bg-background text-muted-foreground",
              )}
            >
              {getStepTitle(t, item)}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t("stepProgress", { current: step, total: STEP_IDS.length })}
        </p>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>{tCommon("error")}</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t("fields.language")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("fields.languageHint")}
              </p>
              <OnboardingLocalePicker disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">
                {t("fields.organizationName")}
              </Label>
              <Input
                id="organizationName"
                value={values.organizationName}
                onChange={(event) =>
                  updateValues({ organizationName: event.target.value })
                }
                placeholder={t("fields.organizationNamePlaceholder")}
                aria-invalid={!!errors.organizationName}
              />
              <FieldMessage message={errors.organizationName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("fields.country")}</Label>
              <Select
                value={values.country}
                onValueChange={(value) =>
                  handleCountryChange(value as CountryCode)
                }
              >
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder={t("fields.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("fields.countryHint")}
              </p>
              <FieldMessage message={errors.country} />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">
                {t("fields.restaurantName")}
              </Label>
              <Input
                id="restaurantName"
                value={values.restaurantName}
                onChange={(event) =>
                  updateValues({ restaurantName: event.target.value })
                }
                placeholder={t("fields.restaurantNamePlaceholder")}
                aria-invalid={!!errors.restaurantName}
              />
              <FieldMessage message={errors.restaurantName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t("fields.city")}</Label>
              <Input
                id="city"
                value={values.city ?? ""}
                onChange={(event) => updateValues({ city: event.target.value })}
                placeholder={t("fields.cityPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("fields.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={values.phone ?? ""}
                onChange={(event) =>
                  updateValues({ phone: event.target.value })
                }
                placeholder={t("fields.phonePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("fields.currency")}</Label>
              <Select
                value={values.currency}
                onValueChange={(value) => updateValues({ currency: value })}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder={t("fields.currencyPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldMessage message={errors.currency} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t("fields.timezone")}</Label>
              <Select
                value={values.timezone}
                onValueChange={(value) => updateValues({ timezone: value })}
              >
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue placeholder={t("fields.timezonePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldMessage message={errors.timezone} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t("fields.primaryGoal")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("fields.primaryGoalHint")}
              </p>
              <div className="space-y-2">
                {PRIMARY_GOAL_VALUES.map((value) => {
                  const selected = values.primaryGoal === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        updateValues({
                          primaryGoal: value as PrimaryGoalValue,
                        })
                      }
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <p className="text-sm font-medium">
                        {t(`primaryGoals.${value}.label`)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(`primaryGoals.${value}.description`)}
                      </p>
                    </button>
                  );
                })}
              </div>
              <FieldMessage message={errors.primaryGoal} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">{t("fields.businessType")}</Label>
              <Select
                value={values.businessType}
                onValueChange={(value) =>
                  updateValues({
                    businessType: value as OnboardingFormValues["businessType"],
                  })
                }
              >
                <SelectTrigger id="businessType" className="w-full">
                  <SelectValue
                    placeholder={t("fields.businessTypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`businessTypes.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("fields.serviceModes")}</Label>
              <div className="space-y-2">
                {SERVICE_MODE_VALUES.map((value) => {
                  const checked = values.serviceModes.includes(value);

                  return (
                    <label
                      key={value}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(checkedValue) =>
                          toggleServiceMode(value, checkedValue === true)
                        }
                      />
                      <span className="text-sm">
                        {t(`serviceModes.${value}`)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {step < STEP_IDS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full"
            >
              {t("continue")}
              <IconArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? <Spinner /> : null}
              {t("createRestaurant")}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className="w-full"
          >
            <IconArrowLeft className="size-4" aria-hidden />
            {t("back")}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
