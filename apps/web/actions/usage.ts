'use server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getServerApiConfig } from '@/lib/server-api';
import type { Subscription } from '@prisma/client';
import { addMonths } from 'date-fns';
import { AIFeature, calculateAICost } from '@/lib/ai-cost';
import { PLAN_LIMITS } from '@/constants/plan-limits';

type UsageFeature = 'credits' | 'organizations';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getAvailableCredits(
  subscriptionId: string,
): Promise<number> {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(
    `${apiUrl}/api/usage/available-credits?subscriptionId=${encodeURIComponent(subscriptionId)}`,
    { headers: { cookie }, cache: 'no-store' },
  );
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) throw new Error('Subscription not found');
    return sub.creditBalance + sub.purchasedCredits;
  }
  return (data as { total: number }).total;
}

export async function deductCredits(
  amount: number,
  feature: string,
  metadata?: Record<string, string | number | object | undefined | null>,
) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(`${apiUrl}/api/usage/deduct-credits`, {
    method: 'POST',
    headers: {
      cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, feature, metadata }),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    throw new Error(data?.error ?? 'Deduct credits failed');
  }
}

export async function trackAICost(
  usage: {
    input?: number;
    output?: number;
    tokens?: number;
    webSearches?: number;
    results?: number;
  },
  feature: AIFeature,
  metadata?: Record<string, string | number | object | undefined | null>,
) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(`${apiUrl}/api/usage/track-ai-cost`, {
    method: 'POST',
    headers: {
      cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usage, feature, metadata }),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    let totalUSD = 0;
    if (usage.input) {
      totalUSD += await calculateAICost({
        feature,
        usageType: 'input',
        quantity: usage.input,
      });
    }
    if (usage.output) {
      totalUSD += await calculateAICost({
        feature,
        usageType: 'output',
        quantity: usage.output,
      });
    }
    if (usage.tokens) {
      totalUSD += await calculateAICost({
        feature,
        usageType: 'embedding',
        quantity: usage.tokens,
      });
    }
    if (usage.webSearches && usage.webSearches > 0) {
      totalUSD += await calculateAICost({
        feature,
        usageType: 'web-search',
        quantity: usage.webSearches,
      });
    }
    if (usage.results && usage.results > 0) {
      totalUSD += await calculateAICost({
        feature,
        usageType: 'result',
        quantity: usage.results,
      });
    }
    const cost = Math.round(totalUSD * 100);
    const user = await currentUser();
    if (!user?.id) throw new Error('Unauthorized');
    await deductCreditsLegacy(user.id, cost, feature, metadata);
    return totalUSD;
  }
  return (data as { totalUSD: number }).totalUSD;
}

/** Fallback when API unavailable (uses Prisma). */
async function deductCreditsLegacy(
  userId: string,
  amount: number,
  feature: string,
  metadata?: Record<string, unknown>,
) {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });
  if (!subscription) throw new Error('Subscription not found');
  let remainingToDeduct = amount;
  let newMonthlyBalance = subscription.creditBalance;
  let newPurchasedBalance = subscription.purchasedCredits;
  if (remainingToDeduct > 0 && newMonthlyBalance > 0) {
    const d = Math.min(remainingToDeduct, newMonthlyBalance);
    newMonthlyBalance -= d;
    remainingToDeduct -= d;
  }
  if (remainingToDeduct > 0 && newPurchasedBalance > 0) {
    const d = Math.min(remainingToDeduct, newPurchasedBalance);
    newPurchasedBalance -= d;
    remainingToDeduct -= d;
  }
  if (remainingToDeduct > 0) newMonthlyBalance -= remainingToDeduct;
  await db.subscription.update({
    where: { userId },
    data: {
      creditBalance: newMonthlyBalance,
      purchasedCredits: newPurchasedBalance,
      usageCount: subscription.usageCount + amount,
      usageRecords: {
        create: {
          feature,
          quantity: amount,
          costInDollars: amount,
          metadata: metadata as object | undefined,
        },
      },
    },
  });
}

