import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import type { CreateKnowledgeDto } from './dto/create-knowledge.dto.js';
import type { UpdateKnowledgeDto } from './dto/update-knowledge.dto.js';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const items = await this.prisma.knowledgeBase.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
    });
    return { knowledgeBases: items };
  }

  async create(userId: string, dto: CreateKnowledgeDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };
    if (!dto.name?.trim()) return { error: 'Name is required' };

    const knowledgeBase = await this.prisma.knowledgeBase.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        userId,
        organizationId: dto.organizationId,
        vectorIds: [],
        tableData: dto.tableData as Prisma.InputJsonValue | undefined,
        tableSchema: dto.tableSchema as Prisma.InputJsonValue | undefined,
      },
    });
    return { knowledgeBase };
  }

  async findOne(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: { id, organizationId, userId },
    });
    if (!knowledgeBase) return { error: 'Knowledge base not found' };
    return { knowledgeBase };
  }

  async update(
    userId: string,
    organizationId: string,
    id: string,
    dto: UpdateKnowledgeDto,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const existing = await this.prisma.knowledgeBase.findFirst({
      where: { id, organizationId, userId },
    });
    if (!existing) return { error: 'Knowledge base not found' };

    const knowledgeBase = await this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.vectorIds !== undefined && { vectorIds: dto.vectorIds }),
        ...(dto.tableData !== undefined && {
          tableData: dto.tableData as Prisma.InputJsonValue,
        }),
        ...(dto.tableSchema !== undefined && {
          tableSchema: dto.tableSchema as Prisma.InputJsonValue,
        }),
      },
    });
    return { knowledgeBase };
  }

  async delete(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const deleted = await this.prisma.knowledgeBase.deleteMany({
      where: { id, organizationId, userId },
    });
    if (deleted.count === 0) {
      return { error: 'Knowledge base not found or access denied' };
    }
    return { success: true };
  }
}
