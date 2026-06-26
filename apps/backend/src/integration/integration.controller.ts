import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IntegrationService } from './integration.service.js';

@Controller('integration')
@UseGuards(AuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  /** Dashboard list with expiration flags (matches legacy server action). */
  @Get('accounts')
  async listAccounts(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.integrationService.listAccountsWithExpiration(
      userId,
      organizationId.trim(),
    );
  }

  @Delete('by-provider')
  async disconnectByProvider(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
    @Query('provider') provider: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim() || !provider?.trim()) {
      return { error: 'organizationId and provider are required' };
    }
    return this.integrationService.disconnectByProvider(
      userId,
      organizationId.trim(),
      provider.trim(),
    );
  }

  @Get()
  async list(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.integrationService.list(userId, organizationId.trim());
  }

  @Get(':id')
  async getOne(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.integrationService.findOne(
      userId,
      organizationId.trim(),
      id,
    );
  }
}
