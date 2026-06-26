import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { UTApi } from 'uploadthing/server';
import { PrismaService } from '../prisma/prisma.service.js';
import { findOwnedOrganization } from '../common/organization-access.js';
import type { CreateFolderDto } from './dto/create-folder.dto.js';
import type { CreateFileDto } from './dto/create-file.dto.js';

const utapi = new UTApi();

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async listFolders(userId: string, organizationId: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const folders = await this.prisma.folder.findMany({
      where: { organizationId, userId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { files: true } },
      },
    });
    return { folders };
  }

  async createFolder(userId: string, dto: CreateFolderDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };
    if (!dto.name?.trim()) return { error: 'Folder name is required' };

    const folder = await this.prisma.folder.create({
      data: {
        name: dto.name.trim(),
        userId,
        organizationId: dto.organizationId,
      },
    });
    return { folder };
  }

  async listFiles(
    userId: string,
    organizationId: string,
    folderId?: string,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const files = await this.prisma.file.findMany({
      where: {
        organizationId,
        userId,
        ...(folderId ? { folderId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return { files };
  }

  async listFilesPaginated(
    userId: string,
    organizationId: string,
    opts: {
      folderId?: string | null;
      search?: string;
      limit?: number;
      cursor?: string;
    },
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    const where: Prisma.FileWhereInput = {
      organizationId,
      userId,
    };

    if (opts.folderId !== undefined) {
      where.folderId = opts.folderId;
    }
    if (opts.search) {
      where.name = {
        contains: opts.search,
        mode: 'insensitive',
      };
    }
    if (opts.cursor) {
      where.id = { lt: opts.cursor };
    }

    const files = await this.prisma.file.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = files.length > limit;
    const paginatedFiles = hasNextPage ? files.slice(0, limit) : files;
    const nextCursor = hasNextPage
      ? paginatedFiles[paginatedFiles.length - 1]?.id
      : undefined;

    return {
      files: paginatedFiles,
      hasNextPage,
      nextCursor,
    };
  }

  async getFileById(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const file = await this.prisma.file.findFirst({
      where: { id, organizationId, userId },
    });
    if (!file) return { error: 'File not found' };
    return { file };
  }

  async createFile(userId: string, dto: CreateFileDto) {
    const org = await findOwnedOrganization(
      this.prisma,
      dto.organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    if (dto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: {
          id: dto.folderId,
          organizationId: dto.organizationId,
          userId,
        },
      });
      if (!folder) return { error: 'Folder not found' };
    }

    const file = await this.prisma.file.create({
      data: {
        name: dto.name,
        url: dto.url,
        key: dto.key,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        userId,
        organizationId: dto.organizationId,
        folderId: dto.folderId ?? null,
        uploadStatus: dto.uploadStatus ?? undefined,
      },
    });
    return { file };
  }

  async findFilesByUrls(
    userId: string,
    organizationId: string,
    urls: string[],
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    if (!urls.length) {
      return { files: [] };
    }

    const files = await this.prisma.file.findMany({
      where: {
        organizationId,
        userId,
        url: { in: urls },
      },
    });
    return { files };
  }

  async updateFile(
    userId: string,
    organizationId: string,
    fileId: string,
    data: { name?: string; folderId?: string | null },
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    try {
      const file = await this.prisma.file.update({
        where: { id: fileId, userId, organizationId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.folderId !== undefined && { folderId: data.folderId }),
        },
      });
      return { file };
    } catch {
      return { error: 'File not found or access denied' };
    }
  }

  async moveFiles(
    userId: string,
    organizationId: string,
    fileIds: string[],
    destinationFolderId: string | 'HOME',
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const folderId =
      destinationFolderId === 'HOME' ? null : destinationFolderId;

    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, organizationId, userId },
      });
      if (!folder) return { error: 'Folder not found' };
    }

    await this.prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        userId,
        organizationId,
      },
      data: { folderId },
    });

    const movedFiles = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId,
        organizationId,
      },
    });

    return { movedFiles };
  }

  async deleteFilesBulk(
    userId: string,
    organizationId: string,
    items: { id: string; key: string }[],
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const deleted = await this.prisma.file.deleteMany({
      where: {
        id: { in: items.map((i) => i.id) },
        userId,
        organizationId,
      },
    });

    if (deleted.count === 0 || deleted.count !== items.length) {
      return { error: 'Failed to delete files' };
    }

    const keys = items.map((i) => i.key);
    await utapi.deleteFiles(keys);

    return { success: true };
  }

  async updateFileFolders(
    userId: string,
    organizationId: string,
    fileIds: string[],
    folderId: string | null,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const updated = await this.prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        userId,
        organizationId,
      },
      data: { folderId },
    });

    if (updated.count === 0) {
      return { error: 'No files were updated' };
    }

    return { count: updated.count };
  }

  async updateFolder(
    userId: string,
    organizationId: string,
    folderId: string,
    name: string,
  ) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    try {
      const folder = await this.prisma.folder.update({
        where: { id: folderId, userId, organizationId },
        data: { name },
      });
      return { folder };
    } catch {
      return { error: 'Folder not found or access denied' };
    }
  }

  async deleteFolder(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const deleted = await this.prisma.folder.deleteMany({
      where: { id, organizationId, userId },
    });
    if (deleted.count === 0) {
      return { error: 'Folder not found or access denied' };
    }
    return { success: true };
  }

  async deleteFile(userId: string, organizationId: string, id: string) {
    const org = await findOwnedOrganization(
      this.prisma,
      organizationId,
      userId,
    );
    if (!org) return { error: 'Organization not found or access denied' };

    const deleted = await this.prisma.file.deleteMany({
      where: { id, organizationId, userId },
    });
    if (deleted.count === 0) {
      return { error: 'File not found or access denied' };
    }
    return { success: true };
  }
}
