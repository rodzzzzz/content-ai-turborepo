import type { Metadata } from "next";
import { Suspense } from "react";
import { NewVerificationForm } from "@/components/auth/new-verification-form";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

export default function NewVerificationPage() {
  return (
    <Suspense fallback={<div className="flex w-full items-center justify-center p-8 text-center animate-pulse">Loading...</div>}>
      <NewVerificationForm />
    </Suspense>
  );
}
