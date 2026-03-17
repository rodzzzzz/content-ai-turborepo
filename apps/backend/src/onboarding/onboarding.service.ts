import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TRIAL_CREDITS } from '../constants/plan-limits';
import type { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async complete(userId: string, dto: CompleteOnboardingDto) {
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    const [updatedUser, , organization] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: fullName,
          timeZone: dto.timeZone,
          isOnboardingCompleted: true,
        },
      }),
      this.prisma.onboarding.create({
        data: {
          userId,
          organizationName: dto.organizationName,
          organizationSize: dto.organizationSize,
          industry: dto.organizationType,
          discoveryChannel: dto.discoveryChannel,
        },
      }),
      this.prisma.organization.create({
        data: {
          name: dto.organizationName,
          ownerId: userId,
          isDefault: true,
        },
        select: { id: true },
      }),
    ]);

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!existingSubscription) {
      const now = new Date();
      await this.prisma.subscription.create({
        data: {
          userId,
          planName: 'Trial',
          status: 'trialing',
          creditBalance: TRIAL_CREDITS,
          nextUsageReset: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return {
      organizationId: organization.id,
      user: updatedUser,
    };
  }
}
