import { Module } from '@nestjs/common';
import { PersonalityController } from './personality.controller.js';
import { PersonalityService } from './personality.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalityController],
  providers: [PersonalityService],
  exports: [PersonalityService],
})
export class PersonalityModule {}
