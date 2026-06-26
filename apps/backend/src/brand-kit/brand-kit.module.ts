import { Module } from '@nestjs/common';
import { BrandKitController } from './brand-kit.controller.js';
import { BrandKitService } from './brand-kit.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [BrandKitController],
  providers: [BrandKitService],
  exports: [BrandKitService],
})
export class BrandKitModule {}
