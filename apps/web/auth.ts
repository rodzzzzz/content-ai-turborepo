'use server';

import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * Replaces NextAuth `unstable_update`. Better Auth reads user/org state from the DB
 * on each request; we persist changes here (and swap default org when switching).
 */
export async function unstable_update(data: {
  user?: {
    organizationId?: string;
    name?: string;
    email?: string | null;
    image?: string | null;
    isOnboardingCompleted?: boolean;
    timeZone?: string;
    isTwoFactorEnabled?: boolean;
    setupSteps?: string[];
  };
}) {
  const user = await currentUser();
  if (!user?.id || !data.user) return;

  const u = data.user;

  if (u.organizationId) {
    const org = await db.organization.findFirst({
      where: { id: u.organizationId, ownerId: user.id },
    });
    if (org) {
      await db.$transaction([
        db.organization.updateMany({
          where: { ownerId: user.id },
          data: { isDefault: false },
        }),
        db.organization.update({
          where: { id: u.organizationId },
          data: { isDefault: true },
        }),
      ]);
    }
  }

  const patch: Prisma.UserUpdateInput = {};
  if (u.name !== undefined) patch.name = u.name;
  if (u.email !== undefined) patch.email = u.email ?? undefined;
  if (u.image !== undefined) patch.image = u.image;
  if (u.isOnboardingCompleted !== undefined) {
    patch.isOnboardingCompleted = u.isOnboardingCompleted;
  }
  if (u.timeZone !== undefined) patch.timeZone = u.timeZone;
  if (u.isTwoFactorEnabled !== undefined) {
    patch.isTwoFactorEnabled = u.isTwoFactorEnabled;
    patch.twoFactorEnabled = u.isTwoFactorEnabled;
  }
  if (u.setupSteps !== undefined) {
    patch.setupSteps = u.setupSteps;
  }

  if (Object.keys(patch).length > 0) {
    await db.user.update({
      where: { id: user.id },
      data: patch,
    });
  }
}
