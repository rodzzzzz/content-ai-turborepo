import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CampaignService } from './campaign.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { UpdateCampaignDto } from './dto/update-campaign.dto.js';

@Controller('campaign')
@UseGuards(AuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

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
    return this.campaignService.list(userId, organizationId.trim());
  }

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateCampaignDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.campaignService.create(userId, dto);
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
    return this.campaignService.findOne(userId, organizationId.trim(), id);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.campaignService.update(
      userId,
      organizationId.trim(),
      id,
      dto,
    );
  }

  @Delete(':id')
  async delete(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.campaignService.delete(userId, organizationId.trim(), id);
  }
}
