"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/lib/schemas";
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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { authClient } from "@/lib/auth-client";

export function RegisterForm() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", name: "" },
  });

  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");
    setIsPending(true);

    try {
      const { data, error: err } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (err) {
        setError(err.message ?? "Sign up failed");
        setIsPending(false);
        return;
      }

      if (data) {
        setSuccess("Confirmation email sent!");
      }
    } catch {
      setError("Something went wrong!");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <CardWrapper
      headerLabel="Create an account"
      description="Start your journey with Content AI today"
      backButtonLabel="Already have an account? Login"
      backButtonHref="/auth/login"
      showSocial={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <PasswordStrengthIndicator password={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending || !form.formState.isValid} type="submit" className="w-full">
            Create an account
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
