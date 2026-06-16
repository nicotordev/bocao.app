"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TbUserHeart } from "react-icons/tb";
import { updateProfileNameAction } from "@/app/actions/update-profile-name";
import { parseProfileNameParts } from "@/lib/user-profile";
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

type CompleteProfileNameDialogProps = {
  open: boolean;
  currentName: string;
  onCompleted?: () => void;
};

export function CompleteProfileNameDialog({
  open,
  currentName,
  onCompleted,
}: CompleteProfileNameDialogProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.completeProfileName");
  const initialValues = useMemo(
    () => parseProfileNameParts(currentName),
    [currentName],
  );

  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
  }, [initialValues.firstName, initialValues.lastName, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateProfileNameAction({
        firstName,
        lastName,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onCompleted?.();
      toast.success(t("toasts.success"));
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : t("toasts.error"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="sm:max-w-lg"
      >
        <DialogHeader className="items-center text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-full">
            <TbUserHeart className="size-6" aria-hidden />
          </div>
          <DialogTitle className="font-heading text-xl">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-balance">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">{t("firstName")}</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={t("firstNamePlaceholder")}
                autoComplete="given-name"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">{t("lastName")}</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder={t("lastNamePlaceholder")}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            {t("hint")}
          </p>

          <DialogFooter className="sm:justify-center">
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
