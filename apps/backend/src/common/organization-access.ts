import type { PrismaService } from '../prisma/prisma.service.js';

export async function findOwnedOrganization(
  prisma: PrismaService,
  organizationId: string,
  userId: string,
) {
  return prisma.organization.findFirst({
    where: { id: organizationId, ownerId: userId },
    select: { id: true },
  });
}
