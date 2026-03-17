"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewPasswordSchema } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_LOGOUT_REDIRECT } from "@/lib/routes";

export function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error") === "INVALID_TOKEN";

  const [error, setError] = useState<string>(tokenError ? "Invalid or expired token." : "");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "" },
  });

  const onSubmit = async (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");
    setIsPending(true);

    if (!token) {
      setError("Missing token!");
      setIsPending(false);
      return;
    }

    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });

      if (err) {
        setError(err.message ?? "Failed to reset password.");
      } else {
        setSuccess("Password updated! Redirecting to login...");
        router.push(DEFAULT_LOGOUT_REDIRECT);
        router.refresh();
      }
    } catch {
      setError("Something went wrong!");
    } finally {
      setIsPending(false);
    }
  };

  if (!token && !tokenError) {
    return (
      <CardWrapper
        headerLabel="Reset your password"
        description="Use the link from your email to reset your password"
        backButtonLabel="Back to login"
        backButtonHref="/auth/login"
        showSocial={false}
      >
        <FormError message="Missing token. Please use the link from your email." />
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      headerLabel="Reset your password"
      description="Enter a new password to reset your account"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
      showSocial={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isPending}
                      placeholder="******"
                    />
                  </FormControl>
                  <PasswordStrengthIndicator password={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button
            disabled={isPending || !form.formState.isValid}
            type="submit"
            className="w-full"
          >
            Reset password
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
