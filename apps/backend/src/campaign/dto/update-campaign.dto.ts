import type { Platform } from '@prisma/client';

export class UpdateCampaignDto {
  name?: string;
  description?: string;
  platforms?: Platform[];
  initialMessage?: unknown;
  campaign?: unknown;
  diffRegistry?: unknown[];
}
