import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { differenceInDays, isAfter } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service.js';
import { PLAN_LIMITS } from '../constants/plan-limits.js';
import { getStripeClient } from '../stripe/stripe-client.js';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private stripe() {
    return getStripeClient();
  }

  async getSubscriptionScheduleInfo(scheduleId: string): Promise<{
    downgradeDate: Date | null;
    targetPlanName: string | null;
  } | null> {
    try {
      const stripe = this.stripe();
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId, {
        expand: ['phases.items.price.product'],
      });

      if (schedule.phases && schedule.phases.length > 1) {
        const downgradePhase = schedule.phases[1];
        const downgradeDate = downgradePhase.start_date
          ? new Date(downgradePhase.start_date * 1000)
          : null;

        let targetPlanName: string | null = null;
        if (
          downgradePhase.items &&
          downgradePhase.items.length > 0 &&
          downgradePhase.items[0].price
        ) {
          const price = downgradePhase.items[0].price as Stripe.Price;
          const product =
            typeof price.product === 'string'
              ? await stripe.products.retrieve(price.product)
              : (price.product as Stripe.Product);
          targetPlanName = product.name;
        }

        return { downgradeDate, targetPlanName };
      }

      return null;
    } catch (error) {
      console.error('Error retrieving subscription schedule:', error);
      return null;
    }
  }

  async getSubscriptionData(userId: string) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              trialEndDate: true,
              trialStartDate: true,
            },
          },
        },
      });

      if (!subscription) {
        return {
          subscription: null,
          usageMetrics: null,
        };
      }

      if (!subscription.planName) {
        return {
          subscription,
          usageMetrics: null,
        };
      }

      const limits = PLAN_LIMITS[subscription.planName];
      if (!limits) {
        console.error(
          `Invalid plan name: ${subscription.planName} for user ${userId}`,
        );
        return {
          error: `Invalid subscription plan: ${subscription.planName}`,
        };
      }

      const validStatuses = ['active', 'requires_action', 'trialing'];
      if (
        subscription.status &&
        !validStatuses.includes(subscription.status)
      ) {
        return {
          subscription,
          usageMetrics: null,
        };
      }

      const organizationsCount = await this.prisma.organization.count({
        where: { ownerId: userId },
      });

      const totalAvailable =
        subscription.creditBalance + subscription.purchasedCredits;

      const usageMetrics = {
        credits: {
          used: subscription.usageCount / 100,
          total: totalAvailable / 100,
          monthly: subscription.creditBalance / 100,
          purchased: subscription.purchasedCredits / 100,
        },
        organizations: {
          used: organizationsCount,
          total: limits.organizations,
        },
      };

      let scheduleInfo: {
        downgradeDate: Date | null;
        targetPlanName: string | null;
      } | null = null;

      if (subscription.stripeSubscriptionScheduleId) {
        scheduleInfo = await this.getSubscriptionScheduleInfo(
          subscription.stripeSubscriptionScheduleId,
        );
      }

      let daysRemainingInTrial: number | null = null;
      let isTrialExpired = false;
      let isTrial = false;

      if (subscription.user.trialEndDate) {
        const now = new Date();
        const trialEnd = subscription.user.trialEndDate;
        const diffDays = differenceInDays(trialEnd, now);
        const isAfterTrialEnd = isAfter(now, trialEnd);

        daysRemainingInTrial = diffDays;
        isTrial = diffDays >= 0;
        isTrialExpired = isAfterTrialEnd;
      }

      return {
        subscription,
        usageMetrics,
        scheduleInfo,
        trialInfo: {
          isTrial,
          trialEndDate: subscription.user.trialEndDate ?? null,
          trialStartDate: subscription.user.trialStartDate ?? null,
          daysRemainingInTrial,
          isTrialExpired,
        },
      };
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        error: `Failed to fetch subscription data: ${errorMessage}`,
      };
    }
  }

  async getStripePrices() {
    if (!process.env.STRIPE_SECRET_KEY) {
      return [];
    }
    const stripe = this.stripe();
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true,
      type: 'recurring',
    });

    return prices.data.map((price) => ({
      id: price.id,
      productName: (price.product as Stripe.Product).name,
      productId:
        typeof price.product === 'string'
          ? price.product
          : price.product.id,
      unitAmount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
    }));
  }

  async getSubscriptionPagePayload(userId: string, userEmail: string | null) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return { error: 'No subscription' as const };
    }

    const prices = await this.getStripePrices();

    const starterMonthlyPrices = prices.find(
      (price) =>
        price.productName === 'Starter' && price.interval === 'month',
    );
    const growthMonthlyPrices = prices.find(
      (price) => price.productName === 'Growth' && price.interval === 'month',
    );
    const proMonthlyPrices = prices.find(
      (price) => price.productName === 'Pro' && price.interval === 'month',
    );

    const plans = [
      {
        name: 'Starter',
        description: 'Perfect for starting out',
        features: ['$20 credits per month', '1 organization'],
        price: {
          monthly: {
            amount: starterMonthlyPrices?.unitAmount || 2000,
            stripePriceId: starterMonthlyPrices?.id || '',
          },
        },
      },
      {
        name: 'Growth',
        description: 'For growing businesses',
        features: ['$50 credits per month', 'Up to 5 organizations'],
        price: {
          monthly: {
            amount: growthMonthlyPrices?.unitAmount || 5000,
            stripePriceId: growthMonthlyPrices?.id || '',
          },
        },
      },
      {
        name: 'Pro',
        description: 'For professionals and growing teams',
        features: ['$80 credits per month', 'Unlimited organizations'],
        price: {
          monthly: {
            amount: proMonthlyPrices?.unitAmount || 8000,
            stripePriceId: proMonthlyPrices?.id || '',
          },
        },
      },
    ];

    const currentPlanPriceId = subscription?.stripeProductId
      ? plans.find((p) => p.name === subscription.planName)?.price.monthly
          .stripePriceId
      : undefined;

    let scheduleInfo: {
      downgradeDate: Date | null;
      targetPlanName: string | null;
    } | null = null;

    if (subscription.stripeSubscriptionScheduleId) {
      scheduleInfo = await this.getSubscriptionScheduleInfo(
        subscription.stripeSubscriptionScheduleId,
      );
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timeZone: true },
    });

    return {
      subscription,
      plans,
      currentPlanPriceId,
      scheduleInfo,
      userTimeZone: dbUser?.timeZone ?? 'America/New_York',
      userEmail,
    };
  }

  private async validatePlanDowngrade(
    userId: string,
    currentPlanName: string | null,
    newPlanName: string,
  ): Promise<{
    allowed: boolean;
    message?: string;
    organizationsCount?: number;
  }> {
    if (!currentPlanName) {
      return { allowed: true };
    }

    const currentLimits = PLAN_LIMITS[currentPlanName];
    const newLimits = PLAN_LIMITS[newPlanName];

    if (!currentLimits || !newLimits) {
      return { allowed: true };
    }

    if (newLimits.organizations >= currentLimits.organizations) {
      return { allowed: true };
    }

    const organizationsCount = await this.prisma.organization.count({
      where: { ownerId: userId },
    });

    if (organizationsCount > newLimits.organizations) {
      return {
        allowed: false,
        message: `Cannot downgrade: You have ${organizationsCount} organization${organizationsCount !== 1 ? 's' : ''}, but the ${newPlanName} plan allows only ${newLimits.organizations}. Please delete ${organizationsCount - newLimits.organizations} organization${organizationsCount - newLimits.organizations !== 1 ? 's' : ''} before downgrading.`,
        organizationsCount,
      };
    }

    return { allowed: true };
  }

  /** Public URL of the Nest API (used for Stripe redirect URLs). */
  private apiPublicUrl() {
    return process.env.API_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';
  }

  async createCheckoutSession(
    userId: string,
    email: string | null,
    priceId: string,
    customerId?: string,
  ) {
    const stripe = this.stripe();
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: email || undefined,
      client_reference_id: userId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.apiPublicUrl()}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_URL ?? 'http://localhost:3001'}/plan`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }
    return { url: session.url };
  }

  async createCustomerPortalSession(
    stripeCustomerId: string,
    stripeProductId: string,
  ) {
    if (!stripeCustomerId || !stripeProductId) {
      throw new Error('Subscription not found');
    }

    const stripe = this.stripe();
    let configuration: Stripe.BillingPortal.Configuration;
    const configurations = await stripe.billingPortal.configurations.list();

    if (configurations.data.length > 0) {
      configuration = configurations.data[0];
    } else {
      const product = await stripe.products.retrieve(stripeProductId);
      if (!product.active) {
        throw new Error(
          "Subscription's product is not active in Stripe",
        );
      }

      const prices = await stripe.prices.list({
        type: 'recurring',
        active: true,
      });

      if (prices.data.length === 0) {
        throw new Error(
          "No active prices found for the subscription's product",
        );
      }

      configuration = await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Manage your subscription',
        },
        features: {
          subscription_cancel: {
            enabled: true,
            mode: 'at_period_end',
            cancellation_reason: {
              enabled: true,
              options: [
                'too_expensive',
                'missing_features',
                'switched_service',
                'unused',
                'other',
              ],
            },
          },
          payment_method_update: {
            enabled: true,
          },
        },
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.WEB_URL ?? 'http://localhost:3001'}/subscription`,
      configuration: configuration.id,
    });

    return {
      url: session.url,
      id: session.id,
      created: session.created,
      customer: session.customer,
      return_url: session.return_url,
    };
  }

  async updateSubscription(userId: string, newPriceId: string) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const currentPlanName = subscription.planName;
      if (!currentPlanName) {
        throw new Error('Current subscription has no plan');
      }

      const stripe = this.stripe();
      const newPriceData = await stripe.prices.retrieve(newPriceId, {
        expand: ['product'],
      });

      if (!newPriceData.active) {
        throw new Error('Selected price is not active');
      }

      const product = newPriceData.product as Stripe.Product;
      const newPlanName = product.name;

      const validation = await this.validatePlanDowngrade(
        userId,
        currentPlanName,
        newPlanName,
      );

      if (!validation.allowed) {
        return {
          error: validation.message || 'Cannot downgrade plan',
          organizationsCount: validation.organizationsCount,
        };
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      if (stripeSubscription.status !== 'active') {
        throw new Error(
          `Cannot update subscription with status: ${stripeSubscription.status}`,
        );
      }

      const subscriptionItem = stripeSubscription.items.data[0];
      if (!subscriptionItem) {
        throw new Error('Subscription has no items');
      }

      const currentStripePrice =
        stripeSubscription.items.data[0]?.price?.unit_amount || 0;
      const newPriceAmount = newPriceData.unit_amount || 0;
      const isUpgrade = newPriceAmount > currentStripePrice;
      const isDowngrade = newPriceAmount < currentStripePrice;

      if (isUpgrade) {
        const upgradeAmountCents = newPriceAmount - currentStripePrice;
        if (upgradeAmountCents > 0) {
          const customerId =
            typeof stripeSubscription.customer === 'string'
              ? stripeSubscription.customer
              : stripeSubscription.customer.id;

          const currency =
            stripeSubscription.items.data[0]?.price?.currency ?? 'usd';

          const invoice = await stripe.invoices.create({
            customer: customerId,
            collection_method: 'charge_automatically',
            metadata: {
              type: 'plan_upgrade',
              old_plan: currentPlanName,
              new_plan: newPlanName,
            },
          });

          await stripe.invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: upgradeAmountCents,
            currency,
            description: `Plan Upgrade: ${currentPlanName} to ${newPlanName}`,
          });

          const finalizedInvoice = await stripe.invoices.finalizeInvoice(
            invoice.id,
          );

          await stripe.invoices.pay(finalizedInvoice.id, {
            payment_method:
              stripeSubscription.default_payment_method as string,
          });
        }

        const scheduleIdToRelease =
          subscription.stripeSubscriptionScheduleId ||
          (typeof stripeSubscription.schedule === 'string'
            ? stripeSubscription.schedule
            : stripeSubscription.schedule?.id);

        if (scheduleIdToRelease) {
          try {
            await stripe.subscriptionSchedules.release(scheduleIdToRelease);
          } catch (error) {
            console.error('Error releasing subscription schedule:', error);
          }
        }

        const currentLimits = PLAN_LIMITS[currentPlanName];
        const newLimits = PLAN_LIMITS[newPlanName];

        if (!currentLimits || !newLimits) {
          throw new Error('Invalid plan limits');
        }

        const newCreditBalance = Math.max(
          0,
          newLimits.credits -
            currentLimits.credits +
            subscription.creditBalance,
        );

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [{ id: subscriptionItem.id, price: newPriceId }],
          proration_behavior: 'none',
        });

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            planName: newPlanName,
            amount: newPriceAmount,
            creditBalance: newCreditBalance,
            stripeSubscriptionScheduleId: null,
          },
        });

        return {
          success: true,
          message: `Subscription upgraded to ${newPlanName} plan`,
        };
      }

      if (isDowngrade) {
        const scheduleIdToRelease =
          subscription.stripeSubscriptionScheduleId ||
          (typeof stripeSubscription.schedule === 'string'
            ? stripeSubscription.schedule
            : stripeSubscription.schedule?.id);

        if (scheduleIdToRelease) {
          await stripe.subscriptionSchedules.release(scheduleIdToRelease);
        }

        const newSchedule = await stripe.subscriptionSchedules.create({
          from_subscription: subscription.stripeSubscriptionId,
        });

        const schedule = await stripe.subscriptionSchedules.update(
          newSchedule.id,
          {
            phases: [
              {
                items: [
                  {
                    price: newSchedule.phases[0].items[0].price as string,
                    quantity: newSchedule.phases[0].items[0].quantity,
                  },
                ],
                start_date: newSchedule.phases[0].start_date,
                end_date: newSchedule.phases[0].end_date,
              },
              {
                items: [{ price: newPriceId, quantity: 1 }],
                duration: {
                  interval: 'month',
                  interval_count: 1,
                },
              },
            ],
            end_behavior: 'release',
          },
        );

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            stripeSubscriptionScheduleId: schedule.id,
          },
        });

        const scheduledDate = new Date(schedule.phases[1].start_date * 1000);

        return {
          success: true,
          message: `Subscription will downgrade to ${newPlanName} plan at the end of your billing period`,
          scheduledDate,
        };
      }

      return {
        success: true,
        message: 'No change in plan price',
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update subscription';
      return { error: errorMessage };
    }
  }

  async cancelDowngrade(userId: string) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const stripe = this.stripe();
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      const scheduleIdToRelease =
        subscription.stripeSubscriptionScheduleId ||
        (typeof stripeSubscription.schedule === 'string'
          ? stripeSubscription.schedule
          : stripeSubscription.schedule?.id);

      if (!scheduleIdToRelease) {
        return {
          success: false,
          error: 'No scheduled downgrade found',
        };
      }

      try {
        await stripe.subscriptionSchedules.release(scheduleIdToRelease);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        if (
          !errorMessage.includes('No such subscription_schedule') &&
          !errorMessage.includes('already released')
        ) {
          throw error;
        }
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeSubscriptionScheduleId: null,
        },
      });

      return {
        success: true,
        message: 'Downgrade cancelled successfully',
      };
    } catch (error) {
      console.error('Error cancelling downgrade:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel downgrade';
      return { success: false, error: errorMessage };
    }
  }

  async createCreditPurchaseSession(userId: string, amount: number) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndDate: true },
    });
    if (!dbUser) {
      throw new Error('User not found');
    }
    const isTrialActive =
      dbUser.trialEndDate != null && new Date() < dbUser.trialEndDate;
    if (isTrialActive) {
      throw new Error(
        'Credit purchases are not available during your trial period. Please wait until your trial ends.',
      );
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      throw new Error('No subscription or Stripe customer ID found');
    }

    const stripe = this.stripe();
    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Additional Credits - $${amount}`,
              description: `Purchase $${amount} in credits`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${this.apiPublicUrl()}/api/stripe/credit-purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_URL ?? 'http://localhost:3001'}/subscription`,
      metadata: {
        userId,
        amount: amount.toString(),
        type: 'credit_purchase',
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }
    return { url: session.url };
  }

  async handleCreditPurchaseSuccess(sessionId: string) {
    const stripe = this.stripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      !session.metadata ||
      !session.metadata.userId ||
      !session.metadata.amount
    ) {
      throw new Error('Invalid session metadata');
    }

    const userId = session.metadata.userId;
    const amountInDollars = parseFloat(session.metadata.amount);
    const amountInCents = Math.round(amountInDollars * 100);

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const currentCreditBalance = subscription.creditBalance;

    if (currentCreditBalance > 0) {
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          purchasedCredits: {
            increment: amountInCents,
          },
        },
      });
      return { success: true };
    }

    const remainingAfterDeduct = amountInCents + currentCreditBalance;

    if (remainingAfterDeduct > 0) {
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          creditBalance: 0,
          purchasedCredits: {
            increment: remainingAfterDeduct,
          },
        },
      });
    } else {
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          creditBalance: remainingAfterDeduct,
          purchasedCredits: 0,
        },
      });
    }

    return { success: true };
  }
}
