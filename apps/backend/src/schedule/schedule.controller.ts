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
import { ScheduleService } from './schedule.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';

@Controller('schedule')
@UseGuards(AuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

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
    return this.scheduleService.list(userId, organizationId.trim());
  }

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateScheduleDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.scheduleService.create(userId, dto);
  }

  @Post('post-now')
  async postNow(
    @Session() session: UserSession,
    @Body()
    body: { organizationId: string; scheduleId: string },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!body?.organizationId?.trim() || !body?.scheduleId?.trim()) {
      return { error: 'organizationId and scheduleId are required' };
    }
    return this.scheduleService.postNow(
      userId,
      body.organizationId.trim(),
      body.scheduleId.trim(),
    );
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
    return this.scheduleService.findOne(userId, organizationId.trim(), id);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.scheduleService.update(
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
    return this.scheduleService.delete(userId, organizationId.trim(), id);
  }
}
