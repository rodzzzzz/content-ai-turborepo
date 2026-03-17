"use client";

import { useAuth } from "@/contexts/auth-provider";

export function useCurrentUser() {
  const { session } = useAuth();
  return session?.user ?? null;
}
