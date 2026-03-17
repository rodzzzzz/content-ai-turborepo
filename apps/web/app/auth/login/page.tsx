import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login to Content AI",
  description: "Login to your Content AI account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex w-full items-center justify-center p-8 text-center animate-pulse">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
