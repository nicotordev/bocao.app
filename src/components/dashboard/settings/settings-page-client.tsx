"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import {
  TbAlertTriangle,
  TbBrandWhatsapp,
  TbBuildingStore,
  TbClock,
  TbCreditCard,
  TbLock,
  TbPalette,
  TbShield,
  TbSparkles,
  TbUsers,
} from "react-icons/tb";
import { toast } from "sonner";
import { setLocale } from "@/app/actions/locale";
import { updateRestaurantProfileAction } from "@/app/actions/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { localeLabels } from "@/i18n/locale-labels";
import { locales } from "@/i18n/locales";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/onboarding/countries";
import type {
  BusinessType,
  SettingsLabels,
  SettingsMockData,
  SettingsSectionId,
} from "./types";

type SettingsPageClientProps = {
  labels: SettingsLabels;
  data: SettingsMockData;
  restaurantName: string;
  restaurantId: string | null;
  canEdit: boolean;
  canInviteTeam: boolean;
  showEmptyState?: boolean;
};

const SECTION_ICONS: Record<SettingsSectionId, typeof TbBuildingStore> = {
  profile: TbBuildingStore,
  hours: TbClock,
  whatsapp: TbBrandWhatsapp,
  team: TbUsers,
  billing: TbCreditCard,
  appearance: TbPalette,
  security: TbLock,
};

