import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>Bienvenido, {session.user.name}</p>
    </main>
  );
}
