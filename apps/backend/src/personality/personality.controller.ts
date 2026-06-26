import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { PersonalityService } from './personality.service.js';
import { UpsertPersonalityDto } from './dto/upsert-personality.dto.js';

@Controller('personality')
@UseGuards(AuthGuard)
export class PersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

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
    return this.personalityService.get(userId, organizationId.trim());
  }

  @Put()
  async upsert(
    @Session() session: UserSession,
    @Body() dto: UpsertPersonalityDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!dto.organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.personalityService.upsert(userId, dto);
  }
}
