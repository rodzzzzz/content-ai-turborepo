"use client";

import { useAuth } from "@/contexts/auth-provider";

export function useCurrentOrganization() {
  const { session } = useAuth();
  return session?.user?.organizationId ?? null;
}
