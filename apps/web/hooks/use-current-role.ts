"use client";

import { useAuth } from "@/contexts/auth-provider";

export function useCurrentRole() {
  const { session } = useAuth();
  return session?.user?.role ?? null;
}
