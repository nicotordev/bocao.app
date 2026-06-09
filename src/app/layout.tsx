import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans, Outfit } from "next/font/google";
import {
  getLocale,
  getMessages,
  getTimeZone,
  getTranslations,
} from "next-intl/server";
import "./globals.css";
import Providers from "./providers";

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = await getLocale();

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      locale: locale === "es" ? "es_ES" : "en_US",
      alternateLocale: locale === "es" ? ["en_US"] : ["es_ES"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html
      lang={locale}
      className={cn(
        "dark h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        nunitoSans.variable,
        outfitHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
