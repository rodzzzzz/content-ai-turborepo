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
import { KnowledgeService } from './knowledge.service.js';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto.js';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto.js';

@Controller('knowledge-base')
@UseGuards(AuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

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
    return this.knowledgeService.list(userId, organizationId.trim());
  }

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateKnowledgeDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.knowledgeService.create(userId, dto);
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
    return this.knowledgeService.findOne(userId, organizationId.trim(), id);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateKnowledgeDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.knowledgeService.update(
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
    return this.knowledgeService.delete(userId, organizationId.trim(), id);
  }
}
