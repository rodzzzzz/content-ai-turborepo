import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BillingModule } from '../billing/billing.module.js';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [StripeController],
})
export class StripeModule {}
