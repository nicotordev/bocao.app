import type { ReactNode } from "react";

interface AuthShellProps {
  sideImage: string;
  children: ReactNode;
}

export function AuthShell({ sideImage, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center lg:hidden"
        style={{ backgroundImage: `url('${sideImage}')` }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/40 lg:hidden" />

      <section className="relative z-10 flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:flex-none lg:w-176 lg:bg-background lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm rounded-2xl bg-background p-6 shadow-lg ring-1 ring-border/60 sm:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0">
          {children}
        </div>
      </section>

      <aside className="relative z-10 hidden flex-1 lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${sideImage}')` }}
        />
        <div className="absolute inset-0 bg-black/35" />
      </aside>
    </main>
  );
}
