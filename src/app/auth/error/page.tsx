import { AuthError } from "@/components/auth/auth-error";

type AuthErrorPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams;

  return <AuthError errorCode={error} />;
}
