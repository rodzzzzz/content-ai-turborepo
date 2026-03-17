"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_LOGOUT_REDIRECT } from "@/lib/routes";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push(DEFAULT_LOGOUT_REDIRECT);
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      Sign Out
    </button>
  );
}
