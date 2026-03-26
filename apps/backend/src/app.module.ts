import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaService } from './prisma/prisma.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { StripeModule } from './stripe/stripe.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { createAuth } from './auth/auth.config.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AuthModule.forRootAsync({
      useFactory: (prisma: PrismaService) => ({
        auth: createAuth(prisma),
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
        },
      }),
      inject: [PrismaService],
    }),
    UsersModule,
    StripeModule,
    OnboardingModule,
    OrganizationModule,
  ],
})
export class AppModule {}
