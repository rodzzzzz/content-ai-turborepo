import { headers } from "next/headers";
import type { ExtendedUser } from "./auth-client";

async function fetchSession() {
  const apiUrl = process.env.API_URL ?? "http://localhost:3000";
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";

  const res = await fetch(`${apiUrl}/api/users/session`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  // Backend returns { user, session } from @Session() decorator
  const user = data?.user ?? data;
  return user as ExtendedUser | null;
}

/**
 * Get the current authenticated user (server-side).
 * Returns null if not authenticated.
 */
export async function currentUser(): Promise<ExtendedUser | null> {
  const user = await fetchSession();
  return user;
}

/**
 * Get the current user's role (server-side).
 */
export async function currentRole(): Promise<"ADMIN" | "USER" | null> {
  const user = await currentUser();
  return user?.role ?? null;
}

/**
 * Get the current user's organization ID (server-side).
 */
export async function currentOrganization(): Promise<string | null> {
  const user = await currentUser();
  return user?.organizationId ?? null;
}
