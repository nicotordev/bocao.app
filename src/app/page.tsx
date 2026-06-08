import { HomeClientMessage } from "@/components/home-client-message";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Bocao
          </p>
          <LocaleSwitcher />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {t("description")}
          </p>
          <HomeClientMessage />
        </div>
      </main>
    </div>
  );
}
