import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaService } from './prisma/prisma.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { StripeModule } from './stripe/stripe.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { IntegrationModule } from './integration/integration.module.js';
import { CampaignModule } from './campaign/campaign.module.js';
import { ScheduleModule } from './schedule/schedule.module.js';
import { MediaModule } from './media/media.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { PersonalityModule } from './personality/personality.module.js';
import { KnowledgeModule } from './knowledge/knowledge.module.js';
import { BrandKitModule } from './brand-kit/brand-kit.module.js';
import { WorkflowModule } from './workflow/workflow.module.js';
import { BillingModule } from './billing/billing.module.js';
import { UsageModule } from './usage/usage.module.js';
import { createAuth } from './auth/auth.config.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    BillingModule,
    UsageModule,
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
    IntegrationModule,
    CampaignModule,
    ScheduleModule,
    MediaModule,
    AnalyticsModule,
    PersonalityModule,
    KnowledgeModule,
    BrandKitModule,
    WorkflowModule,
  ],
})
export class AppModule {}