const SECTION_ORDER: SettingsSectionId[] = [
  "profile",
  "hours",
  "whatsapp",
  "team",
  "billing",
  "appearance",
  "security",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function SettingsPageClient({
  labels,
  data: initialData,
  restaurantName,
  restaurantId,
  canEdit,
  canInviteTeam,
  showEmptyState = false,
}: SettingsPageClientProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("profile");
  const [data, setData] = useState(initialData);
  const [profile, setProfile] = useState(initialData.profile);
  const [isSaving, setIsSaving] = useState(false);

  const showComingSoon = () => {
    toast.message(labels.actions.comingSoon);
  };

  const handleSaveProfile = async () => {
    if (!restaurantId || !canEdit) {
      toast.message(labels.actions.readOnly);
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateRestaurantProfileAction({
        restaurantId,
        name: profile.name,
        businessType: profile.businessType,
        phone: profile.phone,
        city: profile.city,
        country: profile.countryCode,
        timezone: profile.timezone,
        currency: profile.currency,
      });

      if (!result.success) {
        toast.error(labels.actions.saveError);
        return;
      }

      setData((current) => ({ ...current, profile }));
      toast.success(labels.actions.saveSuccess);
    } catch {
      toast.error(labels.actions.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (showEmptyState) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <SettingsHeader
          labels={labels.header}
          restaurantName={restaurantName}
        />
        <Alert>
          <AlertTitle>{labels.empty.title}</AlertTitle>
          <AlertDescription>{labels.empty.description}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <SettingsHeader
        labels={labels.header}
        restaurantName={restaurantName}
      />

      {!canEdit ? (
        <Alert className="border-border/50 bg-muted/20">
          <AlertTitle>{labels.actions.readOnly}</AlertTitle>
        </Alert>
      ) : null}

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as SettingsSectionId)}
        orientation="vertical"
        className="flex flex-col gap-6 lg:flex-row lg:items-start"
      >
        <div className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
          <TabsList
            variant="line"
            className="h-auto w-full flex-row gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-card/60 p-2 backdrop-blur-sm lg:flex-col lg:items-stretch lg:overflow-visible"
          >
            {SECTION_ORDER.map((sectionId) => {
              const Icon = SECTION_ICONS[sectionId];
              return (
                <TabsTrigger
                  key={sectionId}
                  value={sectionId}
                  className="min-w-[9.5rem] justify-start gap-2 rounded-xl px-3 py-2.5 lg:min-w-0 lg:w-full"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {labels.nav[sectionId]}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <TabsContent value="profile" className="mt-0">
            <ProfileSection
              labels={labels}
              profile={profile}
              canEdit={canEdit}
              onProfileChange={setProfile}
            />
          </TabsContent>

          <TabsContent value="hours" className="mt-0">
            <HoursSection
              labels={labels}
              data={data}
              canEdit={canEdit}
              onChange={setData}
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-0">
            <WhatsAppSection
              labels={labels}
              data={data}
              canEdit={canEdit}
              onChange={setData}
              onTestAssistant={() =>
                toast.success(labels.actions.testAssistantSuccess)
              }
            />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <TeamSection
              labels={labels}
              data={data}
              canInviteTeam={canInviteTeam}
              onInvite={() => router.push("/dashboard/team")}
            />
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
            <BillingSection labels={labels} data={data} onAction={showComingSoon} />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <AppearanceSection
              labels={labels}
              data={data}
              restaurantName={restaurantName}
              profileName={profile.name}
              onBrandColorChange={(brandColor) =>
                setData((current) => ({
                  ...current,
                  appearance: { ...current.appearance, brandColor },
                }))
              }
            />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecuritySection labels={labels} data={data} onAction={showComingSoon} />
          </TabsContent>

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={!canEdit || isSaving}
            >
              {isSaving ? labels.actions.saving : labels.actions.save}
            </Button>
          </div>
        </div>
      </Tabs>

    </main>
  );
}

function SettingsHeader({
  labels,
  restaurantName,
}: {
  labels: SettingsLabels["header"];
  restaurantName: string;
}) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-2xl space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {labels.title}
          </h1>
          <Badge
            variant="secondary"
            className="border border-primary/20 bg-primary/10 text-primary"
          >
            {labels.activeRestaurant}
            {restaurantName ? ` · ${restaurantName}` : ""}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground md:text-base">
          {labels.subtitle}
        </p>
      </div>
    </section>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

function ProfileSection({
  labels,
  profile,
  canEdit,
  onProfileChange,
}: {
  labels: SettingsLabels;
  profile: SettingsMockData["profile"];
  canEdit: boolean;
  onProfileChange: (profile: SettingsMockData["profile"]) => void;
}) {
  const section = labels.sections.profile;

  const updateProfile = (patch: Partial<SettingsMockData["profile"]>) => {
    onProfileChange({ ...profile, ...patch });
  };

  return (
    <SectionCard title={section.title} description={section.description}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="restaurant-name">{section.fields.name}</Label>
          <Input
            id="restaurant-name"
            value={profile.name}
            onChange={(event) => updateProfile({ name: event.target.value })}
            autoComplete="organization"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-type">{section.fields.businessType}</Label>
          <Select
            value={profile.businessType}
            onValueChange={(value) =>
              updateProfile({ businessType: value as BusinessType })
            }
            disabled={!canEdit}
          >
            <SelectTrigger id="business-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(section.businessTypes).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email">{section.fields.email}</Label>
          <Input
            id="contact-email"
            type="email"
            value={profile.email}
            disabled
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            {section.fields.emailHint}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-phone">{section.fields.phone}</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={profile.phone}
            onChange={(event) => updateProfile({ phone: event.target.value })}
            autoComplete="tel"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">{section.fields.address}</Label>
          <Input
            id="address"
            value={profile.address}
            onChange={(event) => updateProfile({ address: event.target.value })}
            autoComplete="street-address"
            disabled={!canEdit}
            placeholder={section.fields.addressHint}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{section.fields.city}</Label>
          <Input
            id="city"
            value={profile.city}
            onChange={(event) => updateProfile({ city: event.target.value })}
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">{section.fields.country}</Label>
          <Select
            value={profile.countryCode}
            onValueChange={(value) => {
              const country = COUNTRY_OPTIONS.find(
                (option) => option.code === value,
              );
              updateProfile({
                countryCode: value,
                country: country?.label ?? value,
              });
            }}
            disabled={!canEdit}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">{section.fields.timezone}</Label>
          <Select
            value={profile.timezone}
            onValueChange={(value) => updateProfile({ timezone: value })}
            disabled={!canEdit}
          >
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue />
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

        <div className="space-y-2">
          <Label htmlFor="currency">{section.fields.currency}</Label>
          <Select
            value={profile.currency}
            onValueChange={(value) => updateProfile({ currency: value })}
            disabled={!canEdit}
          >
            <SelectTrigger id="currency" className="w-full">
              <SelectValue />
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
      </div>
    </SectionCard>
  );
}

function HoursSection({
  labels,
  data,
  canEdit,
  onChange,
}: {
  labels: SettingsLabels;
  data: SettingsMockData;
  canEdit: boolean;
  onChange: React.Dispatch<React.SetStateAction<SettingsMockData>>;
}) {
  const section = labels.sections.hours;

  const updateHours = (patch: Partial<SettingsMockData["hours"]>) => {
    onChange((current) => ({
      ...current,
      hours: { ...current.hours, ...patch },
    }));
  };

  return (
    <SectionCard title={section.title} description={section.description}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <div className="space-y-1">
            <Label htmlFor="accept-orders" className="text-sm font-medium">
              {section.acceptOrders}
            </Label>
            <p className="text-xs text-muted-foreground">
              {section.acceptOrdersHint}
            </p>
          </div>
          <Switch
            id="accept-orders"
            checked={data.hours.acceptOrders}
            onCheckedChange={(checked) => updateHours({ acceptOrders: checked })}
            disabled={!canEdit}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <div className="space-y-1">
            <Label htmlFor="accept-reservations" className="text-sm font-medium">
              {section.acceptReservations}
            </Label>
            <p className="text-xs text-muted-foreground">
              {section.acceptReservationsHint}
            </p>
          </div>
          <Switch
            id="accept-reservations"
            checked={data.hours.acceptReservations}
            onCheckedChange={(checked) =>
              updateHours({ acceptReservations: checked })
            }
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">{section.weeklySchedule}</h3>
          <p className="text-xs text-muted-foreground">
            {section.weeklyScheduleHint}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium" scope="col">
                  {section.day}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {section.open}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {section.close}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {section.closed}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.hours.weeklySchedule.map((row) => (
                <tr
                  key={row.dayKey}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {section.days[row.dayKey]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.closed ? "—" : row.open}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.closed ? "—" : row.close}
                  </td>
                  <td className="px-4 py-3">
                    {row.closed ? (
                      <Badge variant="outline">{section.closed}</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {section.statusOpen}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="avg-prep">{section.averagePrep}</Label>
          <Input
            id="avg-prep"
            type="number"
            min={1}
            defaultValue={data.hours.averagePrepMinutes}
            disabled={!canEdit}
          />
          <p className="text-xs text-muted-foreground">
            {section.averagePrepHint}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="table-capacity">{section.tableCapacity}</Label>
          <Input
            id="table-capacity"
            type="number"
            min={0}
            value={data.hours.tableCapacity}
            readOnly
            disabled
          />
          <p className="text-xs text-muted-foreground">
            {section.tableCapacityFromFloorPlan}
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="closed-message">{section.closedMessage}</Label>
          <Textarea
            id="closed-message"
            defaultValue={data.hours.closedMessage}
            rows={3}
            disabled={!canEdit}
          />
          <p className="text-xs text-muted-foreground">
            {section.closedMessageHint}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function WhatsAppSection({
  labels,
  data,
  canEdit,
  onChange,
  onTestAssistant,
}: {
  labels: SettingsLabels;
  data: SettingsMockData;
  canEdit: boolean;
  onChange: React.Dispatch<React.SetStateAction<SettingsMockData>>;
  onTestAssistant: () => void;
}) {
  const section = labels.sections.whatsapp;

  const updateWhatsapp = (patch: Partial<SettingsMockData["whatsapp"]>) => {
    onChange((current) => ({
      ...current,
      whatsapp: { ...current.whatsapp, ...patch },
    }));
  };

  return (
    <SectionCard title={section.title} description={section.description}>
      <Alert className="border-border/50 bg-muted/20">
        <AlertDescription>{section.mockHint}</AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{section.connection}</p>
          <p className="text-xs text-muted-foreground">
            {section.connectedNumber}: {data.whatsapp.phoneNumber}
          </p>
        </div>
        <Badge
          variant={
            data.whatsapp.status === "connected" ? "secondary" : "outline"
          }
          className={
            data.whatsapp.status === "connected"
              ? "bg-emerald-500/15 text-emerald-400"
              : undefined
          }
        >
          {data.whatsapp.status === "connected"
            ? section.statusConnected
            : section.statusPending}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4">
          <div className="space-y-1">
            <Label htmlFor="auto-reply" className="text-sm font-medium">
              {section.autoReply}
            </Label>
            <p className="text-xs text-muted-foreground">
              {section.autoReplyHint}
            </p>
          </div>
          <Switch
            id="auto-reply"
            checked={data.whatsapp.autoReply}
            onCheckedChange={(checked) => updateWhatsapp({ autoReply: checked })}
            disabled={!canEdit}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4">
          <div className="space-y-1">
            <Label htmlFor="human-approval" className="text-sm font-medium">
              {section.humanApproval}
            </Label>
            <p className="text-xs text-muted-foreground">
              {section.humanApprovalHint}
            </p>
          </div>
          <Switch
            id="human-approval"
            checked={data.whatsapp.humanApproval}
            onCheckedChange={(checked) =>
              updateWhatsapp({ humanApproval: checked })
            }
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="assistant-tone">{section.tone}</Label>
          <Select
            value={data.whatsapp.tone}
            onValueChange={(value) =>
              updateWhatsapp({
                tone: value as SettingsMockData["whatsapp"]["tone"],
              })
            }
            disabled={!canEdit}
          >
            <SelectTrigger id="assistant-tone" className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(section.tones).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{section.toneHint}</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="assistant-instructions">{section.instructions}</Label>
          <Textarea
            id="assistant-instructions"
            value={data.whatsapp.instructions}
            onChange={(event) =>
              updateWhatsapp({ instructions: event.target.value })
            }
            rows={4}
            disabled={!canEdit}
          />
          <p className="text-xs text-muted-foreground">
            {section.instructionsHint}
          </p>
        </div>
      </div>

      <Button type="button" variant="secondary" onClick={onTestAssistant}>
        <TbSparkles className="size-4" aria-hidden />
        {section.testAssistant}
      </Button>
    </SectionCard>
  );
}

function TeamSection({
  labels,
  data,
  canInviteTeam,
  onInvite,
}: {
  labels: SettingsLabels;
  data: SettingsMockData;
  canInviteTeam: boolean;
  onInvite: () => void;
}) {
  const section = labels.sections.team;

  return (
    <SectionCard title={section.title} description={section.description}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Alert className="flex-1 border-border/50 bg-muted/20">
          <TbShield className="size-4" aria-hidden />
          <AlertTitle className="text-sm">{section.securityNote}</AlertTitle>
        </Alert>
        <div className="flex flex-wrap gap-2">
          {canInviteTeam ? (
            <Button type="button" onClick={onInvite}>
              {section.inviteMember}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onInvite}>
            {section.manageTeam}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/50">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-border/50 bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">
                {section.columns.member}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {section.columns.role}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {section.columns.email}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {section.columns.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.team.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border/40 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/15 text-xs text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{section.roles[member.role]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {member.email}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      member.status === "active" ? "secondary" : "outline"
                    }
                  >
                    {section.statuses[member.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function BillingSection({
  labels,
  data,
  onAction,
}: {
  labels: SettingsLabels;
  data: SettingsMockData;
  onAction: () => void;
}) {
  const section = labels.sections.billing;
  const usageItems = [
    {
      key: "whatsapp",
      label: section.usage.whatsapp,
      ...data.billing.usage.whatsappMessages,
    },
    {
      key: "ai",
      label: section.usage.aiCredits,
      ...data.billing.usage.aiCredits,
    },
    {
      key: "reservations",
      label: section.usage.reservations,
      ...data.billing.usage.reservations,
    },
  ] as const;

  return (
    <SectionCard title={section.title} description={section.description}>
      <Alert className="border-border/50 bg-muted/20">
        <AlertDescription>{section.mockHint}</AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {section.currentPlan}
          </p>
          <p className="font-heading text-2xl font-semibold">
            {section.plans[data.billing.plan]}
          </p>
        </div>
        <Badge className="w-fit bg-primary/20 text-primary hover:bg-primary/20">
          {section.plans[data.billing.plan]}
        </Badge>
      </div>

      <div className="space-y-5">
        {usageItems.map((item) => (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">
                {item.used.toLocaleString()} / {item.limit.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercent(item.used, item.limit)} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onAction}>
          {section.managePlan}
        </Button>
        <Button type="button" variant="outline" onClick={onAction}>
          {section.viewHistory}
        </Button>
      </div>
    </SectionCard>
  );
}

function AppearanceSection({
  labels,
  data,
  restaurantName,
  profileName,
  onBrandColorChange,
}: {
  labels: SettingsLabels;
  data: SettingsMockData;
  restaurantName: string;
  profileName: string;
  onBrandColorChange: (color: string) => void;
}) {
  const section = labels.sections.appearance;
  const locale = useLocale();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const tUserMenu = useTranslations("dashboard.userMenu.preferencesDialog");

  const handleLocaleChange = (value: string) => {
    startTransition(async () => {
      await setLocale(value);
      router.refresh();
    });
  };

  return (
    <SectionCard title={section.title} description={section.description}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="settings-language">{section.language}</Label>
            <Select
              value={locale}
              onValueChange={handleLocaleChange}
              disabled={isPending}
            >
              <SelectTrigger id="settings-language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((code) => (
                  <SelectItem key={code} value={code}>
                    {localeLabels[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {section.languageHint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-theme">{section.theme}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="settings-theme" className="w-full">
                <SelectValue placeholder={tUserMenu("themePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{section.themes.system}</SelectItem>
                <SelectItem value="light">{section.themes.light}</SelectItem>
                <SelectItem value="dark">{section.themes.dark}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{section.themeHint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-color">{section.brandColor}</Label>
            <div className="flex items-center gap-3">
              <Input
                id="brand-color"
                type="color"
                value={data.appearance.brandColor}
                onChange={(event) => onBrandColorChange(event.target.value)}
                className="h-11 w-16 cursor-pointer p-1"
                aria-label={section.brandColor}
              />
              <Input
                value={data.appearance.brandColor}
                onChange={(event) => onBrandColorChange(event.target.value)}
                className="font-mono uppercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {section.brandColorHint}
            </p>
            <p className="text-xs text-muted-foreground">
              {section.brandColorMockHint}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{section.previewTitle}</p>
          <div
            className="overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-5 shadow-lg"
            style={{
              boxShadow: `0 20px 50px -24px ${data.appearance.brandColor}66`,
            }}
          >
            <div
              className="mb-4 inline-flex size-10 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: data.appearance.brandColor }}
              aria-hidden
            >
              <TbBuildingStore className="size-5" />
            </div>
            <p className="font-heading text-lg font-semibold">
              {restaurantName || profileName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.previewSubtitle}
            </p>
            <Button
              type="button"
              className="mt-5 text-white hover:opacity-90"
              style={{ backgroundColor: data.appearance.brandColor }}
            >
              {section.previewCta}
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SecuritySection({
  labels,
  data,
  onAction,
}: {
  labels: SettingsLabels;
  data: SettingsMockData;
  onAction: () => void;
}) {
  const section = labels.sections.security;

  return (
    <div className="space-y-6">
      <SectionCard title={section.title} description={section.description}>
        <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{section.twoFactor}</p>
            <p className="text-xs text-muted-foreground">
              {data.security.twoFactorEnabled
                ? section.twoFactorEnabled
                : section.twoFactorDisabled}
            </p>
          </div>
          <Badge
            variant={data.security.twoFactorEnabled ? "secondary" : "outline"}
          >
            {data.security.twoFactorEnabled
              ? section.twoFactorEnabled
              : section.twoFactorDisabled}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onAction}>
            {section.changePassword}
          </Button>
          <Button type="button" variant="outline" onClick={onAction}>
            {section.signOutSessions}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {section.sessionsHint.replace(
            "{count}",
            String(data.security.activeSessions),
          )}
        </p>
      </SectionCard>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg text-destructive">
            <TbAlertTriangle className="size-5" aria-hidden />
            {section.dangerZone}
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {section.dangerDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onAction}
          >
            {section.deactivateRestaurant}
          </Button>
          <Button type="button" variant="destructive" onClick={onAction}>
            {section.deleteRestaurant}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
