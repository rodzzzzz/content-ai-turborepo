import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service.js';

@Controller('billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription-data')
  async getSubscriptionData(@Session() session: UserSession) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.billingService.getSubscriptionData(userId);
  }

  @Get('subscription-page')
  async getSubscriptionPage(@Session() session: UserSession) {
    const userId = session?.user?.id;
    const email = session?.user?.email ?? null;
    if (!userId) return { error: 'Unauthorized' };
    return this.billingService.getSubscriptionPagePayload(userId, email);
  }

  @Get('stripe-prices')
  async getStripePrices(@Session() session: UserSession) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    const prices = await this.billingService.getStripePrices();
    return { prices };
  }

  @Post('checkout-session')
  async createCheckoutSession(
    @Session() session: UserSession,
    @Body() body: { priceId: string; customerId?: string },
  ) {
    const userId = session?.user?.id;
    const email = session?.user?.email ?? null;
    if (!userId) return { error: 'Unauthorized' };
    try {
      return await this.billingService.createCheckoutSession(
        userId,
        email,
        body.priceId,
        body.customerId,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed';
      return { error: msg };
    }
  }

  @Post('customer-portal')
  async createCustomerPortalSession(
    @Session() session: UserSession,
    @Body() body: { stripeCustomerId: string; stripeProductId: string },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      return await this.billingService.createCustomerPortalSession(
        body.stripeCustomerId,
        body.stripeProductId,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Portal failed';
      return { error: msg };
    }
  }

  @Post('update-subscription')
  async updateSubscription(
    @Session() session: UserSession,
    @Body() body: { newPriceId: string },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.billingService.updateSubscription(userId, body.newPriceId);
  }

  @Post('cancel-downgrade')
  async cancelDowngrade(@Session() session: UserSession) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.billingService.cancelDowngrade(userId);
  }

  @Post('credit-purchase-session')
  async createCreditPurchaseSession(
    @Session() session: UserSession,
    @Body() body: { amount: number },
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    try {
      return await this.billingService.createCreditPurchaseSession(
        userId,
        body.amount,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Credit purchase failed';
      return { error: msg };
    }
  }
}
