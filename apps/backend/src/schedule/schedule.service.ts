import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import type { CreateScheduleDto } from './dto/create-schedule.dto.js';
import type { UpdateScheduleDto } from './dto/update-schedule.dto.js';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const schedules = await this.prisma.schedule.findMany({
      where: { organizationId, userId },
      orderBy: { date: 'asc' },
      include: { integration: { select: { id: true, provider: true } } },
    });
    return { schedules };
  }

  async create(userId: string, dto: CreateScheduleDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const integration = await this.prisma.integration.findFirst({
      where: {
        id: dto.integrationId,
        organizationId: dto.organizationId,
        userId,
      },
    });
    if (!integration) {
      return { error: 'Integration not found for this organization' };
    }

    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      return { error: 'Invalid date' };
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        userId,
        organizationId: dto.organizationId,
        integrationId: dto.integrationId,
        platform: dto.platform,
        content: dto.content,
        date,
        status: dto.status ?? undefined,
        mediaUrl: dto.mediaUrl ?? [],
      },
    });
    return { schedule };
  }

  async findOne(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const schedule = await this.prisma.schedule.findFirst({
      where: { id, organizationId, userId },
      include: { integration: true },
    });
    if (!schedule) return { error: 'Schedule not found' };
    return { schedule };
  }

  async update(
    userId: string,
    organizationId: string,
    id: string,
    dto: UpdateScheduleDto,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const existing = await this.prisma.schedule.findFirst({
      where: { id, organizationId, userId },
    });
    if (!existing) return { error: 'Schedule not found' };

    if (dto.integrationId) {
      const integration = await this.prisma.integration.findFirst({
        where: {
          id: dto.integrationId,
          organizationId,
          userId,
        },
      });
      if (!integration) {
        return { error: 'Integration not found for this organization' };
      }
    }

    let date: Date | undefined;
    if (dto.date !== undefined) {
      date = new Date(dto.date);
      if (Number.isNaN(date.getTime())) {
        return { error: 'Invalid date' };
      }
    }

    const schedule = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.platform !== undefined && { platform: dto.platform }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(date !== undefined && { date }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.mediaUrl !== undefined && { mediaUrl: dto.mediaUrl }),
        ...(dto.integrationId !== undefined && {
          integrationId: dto.integrationId,
        }),
      },
    });
    return { schedule };
  }

  async delete(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const deleted = await this.prisma.schedule.deleteMany({
      where: { id, organizationId, userId },
    });
    if (deleted.count === 0) {
      return { error: 'Schedule not found or access denied' };
    }
    return { success: true };
  }

  async postNow(_userId: string, _organizationId: string, _scheduleId: string) {
    return {
      error: 'Not implemented',
      message:
        'Immediate posting will be wired in Phase 4–6 (platform APIs + workflows).',
    };
  }
}
