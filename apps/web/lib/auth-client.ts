import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

/** Extended user type matching backend customSession */
export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "ADMIN" | "USER";
  organizationId: string | null;
  isTwoFactorEnabled: boolean;
  isOnboardingCompleted: boolean;
  timeZone: string;
  isTrialActive: boolean;
  hasCustomerId: boolean;
  isOAuth: boolean;
  setupSteps: string[];
}

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        // Stay on login page - 2FA code input is shown inline
        // Could redirect to /auth/2fa if using separate page
      },
    }),
  ],
});
