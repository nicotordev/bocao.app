"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createRestaurantAction } from "@/app/actions/create-restaurant";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/onboarding/countries";
import {
  BUSINESS_TYPE_VALUES,
  type BusinessTypeValue,
} from "@/lib/onboarding/labels";

type CreateRestaurantFormData = {
  name: string;
  city: string;
  currency: string;
  timezone: string;
  businessType?: BusinessTypeValue;
};

type CreateRestaurantDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
};

export function CreateRestaurantDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  defaultCurrency = CURRENCY_OPTIONS[0],
  defaultTimezone = TIMEZONE_OPTIONS[0],
}: CreateRestaurantDialogProps) {
  const tCreate = useTranslations("dashboard.organizations.createDialog");
  const tOnboarding = useTranslations("onboarding");
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<CreateRestaurantFormData>({
    name: "",
    city: "",
    currency: defaultCurrency,
    timezone: defaultTimezone,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData({
      name: "",
      city: "",
      currency: defaultCurrency,
      timezone: defaultTimezone,
      businessType: undefined,
    });
    setFieldErrors({});
  }, [open, defaultCurrency, defaultTimezone]);

  const handleCreateRestaurant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizationId) {
      return;
    }

    startCreateTransition(async () => {
      const result = await createRestaurantAction({
        organizationId,
        name: formData.name,
        city: formData.city,
        currency: formData.currency,
        timezone: formData.timezone,
        businessType: formData.businessType,
      });

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }

      setFieldErrors({});
      onOpenChange(false);
      toast.success(tCreate("createSuccess"));
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tCreate("title")}</DialogTitle>
          <DialogDescription>
            {tCreate("description", { organization: organizationName })}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleCreateRestaurant}>
          <div className="grid gap-2">
            <Label htmlFor="create-restaurant-name">{tCreate("name")}</Label>
            <Input
              id="create-restaurant-name"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={tCreate("namePlaceholder")}
              aria-invalid={fieldErrors.name ? true : undefined}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-restaurant-city">{tCreate("city")}</Label>
            <Input
              id="create-restaurant-city"
              value={formData.city}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
              placeholder={tCreate("cityPlaceholder")}
              aria-invalid={fieldErrors.city ? true : undefined}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-restaurant-business-type">
              {tOnboarding("fields.businessType")}
            </Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  businessType: value as BusinessTypeValue,
                }))
              }
            >
              <SelectTrigger
                id="create-restaurant-business-type"
                className="w-full"
              >
                <SelectValue
                  placeholder={tOnboarding("fields.businessTypePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_VALUES.map((businessType) => (
                  <SelectItem key={businessType} value={businessType}>
                    {tOnboarding(`businessTypes.${businessType}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{tCreate("currency")}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    currency: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tCreate("currency")} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{tCreate("timezone")}</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    timezone: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tCreate("timezone")} />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {tCreate("cancel")}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? tCreate("creating") : tCreate("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
