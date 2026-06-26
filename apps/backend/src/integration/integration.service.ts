import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import { deauthorizePlatform } from './deauthorize-platform.js';

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  /** List integrations with UI fields + token expiry metadata. */
  async listAccountsWithExpiration(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const integratedAccounts = await this.prisma.integration.findMany({
      where: { organizationId, userId },
      select: {
        id: true,
        provider: true,
        account_name: true,
        account_type: true,
        page_name: true,
        providerAccountId: true,
        profile_picture: true,
        username: true,
        expires_at: true,
      },
      orderBy: { provider: 'asc' },
    });

    const now = Math.floor(Date.now() / 1000);
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;

    const integratedAccountsWithExpiration = integratedAccounts.map(
      (account) => {
        const expiresAt = account.expires_at;
        const isExpired = expiresAt ? expiresAt < now : false;
        const daysUntilExpiration = expiresAt
          ? Math.ceil((expiresAt - now) / (24 * 60 * 60))
          : null;
        const isExpiringSoon =
          Boolean(expiresAt && !isExpired) &&
          expiresAt! - now <= sevenDaysInSeconds;

        return {
          ...account,
          expiresAt,
          isExpired,
          isExpiringSoon,
          daysUntilExpiration,
        };
      },
    );

    return { integratedAccounts: integratedAccountsWithExpiration };
  }

  async list(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const integrations = await this.prisma.integration.findMany({
      where: { organizationId, userId },
      orderBy: { provider: 'asc' },
    });
    return { integrations };
  }

  async findOne(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const integration = await this.prisma.integration.findFirst({
      where: { id, organizationId, userId },
    });
    if (!integration) return { error: 'Integration not found' };
    return { integration };
  }

  async disconnectByProvider(
    userId: string,
    organizationId: string,
    provider: string,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const integrationToDisconnect = await this.prisma.integration.findFirst({
      where: { userId, organizationId, provider },
    });

    if (!integrationToDisconnect) {
      return { error: 'Account not found' };
    }

    let deauthorizationResult: Awaited<
      ReturnType<typeof deauthorizePlatform>
    > | null = null;

    if (integrationToDisconnect.access_token) {
      deauthorizationResult = await deauthorizePlatform(
        provider,
        integrationToDisconnect.access_token,
      );
    }

    await this.prisma.integration.delete({
      where: { id: integrationToDisconnect.id },
    });

    if (deauthorizationResult?.success) {
      return {
        success: 'Account disconnected and deauthorized successfully',
        deauthorizationResult,
      };
    }
    if (deauthorizationResult && !deauthorizationResult.success) {
      return {
        success:
          'Account disconnected from our system, but platform deauthorization failed',
        warning: deauthorizationResult.message,
        deauthorizationResult,
      };
    }
    return {
      success:
        'Account disconnected successfully (no access token found for platform deauthorization)',
    };
  }
}
