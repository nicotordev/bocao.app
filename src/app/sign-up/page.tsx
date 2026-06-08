"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await authClient.signUp.email({
      name,
      email,
      password,
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          className="rounded-md border px-3 py-2"
          required
        />

        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          type="email"
          className="rounded-md border px-3 py-2"
          required
        />

        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          type="password"
          className="rounded-md border px-3 py-2"
          required
        />

        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          Registrarme
        </button>
      </form>
    </main>
  );
}
