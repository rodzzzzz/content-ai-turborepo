import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';

export type AnalyticsPlatform = 'facebook' | 'twitter' | 'linkedin';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async query(
    userId: string,
    organizationId: string,
    integrationId: string,
    platform: AnalyticsPlatform,
    from?: string,
    to?: string,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, organizationId, userId },
    });
    if (!integration) return { error: 'Integration not found' };

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    if (from && fromDate && Number.isNaN(fromDate.getTime())) {
      return { error: 'Invalid from date' };
    }
    if (to && toDate && Number.isNaN(toDate.getTime())) {
      return { error: 'Invalid to date' };
    }

    const range =
      fromDate || toDate
        ? {
            ...(fromDate && !Number.isNaN(fromDate.getTime())
              ? { gte: fromDate }
              : {}),
            ...(toDate && !Number.isNaN(toDate.getTime())
              ? { lte: toDate }
              : {}),
          }
        : undefined;

    if (platform === 'facebook') {
      const rows = await this.prisma.facebookAnalytics.findMany({
        where: {
          integrationId,
          organizationId,
          userId,
          ...(range ? { date: range } : {}),
        },
        orderBy: { date: 'asc' },
      });
      return { analytics: rows };
    }

    if (platform === 'twitter') {
      const rows = await this.prisma.twitterAnalytics.findMany({
        where: {
          integrationId,
          organizationId,
          userId,
          ...(range ? { date: range } : {}),
        },
        orderBy: { date: 'asc' },
      });
      return { analytics: rows };
    }

    const rows = await this.prisma.linkedinAnalytics.findMany({
      where: {
        integrationId,
        organizationId,
        userId,
        ...(range ? { date: range } : {}),
      },
      orderBy: { date: 'asc' },
    });
    return { analytics: rows };
  }
}
