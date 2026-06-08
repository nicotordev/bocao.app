import { IntlProvider } from "@/providers/intl-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Locale } from "@/i18n/locales";
import type enMessages from "@/i18n/messages/en.json";
import { QueryProvider } from "@/lib/query/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UiSoundProvider } from "@/providers/ui-sound-provider";

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
  messages: typeof enMessages;
}

export default function Providers({
  children,
  locale,
  messages,
}: ProvidersProps) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <IntlProvider locale={locale} messages={messages}>
          {children}
          <UiSoundProvider />
          <Toaster richColors closeButton position="top-center" />
        </IntlProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
