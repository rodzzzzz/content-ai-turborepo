import { db } from '@/lib/db';
import { resetUsage, resetUsageLimit } from '@/actions/usage';
import { PLAN_LIMITS } from '@/constants/plan-limits';
import { getServerApiConfig } from '@/lib/server-api';
import Stripe from 'stripe';
import { stripe } from './stripe';

/**
 * Checks if user exceeds organization limit for a given plan.
 * Returns true if limit is exceeded, false otherwise.
 */
async function checkOrganizationLimitExceeded(
    userId: string,
    planName: string,
): Promise<boolean> {
    const limits = PLAN_LIMITS[planName];
    if (!limits) {
        return false; // Invalid plan, let it proceed
    }

    const organizationsCount = await db.organization.count({
        where: {
            ownerId: userId,
        },
    });

    return organizationsCount > limits.organizations;
}

/**
 * Handles plan upgrade/downgrade logic with organization limit enforcement.
 * For upgrades: applies immediately with credit deduction.
 * For downgrades: tracks pending downgrade (applied at period end).
 */
async function handlePlanChange(
    userSubscription: {
        id: string;
        planName: string | null;
        userId: string;
    },
    newPlanName: string,
    isImmediateUpgrade: boolean = false,
): Promise<{ success: boolean; requiresAction: boolean; message?: string }> {
    const oldPlanName = userSubscription.planName;

    // Check if this is a downgrade and if user exceeds new plan's organization limit
    if (oldPlanName && oldPlanName !== newPlanName && !isImmediateUpgrade) {
        const oldLimits = PLAN_LIMITS[oldPlanName];
        const newLimits = PLAN_LIMITS[newPlanName];

        if (
            oldLimits &&
            newLimits &&
            newLimits.organizations < oldLimits.organizations
        ) {
            // This is a downgrade - check organization limit
            const exceedsLimit = await checkOrganizationLimitExceeded(
                userSubscription.userId,
                newPlanName,
            );

            if (exceedsLimit) {
                // User exceeds new plan limit - don't apply the change
                return {
                    success: false,
                    requiresAction: true,
                    message: `Cannot downgrade: You have more organizations than the ${newPlanName} plan allows. Please delete organizations before downgrading.`,
                };
            }
        }
    }

    // For immediate upgrades, credit balance is already calculated in updateSubscription (stripe.ts)
    // However, if the webhook arrives before stripe.ts updates the DB, we need to calculate it here
    // We check if the planName has already been updated - if so, skip to avoid double-calculation
    if (isImmediateUpgrade && oldPlanName) {
        const updatedSubscription = await db.subscription.findUnique({
            where: { id: userSubscription.id },
        });

        if (!updatedSubscription) {
            throw new Error(`Subscription not found: ${userSubscription.id}`);
        }

        // Only calculate if planName hasn't been updated yet (webhook arrived before stripe.ts update)
        // If planName is already updated, stripe.ts already calculated the balance correctly
        if (updatedSubscription.planName === oldPlanName) {
            // Pass newPlanName explicitly since subscription.planName hasn't been updated yet
            await resetUsageLimit(
                updatedSubscription,
                oldPlanName,
                newPlanName,
            );
        }
        // Otherwise, skip - balance already calculated in stripe.ts
    }

    return { success: true, requiresAction: false };
}

