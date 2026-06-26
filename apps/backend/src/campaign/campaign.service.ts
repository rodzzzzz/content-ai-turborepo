import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import type { CreateCampaignDto } from './dto/create-campaign.dto.js';
import type { UpdateCampaignDto } from './dto/update-campaign.dto.js';

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const campaigns = await this.prisma.campaign.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        platforms: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { campaigns };
  }

  async create(userId: string, dto: CreateCampaignDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };
    if (!dto.name?.trim()) return { error: 'Campaign name is required' };

    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        userId,
        organizationId: dto.organizationId,
        platforms: dto.platforms ?? [],
        initialMessage: dto.initialMessage as Prisma.InputJsonValue | undefined,
        diffRegistry: [],
      },
    });
    return { campaign };
  }

  async findOne(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!campaign) return { error: 'Campaign not found' };
    return { campaign };
  }

  async update(
    userId: string,
    organizationId: string,
    id: string,
    dto: UpdateCampaignDto,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const existing = await this.prisma.campaign.findFirst({
      where: { id, organizationId, userId },
    });
    if (!existing) return { error: 'Campaign not found' };

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.platforms !== undefined && { platforms: dto.platforms }),
        ...(dto.initialMessage !== undefined && {
          initialMessage: dto.initialMessage as Prisma.InputJsonValue,
        }),
        ...(dto.campaign !== undefined && {
          campaign: dto.campaign as Prisma.InputJsonValue,
        }),
        ...(dto.diffRegistry !== undefined && {
          diffRegistry: dto.diffRegistry as Prisma.InputJsonValue[],
        }),
      },
    });
    return { campaign };
  }

  async delete(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const deleted = await this.prisma.campaign.deleteMany({
      where: { id, organizationId, userId },
    });
    if (deleted.count === 0) {
      return { error: 'Campaign not found or access denied' };
    }
    return { success: true };
  }
}
