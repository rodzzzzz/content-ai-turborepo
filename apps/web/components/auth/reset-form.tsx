"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetSchema } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
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
import { authClient } from "@/lib/auth-client";

export function ResetForm() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");
    setIsPending(true);

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${baseUrl}/auth/new-password`,
      });

      if (err) {
        setError(err.message ?? "Something went wrong!");
      } else {
        setSuccess("If the email exists in our database, a reset link will be sent.");
      }
    } catch {
      setError("Something went wrong!");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <CardWrapper
      headerLabel="Forgot your password?"
      description="Enter your email to reset your password"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
      showSocial={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="john.doe@example.com"
                      type="email"
                    />
                  </FormControl>
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
            Send reset email
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
