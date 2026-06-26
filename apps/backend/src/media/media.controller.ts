import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { CreateFileDto } from './dto/create-file.dto.js';

@Controller('media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('folders')
  async listFolders(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.listFolders(userId, organizationId.trim());
  }

  @Patch('folders/:id')
  async updateFolder(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() body: { name: string },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim() || !body?.name?.trim()) {
      return { error: 'organizationId and name are required' };
    }
    return this.mediaService.updateFolder(
      userId,
      organizationId.trim(),
      id,
      body.name.trim(),
    );
  }

  @Post('folders')
  async createFolder(
    @Session() session: UserSession,
    @Body() dto: CreateFolderDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.mediaService.createFolder(userId, dto);
  }

  @Delete('folders/:id')
  async deleteFolder(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.deleteFolder(userId, organizationId.trim(), id);
  }

  @Post('files/lookup-by-urls')
  async lookupFilesByUrls(
    @Session() session: UserSession,
    @Body() body: { organizationId: string; urls: string[] },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!body?.organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.findFilesByUrls(
      userId,
      body.organizationId.trim(),
      body.urls ?? [],
    );
  }

  @Get('files')
  async listFiles(
    @Session() session: UserSession,
    @Query('organizationId') organizationId: string,
    @Query('folderId') folderId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    const orgId = organizationId.trim();
    if (limit || cursor || search) {
      return this.mediaService.listFilesPaginated(userId, orgId, {
        folderId: folderId === undefined ? undefined : folderId || null,
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor: cursor || undefined,
        search: search || undefined,
      });
    }
    return this.mediaService.listFiles(userId, orgId, folderId);
  }

  @Get('files/:id')
  async getFile(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.getFileById(
      userId,
      organizationId.trim(),
      id,
    );
  }

  @Patch('files/:id')
  async patchFile(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() body: { name?: string; folderId?: string | null },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.updateFile(
      userId,
      organizationId.trim(),
      id,
      body ?? {},
    );
  }

  @Post('files/bulk-move')
  async bulkMoveFiles(
    @Session() session: UserSession,
    @Body()
    body: {
      organizationId: string;
      files: { id: string; key: string }[];
      destinationFolderId: string | 'HOME';
    },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!body?.organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.moveFiles(
      userId,
      body.organizationId.trim(),
      body.files.map((f) => f.id),
      body.destinationFolderId,
    );
  }

  @Post('files/delete-bulk')
  async deleteFilesBulk(
    @Session() session: UserSession,
    @Body()
    body: {
      organizationId: string;
      files: { id: string; key: string }[];
    },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!body?.organizationId?.trim() || !body.files?.length) {
      return { error: 'organizationId and files are required' };
    }
    return this.mediaService.deleteFilesBulk(
      userId,
      body.organizationId.trim(),
      body.files,
    );
  }

  @Post('files/update-folders')
  async updateFileFolders(
    @Session() session: UserSession,
    @Body()
    body: {
      organizationId: string;
      fileIds: string[];
      folderId: string | null;
    },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!body?.organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.updateFileFolders(
      userId,
      body.organizationId.trim(),
      body.fileIds ?? [],
      body.folderId ?? null,
    );
  }

  @Post('files')
  async createFile(
    @Session() session: UserSession,
    @Body() dto: CreateFileDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.mediaService.createFile(userId, dto);
  }

  @Delete('files/:id')
  async deleteFile(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!organizationId?.trim()) {
      return { error: 'organizationId is required' };
    }
    return this.mediaService.deleteFile(userId, organizationId.trim(), id);
  }
}
