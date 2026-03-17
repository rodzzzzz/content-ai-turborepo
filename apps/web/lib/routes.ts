/**
 * Public routes - no authentication required
 * Note: "/" not included - unauthenticated users are redirected to login
 */
export const publicRoutes = [
  "/auth/new-verification",
  "/api/workflow/analytics/daily-analytics",
  "/api/workflow/analytics/fetch-and-append-analytics",
  "/api/workflow/schedule/post-scheduled-posts",
  "/api/workflow/schedule/post-to-platform",
  "/api/uploadthing",
  "/api/stripe/webhook",
  "/api/stripe/checkout",
];

/**
 * Auth routes - redirect logged-in users
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/campaign";
export const DEFAULT_LOGOUT_REDIRECT = "/auth/login";
export const ONBOARDING_REDIRECT = "/onboard";
export const PLAN_REDIRECT = "/plan";
