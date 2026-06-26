'use client';

import { useState } from 'react';
import { updateSubscription } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/subscription-context';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { PLAN_LIMITS } from '@/constants/plan-limits';
import { formatDollars } from '@/lib/utils';

interface PlanChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPlanName: string;
    newPlanName: string;
    newPriceId: string;
    currentPrice: number; // in cents
    newPrice: number; // in cents
}

export function PlanChangeDialog({
    open,
    onOpenChange,
    currentPlanName,
    newPlanName,
    newPriceId,
    currentPrice,
    newPrice,
}: PlanChangeDialogProps) {
    const { toast } = useToast();
    const { usageMetrics } = useSubscription();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isUpgrade = newPrice > currentPrice;
    const isDowngrade = newPrice < currentPrice;
    const currentLimits = PLAN_LIMITS[currentPlanName];
    const newLimits = PLAN_LIMITS[newPlanName];

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await updateSubscription(newPriceId);

            if (result.success === false) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            toast({
                title: 'Success',
                description:
                    result.message || 'Subscription updated successfully',
            });

            // Close dialog first
            onOpenChange(false);

            // Force a hard refresh to ensure all data is updated, including webhook changes
            // Wait a brief moment for the dialog to close before refreshing
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to update subscription';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Check organization limit warning for downgrades
    const orgLimitWarning =
        isDowngrade &&
        usageMetrics &&
        usageMetrics.organizations.used > (newLimits?.organizations || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-full w-full sm:h-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isUpgrade
                            ? 'Upgrade'
                            : isDowngrade
                              ? 'Downgrade'
                              : 'Change'}{' '}
                        Plan
                    </DialogTitle>
                    <DialogDescription>
                        Confirm your plan change from {currentPlanName} to{' '}
                        {newPlanName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Plan Comparison */}
                    <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Current Plan
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {currentPlanName}
                            </p>
                            <p className="mt-1 text-sm">
                                {formatDollars(currentPrice / 100)}/month
                            </p>
                            {currentLimits && (
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                    <p>
                                        {formatDollars(
                                            currentLimits.credits / 100,
                                        )}{' '}
                                        credits/month
                                    </p>
                                    <p>
                                        {currentLimits.organizations === 999
                                            ? 'Unlimited'
                                            : currentLimits.organizations}{' '}
                                        organization
                                        {currentLimits.organizations !== 1
                                            ? 's'
                                            : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                New Plan
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {newPlanName}
                            </p>
                            <p className="mt-1 text-sm">
                                {formatDollars(newPrice / 100)}/month
                            </p>
                            {newLimits && (
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                    <p>
                                        {formatDollars(newLimits.credits / 100)}{' '}
                                        credits/month
                                    </p>
                                    <p>
                                        {newLimits.organizations === 999
                                            ? 'Unlimited'
                                            : newLimits.organizations}{' '}
                                        organization
                                        {newLimits.organizations !== 1
                                            ? 's'
                                            : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upgrade/Downgrade Info */}
                    {isUpgrade && (
                        <Alert variant="secondary">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                Your plan will upgrade immediately. Used credits
                                from your current plan will be deducted from
                                your new plan&apos;s monthly credits.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isDowngrade && !orgLimitWarning && (
                        <Alert variant="secondary">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                Your plan will downgrade at the end of your
                                current billing period. You&apos;ll continue to
                                have access to your current plan until then.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Organization Limit Warning */}
                    {orgLimitWarning && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-medium">Cannot downgrade</p>
                                <p className="mt-1 text-sm">
                                    You have {usageMetrics.organizations.used}{' '}
                                    organization
                                    {usageMetrics.organizations.used !== 1
                                        ? 's'
                                        : ''}
                                    , but the {newPlanName} plan allows only{' '}
                                    {newLimits?.organizations}. Please delete{' '}
                                    {usageMetrics.organizations.used -
                                        (newLimits?.organizations || 0)}{' '}
                                    organization
                                    {usageMetrics.organizations.used -
                                        (newLimits?.organizations || 0) !==
                                    1
                                        ? 's'
                                        : ''}{' '}
                                    before downgrading.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !!orgLimitWarning}
                    >
                        {isLoading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {isLoading
                            ? 'Updating...'
                            : isUpgrade
                              ? 'Upgrade Plan'
                              : isDowngrade
                                ? 'Downgrade Plan'
                                : 'Change Plan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
