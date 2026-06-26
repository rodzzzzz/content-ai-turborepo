'use server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { TRIAL_CREDITS } from '@/constants/plan-limits';
import { addDays } from 'date-fns';

/**
 * Creates a trial subscription for a user after onboarding.
 * Creates a subscription record directly in the database without requiring Stripe.
 */
export async function createTrialSubscription() {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            return { error: 'Unauthorized' };
        }

        // Check if user already has a subscription
        const existingSubscription = await db.subscription.findUnique({
            where: { userId: user.id },
        });

        if (existingSubscription) {
            // User already has a subscription, don't create a new trial
            return { error: 'User already has a subscription' };
        }

        const now = new Date();

        // Create trial subscription directly in DB (no Stripe required)
        // Note: User already has trialEndDate set by default in schema (7 days from now)
        const subscription = await db.subscription.create({
            data: {
                userId: user.id,
                stripeCustomerId: null, // No Stripe customer for free trial
                planName: 'Trial',
                status: 'trialing',
                creditBalance: TRIAL_CREDITS,
                nextUsageReset: addDays(now, 30), // Set a future reset date (not used for trials)
            },
        });

        return { success: true, subscription };
    } catch (error) {
        console.error('Error creating trial subscription:', error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Failed to create trial subscription';
        return { error: errorMessage };
    }
}
