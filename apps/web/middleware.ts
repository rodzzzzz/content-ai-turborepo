import { NextRequest, NextResponse } from "next/server";
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  ONBOARDING_REDIRECT,
  PLAN_REDIRECT,
  publicRoutes,
} from "./lib/routes";

interface SessionUser {
  isTrialActive?: boolean;
  hasCustomerId?: boolean;
  isOnboardingCompleted?: boolean;
}

async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const apiUrl = process.env.API_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${apiUrl}/api/users/session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.user ?? data;
    return user as SessionUser;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isLoggedIn = !!sessionCookie;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isOnboardingRoute = pathname === ONBOARDING_REDIRECT;
  const isPlanRoute = pathname === PLAN_REDIRECT;

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Handle auth routes - redirect logged-in users
  if (isAuthRoute) {
    if (isLoggedIn) {
      const user = await getSessionUser(request);
      if (user) {
        if (!user.isTrialActive && !user.hasCustomerId) {
          return NextResponse.redirect(new URL(PLAN_REDIRECT, request.url));
        }
        if (!user.isOnboardingCompleted) {
          return NextResponse.redirect(new URL(ONBOARDING_REDIRECT, request.url));
        }
      }
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes for logged-in users
  if (isLoggedIn) {
    const user = await getSessionUser(request);

    if (user) {
      // Expired trial / no customer → redirect to plan
      if (!user.isTrialActive && !user.hasCustomerId) {
        if (!isPlanRoute && !isPublicRoute) {
          return NextResponse.redirect(new URL(PLAN_REDIRECT, request.url));
        }
        return NextResponse.next();
      }

      // Active trial but onboarding not completed
      if (!user.isOnboardingCompleted) {
        if (!isOnboardingRoute && !isPublicRoute) {
          return NextResponse.redirect(new URL(ONBOARDING_REDIRECT, request.url));
        }
        return NextResponse.next();
      }

      // Completed both → redirect away from plan/onboard
      if (isOnboardingRoute || isPlanRoute) {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
      }
    }
  }

  // Unauthenticated users
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = pathname + (request.nextUrl.search || "");
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};
