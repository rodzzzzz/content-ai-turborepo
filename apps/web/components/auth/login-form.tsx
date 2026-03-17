"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { LoginSchema } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_LOGIN_REDIRECT,
  ONBOARDING_REDIRECT,
  PLAN_REDIRECT,
} from "@/lib/routes";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string>("");
  const [resendSuccess, setResendSuccess] = useState<string>("");

  useEffect(() => {
    if (!showTwoFactor || resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [showTwoFactor, resendTimer]);

  useEffect(() => {
    if (showTwoFactor) setResendTimer(30);
  }, [showTwoFactor]);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    setIsPending(true);

    try {
      if (showTwoFactor && values.code) {
        const { data, error } = await authClient.twoFactor.verifyOtp({ code: values.code });
        if (error) {
          setError("The code you entered is incorrect!");
          setIsPending(false);
          return;
        }
        if (data) {
          const redirectTo = callbackUrl || DEFAULT_LOGIN_REDIRECT;
          router.push(redirectTo);
          router.refresh();
          return;
        }
      }

      const { data, error } = await authClient.signIn.email(
        { email: values.email, password: values.password },
        {
          callbackURL: callbackUrl || DEFAULT_LOGIN_REDIRECT,
          async onSuccess(ctx) {
            console.log("ctx", ctx);
            if (ctx.data && "twoFactorRedirect" in ctx.data && ctx.data.twoFactorRedirect) {
              await authClient.twoFactor.sendOtp();
            }
          },
        }
      );

      if (error) {
        setError(error.message ?? "Your email or password is incorrect!");
        setIsPending(false);
        return;
      }

      if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        setShowTwoFactor(true);
        setIsPending(false);
        return;
      }

      if (data?.user) {
        const u = data.user as { isTrialActive?: boolean; hasCustomerId?: boolean; isOnboardingCompleted?: boolean };
        let redirectTo = callbackUrl || DEFAULT_LOGIN_REDIRECT;
        if (!u.isTrialActive && !u.hasCustomerId) redirectTo = PLAN_REDIRECT;
        else if (!u.isOnboardingCompleted) redirectTo = ONBOARDING_REDIRECT;
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setError("Something went wrong!");
    } finally {
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendError("");
    setResendSuccess("");
    try {
      const { error } = await authClient.twoFactor.sendOtp();
      if (error) {
        setResendError(error.message ?? "Failed to resend code.");
      } else {
        setResendSuccess("A new code has been sent to your email.");
        setResendTimer(30);
      }
    } catch {
      setResendError("Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <CardWrapper
      headerLabel="Login to your account"
      description="Enter your email and password to login"
      backButtonLabel="Don't have an account? Register"
      backButtonHref="/auth/register"
      showSocial={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Enter Two Factor Code</FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        {...field}
                        disabled={isPending}
                        pattern={REGEXP_ONLY_DIGITS}
                        className="w-full"
                        autoFocus
                      >
                        <InputOTPGroup className="flex w-full gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="h-14 w-14 flex-1 rounded-lg border text-2xl font-semibold"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
                        onClick={handleResend}
                        disabled={resendTimer > 0 || isResending}
                      >
                        {isResending ? "Resending..." : "Resend Code"}
                      </button>
                      {resendTimer > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Resend available in {resendTimer}s
                        </span>
                      )}
                    </div>
                    {resendError && <div className="mt-1 text-xs text-destructive">{resendError}</div>}
                    {resendSuccess && <div className="mt-1 text-xs text-green-600">{resendSuccess}</div>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} placeholder="john.doe@example.com" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} disabled={isPending} placeholder="******" />
                      </FormControl>
                      <Button size="sm" variant="link" asChild className="px-0 font-normal">
                        <Link href="/auth/reset">Forgot password?</Link>
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={success} />
          <Button
            disabled={
              isPending ||
              !form.formState.isValid ||
              (showTwoFactor && (!form.watch("code") || form.watch("code")?.length !== 6))
            }
            type="submit"
            className="w-full"
          >
            {showTwoFactor ? "Confirm" : "Login"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
