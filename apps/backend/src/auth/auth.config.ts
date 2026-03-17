import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession, twoFactor } from 'better-auth/plugins';
import type { PrismaClient } from '@prisma/client';

// Extended session user type for customSession
export interface ExtendedSessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'ADMIN' | 'USER';
  organizationId: string | null;
  isTwoFactorEnabled: boolean;
  isOnboardingCompleted: boolean;
  timeZone: string;
  isTrialActive: boolean;
  hasCustomerId: boolean;
  isOAuth: boolean;
  setupSteps: string[];
}

export function createAuth(prisma: PrismaClient) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        const sendingEmail = process.env.SENDING_EMAIL ?? 'noreply@example.com';
        if (resendApiKey && user.email) {
          try {
            const { Resend } = await import('resend');
            const resendClient = new Resend(resendApiKey);
            void resendClient.emails.send({
              from: `Content AI <${sendingEmail}>`,
              to: user.email,
              subject: 'Reset your password',
              html: `<p>Hi ${user.name ?? 'there'},</p><p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`,
            });
          } catch (err) {
            console.error('Failed to send password reset email:', err);
          }
        }
      },
    },
    socialProviders: {
      twitter: {
        clientId: process.env.TWITTER_CLIENT_ID ?? '',
        clientSecret: process.env.TWITTER_CLIENT_SECRET ?? '',
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'USER',
          input: false,
        },
        isTwoFactorEnabled: {
          type: 'boolean',
          required: true,
          defaultValue: false,
          input: false,
        },
        isOnboardingCompleted: {
          type: 'boolean',
          required: true,
          defaultValue: false,
          input: false,
        },
        timeZone: {
          type: 'string',
          required: true,
          defaultValue: 'America/New_York',
          input: false,
        },
        setupSteps: {
          type: 'string',
          required: false,
          defaultValue: '[]',
          input: false,
        },
        trialEndDate: {
          type: 'string',
          required: false,
          defaultValue: null,
          input: false,
        },
        trialStartDate: {
          type: 'string',
          required: false,
          defaultValue: null,
          input: false,
        },
      },
    },
    plugins: [
      twoFactor({
        issuer: 'Content AI',
        otpOptions: {
          async sendOTP({ user, otp }) {
            // Send OTP via email - requires RESEND_API_KEY and SENDING_EMAIL
            const resendApiKey = process.env.RESEND_API_KEY;
            const sendingEmail = process.env.SENDING_EMAIL ?? 'noreply@example.com';
            if (resendApiKey && user.email) {
              try {
                const { Resend } = await import('resend');
                const resendClient = new Resend(resendApiKey);
                await resendClient.emails.send({
                  from: `Content AI <${sendingEmail}>`,
                  to: user.email,
                  subject: 'Your 2FA Code',
                  html: `<p>Hi ${user.name ?? 'there'},</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`,
                });
              } catch (err) {
                console.error('Failed to send 2FA OTP email:', err);
              }
            }
          },
        },
      }),
      customSession(async ({ user, session }) => {
        if (!user?.id) return { user, session };

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            subscription: true,
            organizations: {
              where: { isDefault: true },
              take: 1,
            },
            accounts: { take: 1 },
          },
        });

        if (!dbUser) return { user, session };

        const defaultOrg = dbUser.organizations[0];
        const hasAccount = dbUser.accounts.length > 0;
        const isOAuth = hasAccount && !dbUser.email;
        const hasCustomerId = !!dbUser.subscription?.stripeCustomerId;
        const isTrialActive = dbUser.trialEndDate
          ? new Date() < dbUser.trialEndDate
          : false;

        return {
          user: {
            ...user,
            role: (dbUser.role as 'ADMIN' | 'USER') ?? 'USER',
            organizationId: defaultOrg?.id ?? null,
            isTwoFactorEnabled: dbUser.twoFactorEnabled ?? dbUser.isTwoFactorEnabled,
            isOnboardingCompleted: dbUser.isOnboardingCompleted,
            timeZone: dbUser.timeZone ?? 'America/New_York',
            isTrialActive,
            hasCustomerId,
            isOAuth,
            setupSteps: (Array.isArray(dbUser.setupSteps) ? dbUser.setupSteps : []) as string[],
          },
          session,
        };
      }),
    ],
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
    trustedOrigins: [
      'http://localhost:3001',
      'http://localhost:3000',
      process.env.APP_URL ?? '',
    ].filter(Boolean),
  });
}