export async function handleSubscriptionChange(
    stripeSubscription: Stripe.Subscription,
) {
    const customerId = stripeSubscription.customer as string;
    const subscriptionId = stripeSubscription.id;
    const status = stripeSubscription.status;
    const amount = stripeSubscription.items.data[0]?.plan?.amount;

    const periodEndUnix = stripeSubscription.items.data[0]?.current_period_end;
    const periodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000)
        : undefined;

    // First, find the user by their Stripe customer ID
    const subscription = await db.subscription.findUnique({
        where: {
            stripeCustomerId: customerId,
        },
    });

    if (!subscription) {
        const errorMessage = `User or subscription not found for Stripe customer: ${customerId}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    if (status === 'active') {
        const product = await stripe.products.retrieve(
            stripeSubscription.items.data[0]?.plan?.product as string,
        );

        const newPlanName = product.name;
        const oldPlanName = subscription.planName;

        // Check if this is a plan change
        const isPlanChange = oldPlanName && oldPlanName !== newPlanName;

        // Determine if this is an immediate upgrade (from our updateSubscription action)
        // If subscription schedule exists, this webhook is likely for a scheduled downgrade
        const hasScheduledDowngrade =
            !!subscription.stripeSubscriptionScheduleId;
        const isImmediateUpgrade =
            isPlanChange &&
            !hasScheduledDowngrade &&
            subscription.planName === oldPlanName;

        if (isPlanChange) {
            // Handle plan change with organization limit enforcement
            const result = await handlePlanChange(
                subscription,
                newPlanName,
                !!isImmediateUpgrade,
            );

            if (!result.success && result.requiresAction) {
                // Plan change blocked due to organization limit
                // Keep old plan name, mark as requires_action
                await db.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        stripeSubscriptionId: subscriptionId,
                        stripeProductId: product.id,
                        // Keep old planName - don't update to new plan
                        amount,
                        status: 'requires_action',
                    },
                });
                console.warn(
                    `Plan change blocked for user ${subscription.userId}: ${result.message}`,
                );
                return;
            }
        }

        // Update subscription with new plan details
        // For immediate upgrades, planName is already updated in updateSubscription
        // For scheduled downgrades, Stripe will update the subscription automatically
        // Check if this change came from a subscription schedule completion
        const isScheduleChange =
            hasScheduledDowngrade && isPlanChange && !isImmediateUpgrade;

        const updatedSubscription = await db.subscription.update({
            where: { id: subscription.id },
            data: {
                stripeSubscriptionId: subscriptionId,
                stripeProductId: product.id,
                planName: newPlanName,
                amount,
                status,
                // Set nextUsageReset from Stripe billing period when not an immediate upgrade
                // For immediate upgrades, keep existing reset date
                ...(!isImmediateUpgrade &&
                    periodEnd && {
                        nextUsageReset: periodEnd,
                    }),
                // Clear schedule ID if this was a schedule-triggered change
                ...(isScheduleChange && {
                    stripeSubscriptionScheduleId: null,
                }),
            },
        });

        // If this was a schedule-triggered downgrade, reset credits to new plan's limit
        if (isScheduleChange) {
            await resetUsage(updatedSubscription, periodEnd);
        }
    } else if (
        status === 'canceled' ||
        status === 'unpaid' ||
        status === 'past_due'
    ) {
        // Handle canceled/unpaid/past_due
        await db.subscription.update({
            where: { id: subscription.id },
            data: {
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                stripeProductId: null,
                planName: null,
                amount: null,
                status: status,
                creditBalance: 0,
                nextUsageReset: null,
            },
        });
    }
}

/**
 * Handles monthly usage reset when invoice payment succeeds.
 * This is called by the invoice.paid webhook.
 * Stripe handles downgrades automatically via subscription schedules.
 */
export async function handleResetUsageLimit(
    customerId: string,
    invoice?: Stripe.Invoice,
): Promise<void> {
    const subscription = await db.subscription.findUnique({
        where: {
            stripeCustomerId: customerId,
        },
    });

    if (!subscription) {
        // Initial subscribe (e.g. trial→paid): subscription is created when user
        // lands on checkout success URL. invoice.paid can arrive before that;
        // skip reset—checkout success handler will set up usage and nextUsageReset.
        return;
    }

    // Get period end from invoice if available, otherwise calculate from current date
    const periodEnd = invoice?.period_end
        ? new Date(invoice.period_end * 1000)
        : undefined;

    // Normal monthly reset
    // Downgrades are handled automatically by Stripe via subscription schedules
    await resetUsage(subscription, periodEnd);
}

/**
 * Handles subscription schedule events (completed, updated, released).
 * When a schedule completes, the downgrade has been applied by Stripe.
 */
export async function handleSubscriptionScheduleChange(
    schedule: Stripe.SubscriptionSchedule,
): Promise<void> {
    const subscriptionId = schedule.subscription as string;

    if (!subscriptionId) {
        console.error('No subscription ID found in schedule');
        return;
    }

    // Find subscription by Stripe subscription ID
    const subscription = await db.subscription.findFirst({
        where: {
            stripeSubscriptionId: subscriptionId,
        },
    });

    if (!subscription) {
        console.error(
            `Subscription not found for Stripe subscription: ${subscriptionId}`,
        );
        return;
    }

    // When schedule completes, the downgrade has been applied
    // The subscription.updated webhook will handle updating the plan name
    // We just need to clear the schedule ID
    if (schedule.status === 'completed' || schedule.status === 'released') {
        await db.subscription.update({
            where: { id: subscription.id },
            data: {
                stripeSubscriptionScheduleId: null,
            },
        });
    } else if (schedule.status === 'active') {
        // Update schedule ID if it changed
        await db.subscription.update({
            where: { id: subscription.id },
            data: {
                stripeSubscriptionScheduleId: schedule.id,
            },
        });
    }
}

export async function getStripePrices() {
    try {
        const { apiUrl, cookie } = await getServerApiConfig();
        const res = await fetch(`${apiUrl}/api/billing/stripe-prices`, {
            headers: { cookie },
            cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || data.error) {
            return [];
        }
        return (data.prices ?? []) as Array<{
            id: string;
            productName: string;
            productId: string;
            unitAmount: number | null;
            currency: string;
            interval: string | undefined;
        }>;
    } catch {
        return [];
    }
}
