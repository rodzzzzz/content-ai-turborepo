import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AnalyticsService,
  type AnalyticsPlatform,
} from './analytics.service.js';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async query(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
    @Query('integrationId') integrationId: string,
    @Query('platform') platform: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim() || !integrationId?.trim()) {
      return { error: 'organizationId and integrationId are required' };
    }
    const p = platform?.toLowerCase();
    if (p !== 'facebook' && p !== 'twitter' && p !== 'linkedin') {
      return {
        error: 'platform must be facebook, twitter, or linkedin',
      };
    }
    return this.analyticsService.query(
      userId,
      organizationId.trim(),
      integrationId.trim(),
      p as AnalyticsPlatform,
      from,
      to,
    );
  }
}
