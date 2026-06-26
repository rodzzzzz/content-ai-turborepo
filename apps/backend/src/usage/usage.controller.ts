import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsageService, type AIFeature } from './usage.service.js';

@Controller('usage')
@UseGuards(AuthGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('deduct-credits')
  async deductCredits(
    @Session() session: UserSession,
    @Body()
    body: {
      amount: number;
      feature: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      await this.usageService.deductCredits(
        userId,
        body.amount,
        body.feature,
        body.metadata,
      );
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Deduct failed';
      return { error: msg };
    }
  }

  @Post('track-ai-cost')
  async trackAICost(
    @Session() session: UserSession,
    @Body()
    body: {
      usage: {
        input?: number;
        output?: number;
        tokens?: number;
        webSearches?: number;
        results?: number;
      };
      feature: AIFeature;
      metadata?: Record<string, unknown>;
    },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      const totalUSD = await this.usageService.trackAICost(
        userId,
        body.usage,
        body.feature,
        body.metadata,
      );
      return { totalUSD };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Track failed';
      return { error: msg };
    }
  }

  @Get('check-limit')
  async checkLimit(
    @Session() session: UserSession,
    @Query('subscriptionId') subscriptionId: string,
    @Query('feature') feature: 'credits' | 'organizations',
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      return await this.usageService.checkUsageLimit(
        userId,
        subscriptionId,
        feature,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Check failed';
      return { error: msg };
    }
  }

  @Get('available-credits')
  async availableCredits(
    @Session() session: UserSession,
    @Query('subscriptionId') subscriptionId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!subscriptionId?.trim()) {
      return { error: 'subscriptionId is required' };
    }
    try {
      const total = await this.usageService.getAvailableCreditsForUser(
        userId,
        subscriptionId.trim(),
      );
      return { total };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Not found';
      return { error: msg };
    }
  }

  @Get('metrics')
  async metrics(
    @Session() session: UserSession,
    @Query('subscriptionId') subscriptionId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      return await this.usageService.getUsageMetrics(userId, subscriptionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Metrics failed';
      return { error: msg };
    }
  }

  @Get('recent')
  async recent(
    @Session() session: UserSession,
    @Query('subscriptionId') subscriptionId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      return await this.usageService.getRecentUsage(
        subscriptionId,
        page ? parseInt(page, 10) : 1,
        pageSize ? parseInt(pageSize, 10) : 10,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Recent failed';
      return { error: msg };
    }
  }
}
