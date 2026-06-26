'use client';

import CreditPurchaseDialog from './credit-purchase-dialog';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { useEffect } from 'react';
import { Subscription } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { addMonths, differenceInDays } from 'date-fns';
import { useSubscription } from '@/contexts/subscription-context';
import { useSearchParams } from 'next/navigation';
import { formatDollars } from '@/lib/utils';
import { TRIAL_CREDITS } from '@/constants/plan-limits';

interface CreditBalanceManagerProps {
    subscription: Subscription;
}

export default function CreditBalanceManager({
    subscription,
}: CreditBalanceManagerProps) {
    const { toast } = useToast();
    const {
        refetch: refetchSubscription,
        usageMetrics,
        isTrial,
        isLoading,
    } = useSubscription();
    const searchParams = useSearchParams();

    useEffect(() => {
        // const fetchUsageMetrics = async () => {
        //     try {
        //         const metrics = await getUsageMetrics(subscription.id);
        //         setUsageMetrics(metrics);
        //     } catch (error) {
        //         console.error('Error fetching usage metrics:', error);
        //         toast({
        //             title: 'Error',
        //             description: 'Failed to fetch usage metrics',
        //             variant: 'destructive',
        //         });
        //     }
        // };

        // fetchUsageMetrics();

        // Refetch subscription data if credits were successfully added
        if (searchParams.get('success') === 'credits_added') {
            refetchSubscription();
        }
    }, [subscription.id, toast, searchParams, refetchSubscription]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="animate-pulse">
                        <div className="mb-2 h-6 w-32 rounded bg-muted" />
                        <div className="mb-4 h-4 w-48 rounded bg-muted" />
                        <div className="h-32 rounded bg-muted" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const monthlyCredits = isTrial
        ? TRIAL_CREDITS / 100
        : (subscription.amount || 0) / 100;
    const nextUsageReset =
        subscription.nextUsageReset || addMonths(new Date(), 1);

    const daysUntilReset = differenceInDays(nextUsageReset, new Date());

    return (
        <Card>
            <CardContent className="flex flex-col justify-between gap-2 p-4 md:flex-row md:items-center">
                <div className="flex flex-col">
                    <h3 className="font-semibold">Credits Balance</h3>
                    {isTrial ? (
                        <p className="text-sm text-muted-foreground">
                            {`Free trial includes $${TRIAL_CREDITS / 100} credits.`}{' '}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {`Your monthly credits reset in ${daysUntilReset} days.`}
                        </p>
                    )}
                </div>
                <CreditPurchaseDialog />
            </CardContent>
            <Separator />
            {usageMetrics && (
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="relative flex aspect-[1.6/1] w-[16rem] items-center justify-center rounded-lg border-2 bg-gradient-to-tr from-black via-black/70 to-black p-4 text-white shadow-lg">
                            <h4 className="font-mono text-4xl">
                                {formatDollars(usageMetrics.credits.total)}
                            </h4>
                            <Image
                                src="logo-mark-white.svg"
                                alt="Content AI Logo Mark"
                                width={25}
                                height={25}
                                className="absolute right-4 top-4"
                            />
                        </div>
                        <div className="flex flex-1 flex-col gap-2 text-sm">
                            <div className="flex items-center justify-between gap-2 rounded p-2">
                                <p>Monthly Credits</p>
                                <p className="text-sm text-muted-foreground">
                                    {`${formatDollars(usageMetrics.credits.monthly)} / ${formatDollars(monthlyCredits)}`}
                                </p>
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded bg-muted p-2">
                                <p>Purchased Credits</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDollars(
                                        usageMetrics.credits.purchased,
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded p-2">
                                <p>Available Credits</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDollars(usageMetrics.credits.total)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
