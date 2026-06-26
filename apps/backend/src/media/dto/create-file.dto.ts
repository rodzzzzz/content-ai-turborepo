import type { UploadStatus } from '@prisma/client';

export class CreateFileDto {
  organizationId: string;
  name: string;
  url: string;
  key: string;
  fileType: string;
  fileSize: number;
  folderId?: string;
  uploadStatus?: UploadStatus;
}
