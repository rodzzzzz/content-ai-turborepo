import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@mguay/nestjs-better-auth';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StripeModule } from './stripe/stripe.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OrganizationModule } from './organization/organization.module';
import { createAuth } from './auth/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AuthModule.forRootAsync({
      useFactory: (prisma: PrismaService) => ({
        auth: createAuth(prisma),
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
