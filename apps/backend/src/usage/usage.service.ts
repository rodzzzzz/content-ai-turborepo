import { Injectable } from '@nestjs/common';
import type { Subscription } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PLAN_LIMITS } from '../constants/plan-limits.js';
import { addMonths } from 'date-fns';

export type AIFeature =
  | 'campaign-agent'
  | 'campaign-tool'
  | 'content-generation'
  | 'image-generation'
  | 'research-agent'
  | 'embedding'
  | 'youtube-scraper'
  | 'twitter-scraper';

export type AIUsageType =
  | 'input'
  | 'output'
  | 'web-search'
  | 'embedding'
  | 'result';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAICost(params: {
    feature: AIFeature;
    usageType: AIUsageType;
    quantity: number;
  }): Promise<number> {
    const pricing = await this.prisma.aIPricing.findFirst({
      where: {
        feature: params.feature,
        usageType: params.usageType,
      },
      orderBy: [{ model: 'desc' }],
    });
    if (!pricing) {
      throw new Error(
        `No pricing found for feature=${params.feature}, usageType=${params.usageType}`,
      );
    }
    if (!pricing.unitAmount || !pricing.unitPrice) {
      throw new Error('Pricing entry missing unitAmount or unitPrice');
    }
    if (params.quantity <= 0) return 0;
    const numUnits = params.quantity / pricing.unitAmount;
    const totalCents = Math.ceil(numUnits * pricing.unitPrice);
    return Math.round(totalCents) / 100;
  }

  async getAvailableCredits(subscriptionId: string): Promise<number> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return subscription.creditBalance + subscription.purchasedCredits;
  }

  async getAvailableCreditsForUser(
    userId: string,
    subscriptionId: string,
  ): Promise<number> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return subscription.creditBalance + subscription.purchasedCredits;
  }

  async deductCredits(
    userId: string,
    amount: number,
    feature: string,
    metadata?: Record<string, unknown>,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const monthlyBalance = subscription.creditBalance;
    const purchasedBalance = subscription.purchasedCredits;
    let remainingToDeduct = amount;
    let newMonthlyBalance = monthlyBalance;
    let newPurchasedBalance = purchasedBalance;

    if (remainingToDeduct > 0 && newMonthlyBalance > 0) {
      const deductFromMonthly = Math.min(
        remainingToDeduct,
        newMonthlyBalance,
      );
      newMonthlyBalance -= deductFromMonthly;
      remainingToDeduct -= deductFromMonthly;
    }

    if (remainingToDeduct > 0 && newPurchasedBalance > 0) {
      const deductFromPurchased = Math.min(
        remainingToDeduct,
        newPurchasedBalance,
      );
      newPurchasedBalance -= deductFromPurchased;
      remainingToDeduct -= deductFromPurchased;
    }

    if (remainingToDeduct > 0) {
      newMonthlyBalance -= remainingToDeduct;
    }

    await this.prisma.subscription.update({
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

  async trackAICost(
    userId: string,
    usage: {
      input?: number;
      output?: number;
      tokens?: number;
      webSearches?: number;
      results?: number;
    },
    feature: AIFeature,
    metadata?: Record<string, unknown>,
  ) {
    let totalUSD = 0;
    if (usage.input) {
      totalUSD += await this.calculateAICost({
        feature,
        usageType: 'input',
        quantity: usage.input,
      });
    }
    if (usage.output) {
      totalUSD += await this.calculateAICost({
        feature,
        usageType: 'output',
        quantity: usage.output,
      });
    }
    if (usage.tokens) {
      totalUSD += await this.calculateAICost({
        feature,
        usageType: 'embedding',
        quantity: usage.tokens,
      });
    }
    if (usage.webSearches && usage.webSearches > 0) {
      totalUSD += await this.calculateAICost({
        feature,
        usageType: 'web-search',
        quantity: usage.webSearches,
      });
    }
    if (usage.results && usage.results > 0) {
      totalUSD += await this.calculateAICost({
        feature,
        usageType: 'result',
        quantity: usage.results,
      });
    }

    const cost = Math.round(totalUSD * 100);
    await this.deductCredits(userId, cost, feature, {
      ...metadata,
      usage,
      actualCost: totalUSD,
    });
    return totalUSD;
  }

  async checkUsageLimit(
    userId: string,
    subscriptionId: string,
    feature: 'credits' | 'organizations',
  ): Promise<{ allowed: boolean; remaining: number }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || !subscription.planName) {
      throw new Error('Invalid subscription');
    }

    const limits = PLAN_LIMITS[subscription.planName];
    if (!limits) {
      throw new Error('Invalid plan');
    }

    let used: number;
    let limit: number;

    switch (feature) {
      case 'credits': {
        const totalAvailable = await this.getAvailableCredits(subscriptionId);
        used = 0;
        limit = totalAvailable;
        break;
      }
      case 'organizations': {
        const organizationsCount = await this.prisma.organization.count({
          where: { ownerId: userId },
        });
        used = organizationsCount;
        limit = limits.organizations;
        break;
      }
      default:
        throw new Error('Invalid feature');
    }

    return {
      allowed: used < limit,
      remaining: limit - used,
    };
  }

  async resetUsage(subscription: Subscription, periodEnd?: Date): Promise<void> {
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

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        creditBalance: newCreditBalance,
        usageCount: 0,
        nextUsageReset: periodEnd ?? addMonths(new Date(), 1),
      },
    });
  }

  async resetUsageLimit(
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

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        creditBalance: newCreditBalance,
      },
    });
  }

  async getUsageMetrics(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || !subscription.planName) {
      throw new Error('Invalid subscription');
    }

    const limits = PLAN_LIMITS[subscription.planName];
    if (!limits) {
      throw new Error('Invalid plan');
    }

    const organizationsCount = await this.prisma.organization.count({
      where: { ownerId: userId },
    });

    const totalAvailable = await this.getAvailableCredits(subscriptionId);

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

  async getRecentUsage(
    subscriptionId: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const skip = (page - 1) * pageSize;

    const [usageRecords, totalCount] = await Promise.all([
      this.prisma.subscriptionUsage.findMany({
        where: { subscriptionId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.subscriptionUsage.count({
        where: { subscriptionId },
      }),
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
}
