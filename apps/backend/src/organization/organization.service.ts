import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_LIMITS } from '../constants/plan-limits';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, isDefault: true },
    });
    return { organizations };
  }

  async findOne(id: string, userId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id, ownerId: userId },
      select: { id: true, name: true, isDefault: true },
    });
    return { organization };
  }

  async create(name: string, userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.planName) {
      return { error: 'No active subscription found' };
    }

    const limits = PLAN_LIMITS[subscription.planName];
    if (!limits) {
      return { error: 'Invalid plan' };
    }

    const count = await this.prisma.organization.count({
      where: { ownerId: userId },
    });

    if (count >= limits.organizations) {
      return {
        error:
          'Organization limit reached. Please upgrade your plan to create more organizations.',
      };
    }

    const organization = await this.prisma.organization.create({
      data: { name, ownerId: userId },
      select: { id: true, name: true, isDefault: true },
    });

    return { success: true, organization };
  }

  async update(id: string, name: string, userId: string) {
    try {
      const organization = await this.prisma.organization.update({
        where: { id, ownerId: userId },
        data: { name },
        select: { id: true, name: true, isDefault: true },
      });
      return { success: true, organization };
    } catch {
      return { error: 'Organization not found or access denied' };
    }
  }

  async delete(id: string, userId: string) {
    try {
      await this.prisma.organization.delete({
        where: { id, ownerId: userId },
      });
      return { success: true };
    } catch {
      return { error: 'Organization not found or access denied' };
    }
  }
}