export async function checkUsageLimit(
  subscriptionId: string,
  feature: UsageFeature,
): Promise<{ allowed: boolean; remaining: number }> {
  const { apiUrl, cookie } = await getServerApiConfig();
  const params = new URLSearchParams({
    subscriptionId,
    feature,
  });
  const res = await fetch(`${apiUrl}/api/usage/check-limit?${params}`, {
    headers: { cookie },
    cache: 'no-store',
  });
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription || !subscription.planName) {
      throw new Error('Invalid subscription');
    }
    const limits = PLAN_LIMITS[subscription.planName];
    if (!limits) throw new Error('Invalid plan');
    if (feature === 'credits') {
      const totalAvailable =
        subscription.creditBalance + subscription.purchasedCredits;
      return { allowed: 0 < totalAvailable, remaining: totalAvailable };
    }
    const organizationsCount = await db.organization.count({
      where: { ownerId: user.id },
    });
    return {
      allowed: organizationsCount < limits.organizations,
      remaining: limits.organizations - organizationsCount,
    };
  }
  return data as { allowed: boolean; remaining: number };
}

export async function resetUsage(
  subscription: Subscription,
  periodEnd?: Date,
): Promise<void> {
  if (!subscription.planName) {
    throw new Error('Invalid subscription');
  }
  const limits = PLAN_LIMITS[subscription.planName];
  if (!limits) {
    throw new Error('Invalid plan');
  }
  const currentBalance = subscription.creditBalance;
  const newCreditBalance =
    currentBalance < 0
      ? Math.max(0, limits.credits + currentBalance)
      : limits.credits;

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      creditBalance: newCreditBalance,
      usageCount: 0,
      nextUsageReset: periodEnd ?? addMonths(new Date(), 1),
    },
  });
}

export async function resetUsageLimit(
  subscription: Subscription,
  oldPlanName: string | null,
  newPlanName?: string | null,
): Promise<void> {
  const effectiveNewPlanName = newPlanName || subscription.planName;

  if (!effectiveNewPlanName) {
    throw new Error(
      'Invalid subscription: missing subscription or planName',
    );
  }

  const limits = PLAN_LIMITS[effectiveNewPlanName];
  if (!limits) {
    throw new Error(
      `Invalid plan: ${effectiveNewPlanName} not found in PLAN_LIMITS`,
    );
  }

  const currentBalance = subscription.creditBalance;
  let newCreditBalance: number;

  const isPlanChange = oldPlanName && oldPlanName !== effectiveNewPlanName;

  if (isPlanChange) {
    const oldLimits = PLAN_LIMITS[oldPlanName];
    if (!oldLimits) {
      throw new Error(
        `Invalid old plan: ${oldPlanName} not found in PLAN_LIMITS`,
      );
    }

    newCreditBalance = Math.max(
      0,
      limits.credits - oldLimits.credits + currentBalance,
    );
  } else {
    newCreditBalance =
      currentBalance < 0
        ? Math.max(0, limits.credits + currentBalance)
        : limits.credits;
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      creditBalance: newCreditBalance,
    },
  });
}

export async function getUsageMetrics(subscriptionId: string) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(
    `${apiUrl}/api/usage/metrics?subscriptionId=${encodeURIComponent(subscriptionId)}`,
    { headers: { cookie }, cache: 'no-store' },
  );
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription || !subscription.planName) {
      throw new Error('Invalid subscription');
    }
    const limits = PLAN_LIMITS[subscription.planName];
    if (!limits) throw new Error('Invalid plan');
    const organizationsCount = await db.organization.count({
      where: { ownerId: user.id },
    });
    const totalAvailable =
      subscription.creditBalance + subscription.purchasedCredits;
    return {
      credits: {
        used: subscription.usageCount / 100,
        total: totalAvailable / 100,
        monthly: subscription.creditBalance / 100,
        purchased: subscription.purchasedCredits / 100,
      },
      organizations: {
        used: organizationsCount,
        total: limits.organizations,
      },
    };
  }
  return data;
}

export async function getRecentUsage(
  subscriptionId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const params = new URLSearchParams({
    subscriptionId,
    page: String(page),
    pageSize: String(pageSize),
  });
  const res = await fetch(`${apiUrl}/api/usage/recent?${params}`, {
    headers: { cookie },
    cache: 'no-store',
  });
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new Error('Subscription not found');
    const skip = (page - 1) * pageSize;
    const [usageRecords, totalCount] = await Promise.all([
      db.subscriptionUsage.findMany({
        where: { subscriptionId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
      db.subscriptionUsage.count({ where: { subscriptionId } }),
    ]);
    return {
      records: usageRecords.map((record) => ({
        id: record.id,
        feature: record.feature,
        cost: record.costInDollars / 100,
        timestamp: record.timestamp,
        metadata: record.metadata,
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page < Math.ceil(totalCount / pageSize),
        hasPreviousPage: page > 1,
      },
    };
  }
  return data;
}
