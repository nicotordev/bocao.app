"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TbLogout, TbSettings, TbUser, TbSelector } from "react-icons/tb";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { authRoutes } from "@/lib/auth-routes";
import type { DashboardUser } from "@/lib/dashboard/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setLocale } from "@/app/actions/locale";
import { uploadAvatarAction } from "@/app/actions/upload";
import { locales } from "@/i18n/locales";
import { localeLabels } from "@/i18n/locale-labels";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  user: DashboardUser;
  roleName: string;
  variant?: "topbar" | "sidebar";
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ user, roleName, variant = "topbar" }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const currentLocale = useLocale();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const [profileName, setProfileName] = useState(user.name);
  const [profileImage, setProfileImage] = useState(user.image ?? "");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState(user.image ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPendingLang, startTransitionLang] = useTransition();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(authRoutes.signIn);
          router.refresh();
        },
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("El archivo debe ser una imagen válida");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen excede el tamaño máximo de 5MB");
        return;
      }
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setIsSavingProfile(true);
    try {
      let finalImageUrl = profileImage;

      if (profileFile) {
        const formData = new FormData();
        formData.append("file", profileFile);
        const res = await uploadAvatarAction(formData);
        finalImageUrl = res.url;
        setProfileImage(finalImageUrl);
      }

      await authClient.updateUser({
        name: profileName,
        image: finalImageUrl || null,
      });
      toast.success("Perfil actualizado correctamente");
      setIsProfileOpen(false);
      setProfileFile(null);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    startTransitionLang(async () => {
      try {
        await setLocale(value);
        toast.success("Idioma actualizado");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Error al actualizar el idioma");
      }
    });
  };

  const isSidebar = variant === "sidebar";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "gap-2.5 rounded-xl transition-all",
              isSidebar
                ? "h-auto w-full justify-start p-2 hover:bg-sidebar-accent text-sidebar-foreground data-[state=open]:bg-sidebar-accent"
                : "h-10.5 px-2.5 hover:bg-muted/60"
            )}
            aria-label="Menú de usuario"
          >
            <Avatar size="sm" className="ring-1 ring-border/50 shrink-0">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-emerald-500/10 text-primary text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "min-w-0 text-left",
                isSidebar
                  ? "flex flex-col flex-1 group-data-[collapsible=icon]:hidden"
                  : "hidden md:block"
              )}
            >
              <span className="block truncate text-xs font-semibold text-foreground/90">
                {user.name}
              </span>
              <span className="block truncate text-[10px] text-muted-foreground/75 font-medium">
                {roleName}
              </span>
            </span>
            {isSidebar && (
              <TbSelector
                className="size-4 shrink-0 text-muted-foreground/70 group-data-[collapsible=icon]:hidden ml-auto"
                aria-hidden
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isSidebar ? "start" : "end"}
          side={isSidebar ? "top" : "bottom"}
          sideOffset={8}
          className="w-56 rounded-xl p-1 shadow-md border-border/40"
        >
          <DropdownMenuLabel className="font-normal px-2.5 py-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="opacity-50" />
          <DropdownMenuItem
            onSelect={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 cursor-pointer"
          >
            <TbUser className="size-4 text-muted-foreground" aria-hidden />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsPreferencesOpen(true)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 cursor-pointer"
          >
            <TbSettings className="size-4 text-muted-foreground" aria-hidden />
            Preferencias
          </DropdownMenuItem>
          <DropdownMenuSeparator className="opacity-50" />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              void handleSignOut();
            }}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer focus:bg-destructive/10 focus:text-destructive"
          >
            <TbLogout className="size-4" aria-hidden />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogo Perfil */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-border/40 gap-0 p-0 overflow-hidden bg-card/95 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSaveProfile}>
            <DialogHeader className="p-6 pb-4 border-b border-border/45">
              <DialogTitle className="font-heading text-base font-semibold">Editar Perfil</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Actualiza tu información personal y foto de perfil en el sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 p-6">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="relative group/avatar cursor-pointer size-20 rounded-full overflow-hidden ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/45 shadow-sm">
                  <Avatar className="size-full">
                    {profilePreview ? (
                      <AvatarImage src={profilePreview} alt={profileName} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-emerald-500/10 text-primary text-2xl font-bold flex items-center justify-center size-full">
                      {getInitials(profileName)}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload-input" className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <span className="text-[10px] font-semibold tracking-wide uppercase">Cambiar</span>
                  </label>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/80 font-medium">Haz click para subir una foto (Máx 5MB)</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-name" className="text-xs font-semibold text-foreground/90">Nombre completo</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="h-10 rounded-xl border-border/50 bg-background/50 focus-visible:bg-background"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-email" className="text-xs font-semibold text-foreground/90">Correo electrónico</Label>
                <Input
                  id="profile-email"
                  value={user.email}
                  disabled
                  className="h-10 rounded-xl bg-muted/40 cursor-not-allowed opacity-80 border-border/30"
                />
                <span className="text-[10px] text-muted-foreground/75 leading-normal">
                  El correo no se puede modificar por seguridad de la cuenta.
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-image" className="text-xs font-semibold text-foreground/90">O introduce la URL de la foto</Label>
                <Input
                  id="profile-image"
                  value={profileImage}
                  onChange={(e) => {
                    setProfileImage(e.target.value);
                    setProfilePreview(e.target.value);
                    setProfileFile(null);
                  }}
                  placeholder="https://ejemplo.com/avatar.jpg"
                  className="h-10 rounded-xl border-border/50 bg-background/50 focus-visible:bg-background"
                />
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/30 border-t border-border/45 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-xl h-9.5 text-xs font-medium"
                disabled={isSavingProfile}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-9.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo Preferencias */}
      <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border-border/40 gap-0 p-0 overflow-hidden bg-card/95 backdrop-blur-sm shadow-xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/45">
            <DialogTitle className="font-heading text-base font-semibold">Preferencias del sistema</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Personaliza el idioma y tema visual de tu panel de control.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 p-6">
            <div className="grid gap-2">
              <Label htmlFor="pref-theme" className="text-xs font-semibold text-foreground/90">Tema visual</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="pref-theme" className="h-10 rounded-xl border-border/50 bg-background/50 focus:bg-background">
                  <SelectValue placeholder="Seleccionar tema" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="light" className="rounded-lg">Claridad (Light)</SelectItem>
                  <SelectItem value="dark" className="rounded-lg">Oscuridad (Dark)</SelectItem>
                  <SelectItem value="system" className="rounded-lg">Predeterminado del sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pref-lang" className="text-xs font-semibold text-foreground/90">Idioma del panel</Label>
              <Select value={currentLocale} onValueChange={handleLanguageChange} disabled={isPendingLang}>
                <SelectTrigger id="pref-lang" className="h-10 rounded-xl border-border/50 bg-background/50 focus:bg-background">
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {locales.map((code) => (
                    <SelectItem key={code} value={code} className="rounded-lg">
                      {localeLabels[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t border-border/45">
            <Button
              type="button"
              onClick={() => setIsPreferencesOpen(false)}
              className="rounded-xl h-9.5 w-full sm:w-auto text-xs font-semibold"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


