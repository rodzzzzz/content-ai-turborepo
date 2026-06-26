import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { BrandKitService } from './brand-kit.service.js';
import { UpsertBrandKitDto } from './dto/upsert-brand-kit.dto.js';

@Controller('brand-kit')
@UseGuards(AuthGuard)
export class BrandKitController {
  constructor(private readonly brandKitService: BrandKitService) {}

  @Get()
  async get(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.brandKitService.get(userId, organizationId.trim());
  }

  @Put()
  async upsert(
    @Session() session: UserSession,
    @Body() dto: UpsertBrandKitDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!dto.organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.brandKitService.upsert(userId, dto);
  }
}
