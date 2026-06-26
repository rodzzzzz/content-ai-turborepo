'use client';

import { createCustomerPortalSession, cancelDowngrade } from '@/actions/stripe';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Subscription } from '@prisma/client';
import { PlanExplorerDialog } from './plan-explorer-dialog';
import { format, toZonedTime } from 'date-fns-tz';
import { useSubscription } from '@/contexts/subscription-context';

interface Plan {
    name: string;
    description: string;
    price: {
        monthly: {
            amount: number;
            stripePriceId: string;
        };
    };
    features: string[];
}

interface SubscriptionManagerProps {
    userTimeZone: string;
    subscription: Subscription;
    plans: Plan[];
    currentPlanPriceId?: string;
    scheduleInfo?: {
        downgradeDate: Date | null;
        targetPlanName: string | null;
    } | null;
}

export default function SubscriptionManager({
    userTimeZone,
    subscription,
    plans,
    currentPlanPriceId,
    scheduleInfo,
}: SubscriptionManagerProps) {
    const { toast } = useToast();
    const { isTrial, daysRemainingInTrial, isLoading } = useSubscription();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isCancellingDowngrade, setIsCancellingDowngrade] = useState(false);
    const [planExplorerOpen, setPlanExplorerOpen] = useState(false);

    const handleManageSubscription = async () => {
        if (!subscription.stripeCustomerId) {
            toast({
                title: 'Error',
                description:
                    'You do not have a subscription. You can only change plan after you have a subscription.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsRedirecting(true);
            const response = await createCustomerPortalSession(
                subscription.stripeCustomerId,
                subscription.stripeProductId!,
            );

            if (response?.url) {
                window.open(response.url, '_blank');
                setIsRedirecting(false);
            }
        } catch (error) {
            console.error('Error creating customer portal session:', error);
            toast({
                title: 'Error',
                description:
                    'Failed to open customer portal. Please try again.',
                variant: 'destructive',
            });
            setIsRedirecting(false);
        }
    };

    const handleCancelDowngrade = async () => {
        try {
            setIsCancellingDowngrade(true);
            const result = await cancelDowngrade();

            if (result.success) {
                toast({
                    title: 'Success',
                    description:
                        result.message || 'Downgrade cancelled successfully',
                });
                // Refresh the page to update the UI
                window.location.reload();
            } else if (result.success === false) {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to cancel downgrade',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error cancelling downgrade:', error);
            toast({
                title: 'Error',
                description: 'Failed to cancel downgrade. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsCancellingDowngrade(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex flex-col justify-between gap-2 p-4 md:flex-row md:items-center">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-32 bg-muted" />
                        <Skeleton className="h-4 w-48 bg-muted" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-20 bg-muted" />
                        <Skeleton className="h-10 w-24 bg-muted" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const expirationMessage =
        daysRemainingInTrial === 0
            ? 'Your free trial expires today.'
            : daysRemainingInTrial === 1
              ? 'Your free trial expires tomorrow.'
              : `Your free trial expires in ${daysRemainingInTrial} days.`;

    return (
        <>
            <Card>
                <CardContent className="flex flex-col justify-between gap-2 p-4 md:flex-row md:items-center">
                    {isTrial ? (
                        <div className="flex flex-col">
                            <h3 className="font-semibold">Free Trial</h3>
                            <p className="text-sm text-muted-foreground">
                                {expirationMessage}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                    {subscription.planName} Plan
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {`$${(subscription.amount || 0) / 100}`}
                                    /month
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {`Includes $${(subscription.amount || 0) / 100} credits per month.`}
                            </p>
                            {scheduleInfo?.targetPlanName &&
                                scheduleInfo?.downgradeDate && (
                                    <span className="mb-2 mt-2 inline-flex flex-wrap items-center gap-1 text-xs text-destructive sm:mb-0">
                                        <p>
                                            {`Downgrading to ${scheduleInfo.targetPlanName}
                                    plan on ${format(
                                        toZonedTime(
                                            scheduleInfo.downgradeDate,
                                            userTimeZone,
                                        ),
                                        'MMMM d, yyyy',
                                    )}.`}
                                        </p>
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs"
                                            onClick={handleCancelDowngrade}
                                            disabled={isCancellingDowngrade}
                                        >
                                            {isCancellingDowngrade
                                                ? 'Cancelling...'
                                                : 'Cancel Downgrade'}
                                        </Button>
                                    </span>
                                )}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="w-fit"
                            onClick={handleManageSubscription}
                            disabled={isRedirecting || isTrial}
                        >
                            {isRedirecting ? 'Redirecting...' : 'Manage'}
                        </Button>
                        <Button
                            variant="default"
                            className="w-fit"
                            onClick={() => setPlanExplorerOpen(true)}
                        >
                            {isTrial ? 'Upgrade' : 'Change Plan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <PlanExplorerDialog
                open={planExplorerOpen}
                onOpenChange={setPlanExplorerOpen}
                plans={plans}
                currentPlanName={subscription.planName || undefined}
                currentPrice={subscription.amount || undefined}
                currentPriceId={currentPlanPriceId}
                customerId={subscription.stripeCustomerId}
                hasActiveSubscription={true}
                targetPlanName={scheduleInfo?.targetPlanName ?? undefined}
            />
        </>
    );
}
