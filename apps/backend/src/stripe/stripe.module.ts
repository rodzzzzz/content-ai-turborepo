import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [StripeController],
})
export class StripeModule {}
