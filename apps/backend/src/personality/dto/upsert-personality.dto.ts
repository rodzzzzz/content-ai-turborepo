export class UpsertPersonalityDto {
  organizationId: string;
  personality?: string;
  writingStyle?: string;
  additionalInstructions?: string;
  interests?: unknown;
  emoji?: boolean;
  temperature?: number;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
}
