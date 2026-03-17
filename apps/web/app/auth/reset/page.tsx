import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

export default function ResetPage() {
  return <ResetForm />;
}
