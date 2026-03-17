import type { Metadata } from "next";
import { ErrorCard } from "@/components/auth/error-card";

export const metadata: Metadata = {
  title: "Auth Error",
  description: "An error occurred during authentication",
};

export default function AuthErrorPage() {
  return <ErrorCard errorMessage="Unable to sign in. Please try again." />;
}
