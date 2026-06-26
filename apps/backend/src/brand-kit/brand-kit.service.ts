import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import type { UpsertBrandKitDto } from './dto/upsert-brand-kit.dto.js';

@Injectable()
export class BrandKitService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const brandKit = await this.prisma.brandKit.findUnique({
      where: { organizationId },
    });
    return { brandKit };
  }

  async upsert(userId: string, dto: UpsertBrandKitDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const brandKit = await this.prisma.brandKit.upsert({
      where: { organizationId: dto.organizationId },
      create: {
        userId,
        organizationId: dto.organizationId,
        primaryColor: dto.primaryColor ?? null,
        ...(dto.additionalColors !== undefined && {
          additionalColors: dto.additionalColors as Prisma.InputJsonValue,
        }),
        font: dto.font ?? null,
        logo: dto.logo ?? null,
        icon: dto.icon ?? null,
      },
      update: {
        ...(dto.primaryColor !== undefined && {
          primaryColor: dto.primaryColor,
        }),
        ...(dto.additionalColors !== undefined && {
          additionalColors: dto.additionalColors as Prisma.InputJsonValue,
        }),
        ...(dto.font !== undefined && { font: dto.font }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });
    return { brandKit };
  }
}
