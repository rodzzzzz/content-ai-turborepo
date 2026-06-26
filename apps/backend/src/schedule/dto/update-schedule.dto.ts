import type { Platform, Status } from '@prisma/client';

export class UpdateScheduleDto {
  platform?: Platform;
  content?: string;
  /** ISO 8601 date string */
  date?: string;
  status?: Status;
  mediaUrl?: string[];
  integrationId?: string;
}
