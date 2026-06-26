import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import type { UpsertPersonalityDto } from './dto/upsert-personality.dto.js';

@Injectable()
export class PersonalityService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const personality = await this.prisma.personality.findFirst({
      where: { userId, organizationId },
    });
    return { personality };
  }

  async upsert(userId: string, dto: UpsertPersonalityDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const personality = await this.prisma.personality.upsert({
      where: { userId },
      create: {
        userId,
        organizationId: dto.organizationId,
        vectorIds: [],
        faqVectorIds: [],
        personality: dto.personality ?? null,
        writingStyle: dto.writingStyle ?? null,
        additionalInstructions: dto.additionalInstructions ?? null,
        interests: dto.interests as Prisma.InputJsonValue | undefined,
        emoji: dto.emoji ?? false,
        temperature: dto.temperature ?? 30,
        twitter: dto.twitter ?? null,
        linkedin: dto.linkedin ?? null,
        facebook: dto.facebook ?? null,
      },
      update: {
        ...(dto.personality !== undefined && { personality: dto.personality }),
        ...(dto.writingStyle !== undefined && {
          writingStyle: dto.writingStyle,
        }),
        ...(dto.additionalInstructions !== undefined && {
          additionalInstructions: dto.additionalInstructions,
        }),
        ...(dto.interests !== undefined && {
          interests: dto.interests as Prisma.InputJsonValue,
        }),
        ...(dto.emoji !== undefined && { emoji: dto.emoji }),
        ...(dto.temperature !== undefined && { temperature: dto.temperature }),
        ...(dto.twitter !== undefined && { twitter: dto.twitter }),
        ...(dto.linkedin !== undefined && { linkedin: dto.linkedin }),
        ...(dto.facebook !== undefined && { facebook: dto.facebook }),
      },
    });
    return { personality };
  }
}
