import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
})
export class UsersModule {}
