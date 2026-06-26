import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('session')
  async getSession(@Session() session: UserSession) {
    return session;
  }

  @Patch('me/avatar')
  async setAvatar(
    @Session() session: UserSession,
    @Body() body: { imageUrl: string },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!body?.imageUrl?.trim()) {
      return { error: 'imageUrl is required' };
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { image: body.imageUrl.trim() },
    });
    return { success: true };
  }
}
