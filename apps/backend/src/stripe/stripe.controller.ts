import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ONBOARDING_REDIRECT } from './stripe.constants';

@Controller('stripe')
export class StripeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('checkout')
  async handleCheckoutSuccess(
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    if (!sessionId) {
      return res.redirect('/pricing');
    }

    try {
      const Stripe = (await import('stripe')).default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

      const session = await stripeClient.checkout.sessions.retrieve(
        sessionId,
        { expand: ['customer', 'subscription'] },
      );

      if (!session.customer || typeof session.customer === 'string') {
        return res.redirect('/error?message=invalid_customer');
      }

      const customerId = (session.customer as { id: string }).id;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as { id: string })?.id;

      if (!subscriptionId) {
        return res.redirect('/error?message=no_subscription');
      }

      const subscription = await stripeClient.subscriptions.retrieve(
        subscriptionId,
        { expand: ['items.data.price.product'] },
      );

      const plan = subscription.items.data[0]?.price;
      if (!plan) {
        return res.redirect('/error?message=no_plan');
      }

      const productId = (plan.product as { id: string })?.id;
      if (!productId) {
        return res.redirect('/error?message=no_product');
      }

      const userId = session.client_reference_id as string | null;
      if (!userId) {
        return res.redirect('/error?message=no_user');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found in database.');
      }

      const isTrialActive =
        user.trialEndDate && new Date() < user.trialEndDate;

      if (isTrialActive) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { trialEndDate: null },
        });
      }

      const periodEndUnix = subscription.items.data.find(
        (item) => item.price?.id === plan.id,
      )?.current_period_end;
      const nextReset = periodEndUnix
        ? new Date(periodEndUnix * 1000)
        : undefined;

      const planName = (plan.product as { name?: string })?.name;

      const existingSubscription = await this.prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      if (!existingSubscription) {
        await this.prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeProductId: productId,
            planName: planName ?? null,
            status: subscription.status ?? 'active',
            amount: plan.unit_amount ?? null,
            nextUsageReset: nextReset ?? undefined,
          },
        });
      } else {
        await this.prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeProductId: productId,
            planName: planName ?? null,
            status: subscription.status,
            amount: plan.unit_amount ?? null,
            nextUsageReset: nextReset ?? undefined,
          },
        });
      }

      // No unstable_update - customSession fetches fresh data from DB on next request
      const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';
      return res.redirect(`${webUrl}${ONBOARDING_REDIRECT}`);
    } catch (error) {
      console.error('Error handling successful checkout:', error);
      return res.redirect('/error');
    }
  }
}
