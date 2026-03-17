import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StripeController],
})
export class StripeModule {}
