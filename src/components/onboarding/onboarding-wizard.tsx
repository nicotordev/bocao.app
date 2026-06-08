"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
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
  BUSINESS_TYPE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SERVICE_MODE_OPTIONS,
  type PrimaryGoalValue,
  type ServiceModeValue,
} from "@/lib/onboarding/labels";
import {
  onboardingStepOneSchema,
  onboardingStepThreeSchema,
  onboardingStepTwoSchema,
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

const STEPS = [
  {
    id: 1,
    title: "Tu negocio",
    description: "Cuéntanos sobre tu empresa para crear tu espacio en Bocao.",
  },
  {
    id: 2,
    title: "Tu local",
    description: "Configura el primer restaurante que vas a operar.",
  },
  {
    id: 3,
    title: "Tu operación",
    description: "Elige por dónde quieres empezar dentro del dashboard.",
  },
] as const;

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
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<OnboardingFormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = STEPS[step - 1];

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
      const result = onboardingStepOneSchema.safeParse(values);
      if (!result.success) {
        setErrors(mapZodErrors(result.error.flatten().fieldErrors));
        return false;
      }
      return true;
    }

    if (currentStepNumber === 2) {
      const result = onboardingStepTwoSchema.safeParse(values);
      if (!result.success) {
        setErrors(mapZodErrors(result.error.flatten().fieldErrors));
        return false;
      }
      return true;
    }

    const result = onboardingStepThreeSchema.safeParse(values);
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

    setStep((current) => Math.min(current + 1, STEPS.length));
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

    toast.success("¡Tu restaurante está listo!");
    router.push(result.redirectTo);
    router.refresh();
  };

  return (
    <AuthShell sideImage={onboardingBackgroundImage}>
      <AuthPageHeader
        title={currentStep.title}
        description={
          <>
            Hola {firstName}. {currentStep.description}
          </>
        }
      />

      <div className="mt-8 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors",
                step === item.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : step > item.id
                    ? "border-border bg-muted/40 text-foreground"
                    : "border-border bg-background text-muted-foreground",
              )}
            >
              {item.title}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Paso {step} de {STEPS.length}
        </p>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre del negocio</Label>
              <Input
                id="organizationName"
                value={values.organizationName}
                onChange={(event) =>
                  updateValues({ organizationName: event.target.value })
                }
                placeholder="Ej. Grupo Bocao"
                aria-invalid={!!errors.organizationName}
              />
              <FieldMessage message={errors.organizationName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Select
                value={values.country}
                onValueChange={(value) =>
                  handleCountryChange(value as CountryCode)
                }
              >
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Selecciona un país" />
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
                Usamos el país para sugerir moneda y zona horaria.
              </p>
              <FieldMessage message={errors.country} />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nombre del local</Label>
              <Input
                id="restaurantName"
                value={values.restaurantName}
                onChange={(event) =>
                  updateValues({ restaurantName: event.target.value })
                }
                placeholder="Ej. Bocao Providencia"
                aria-invalid={!!errors.restaurantName}
              />
              <FieldMessage message={errors.restaurantName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad (opcional)</Label>
              <Input
                id="city"
                value={values.city ?? ""}
                onChange={(event) => updateValues({ city: event.target.value })}
                placeholder="Ej. Santiago"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={values.phone ?? ""}
                onChange={(event) => updateValues({ phone: event.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={values.currency}
                onValueChange={(value) => updateValues({ currency: value })}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Moneda" />
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
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select
                value={values.timezone}
                onValueChange={(value) => updateValues({ timezone: value })}
              >
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue placeholder="Zona horaria" />
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
              <Label>Objetivo inicial del producto</Label>
              <p className="text-xs text-muted-foreground">
                Te llevaremos directo al módulo que quieres configurar primero.
              </p>
              <div className="space-y-2">
                {PRIMARY_GOAL_OPTIONS.map((option) => {
                  const selected = values.primaryGoal === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateValues({
                          primaryGoal: option.value as PrimaryGoalValue,
                        })
                      }
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <FieldMessage message={errors.primaryGoal} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Tipo de negocio (opcional)</Label>
              <Select
                value={values.businessType}
                onValueChange={(value) =>
                  updateValues({
                    businessType: value as OnboardingFormValues["businessType"],
                  })
                }
              >
                <SelectTrigger id="businessType" className="w-full">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modalidades de servicio (opcional)</Label>
              <div className="space-y-2">
                {SERVICE_MODE_OPTIONS.map((option) => {
                  const checked = values.serviceModes.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleServiceMode(option.value, value === true)
                        }
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full"
            >
              Continuar
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
              Crear restaurante
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
            Atrás
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
