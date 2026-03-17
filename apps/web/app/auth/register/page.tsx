import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a new Content AI account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
