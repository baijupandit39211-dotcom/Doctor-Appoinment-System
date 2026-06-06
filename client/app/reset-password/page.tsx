import type { Metadata } from "next";

import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | DocPulse",
};

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <ResetPasswordForm token={searchParams?.token ?? ""} />;
}
