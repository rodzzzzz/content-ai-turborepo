import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth/new-password-form";

export const metadata: Metadata = {
  title: "New Password",
  description: "Set your new password",
};

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="flex w-full items-center justify-center p-8">Loading...</div>}>
      <NewPasswordForm />
    </Suspense>
  );
}
