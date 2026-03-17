"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { LoaderCircle } from "lucide-react";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/routes";

export function NewVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const onSubmit = useCallback(async () => {
    if (success || error) return;

    if (!token) {
      setError("Missing token!");
      return;
    }

    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? "Verification failed.");
        return;
      }
      setSuccess("Email verified! Redirecting...");
      router.push(DEFAULT_LOGIN_REDIRECT);
      router.refresh();
    } catch {
      setError("Something went wrong!");
    }
  }, [token, success, error, router]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper
      headerLabel="Confirming your verification"
      description="We're confirming your email address"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
      showSocial={false}
    >
      <div className="flex w-full items-center justify-center">
        {!success && !error && <LoaderCircle className="h-8 w-8 animate-spin" />}
        <FormSuccess message={success} />
        {!success && <FormError message={error} />}
      </div>
    </CardWrapper>
  );
}
