import { VerifyEmailForm } from "@/components/auth/verify-email-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email } = await searchParams;

  return <VerifyEmailForm initialEmail={email ?? ""} />;
}
