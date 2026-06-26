import type { Platform } from '@prisma/client';

export class CreateCampaignDto {
  name: string;
  organizationId: string;
  description?: string;
  platforms?: Platform[];
  initialMessage?: unknown;
}
