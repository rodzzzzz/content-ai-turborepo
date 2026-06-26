'use client';

import { useSubscription } from '@/contexts/subscription-context';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export function TrialExpirationBanner() {
    const { isTrial, trialEndDate, daysRemainingInTrial, isTrialExpired } =
        useSubscription();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    // Calculate if we should show the banner (3 days or less remaining)
    const shouldShowBanner = useMemo(() => {
        if (dismissed) return false;
        if (!isTrial || !trialEndDate) return false;
        if (isTrialExpired) return false;
        // Show banner when 3 days or less remaining
        return daysRemainingInTrial !== null && daysRemainingInTrial <= 3;
    }, [
        dismissed,
        isTrial,
        trialEndDate,
        isTrialExpired,
        daysRemainingInTrial,
    ]);

    if (!shouldShowBanner) {
        return null;
    }

    const isExpiringToday = daysRemainingInTrial === 0;

    const message =
        daysRemainingInTrial === 0
            ? 'Your free trial expires today.'
            : daysRemainingInTrial === 1
              ? 'Your free trial expires tomorrow.'
              : `Your free trial expires in ${daysRemainingInTrial} days.`;

    const handleGoToSubscription = () => {
        router.push('/subscription');
    };

    return (
        <div
            className={cn(
                'flex w-full items-center gap-2 p-3 md:rounded-t-md',
                isExpiringToday
                    ? 'border-red-300 bg-red-100'
                    : 'border-yellow-300 bg-yellow-100',
            )}
        >
            <div className="flex w-full flex-wrap items-center justify-center gap-x-2">
                <AlertTriangle
                    className={cn(
                        'h-4 w-4 shrink-0',
                        isExpiringToday ? 'text-red-600' : 'text-yellow-600',
                    )}
                />
                <p
                    className={cn(
                        'text-center text-sm',
                        isExpiringToday ? 'text-red-900' : 'text-yellow-900',
                    )}
                >
                    {message}
                </p>
                <Button
                    variant="link"
                    size="sm"
                    onClick={handleGoToSubscription}
                    className={cn(
                        'p-0 text-sm underline hover:opacity-80',
                        isExpiringToday ? 'text-red-900' : 'text-yellow-900',
                    )}
                >
                    Upgrade now.
                </Button>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'ml-auto h-6 w-6 shrink-0 hover:bg-transparent hover:opacity-70',
                    isExpiringToday ? 'text-red-900' : 'text-yellow-900',
                )}
                onClick={() => setDismissed(true)}
                aria-label="Dismiss banner"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
