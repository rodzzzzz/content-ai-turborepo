'use client';

import { useState } from 'react';
import { PlanChangeDialog } from './plan-change-dialog';
import { createCheckoutSession } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Check, Loader2 } from 'lucide-react';
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

interface PlanExplorerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plans: Plan[];
    currentPlanName?: string;
    currentPrice?: number; // in cents
    currentPriceId?: string;
    customerId: string | null;
    hasActiveSubscription?: boolean;
    targetPlanName?: string;
}

export function PlanExplorerDialog({
    open,
    onOpenChange,
    plans,
    currentPlanName,
    currentPrice,
    currentPriceId,
    customerId,
    hasActiveSubscription = false,
    targetPlanName,
}: PlanExplorerDialogProps) {
    const { toast } = useToast();
    const { isTrial } = useSubscription();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [planChangeDialog, setPlanChangeDialog] = useState<{
        open: boolean;
        newPlanName: string;
        newPriceId: string;
        newPrice: number;
    } | null>(null);

    // Find current plan index for default tab
    const currentPlanIndex = plans.findIndex((p) => p.name === currentPlanName);
    const defaultTab =
        currentPlanIndex >= 0 ? currentPlanIndex.toString() : '0';

    const handleSelectPlan = async (
        planId: string,
        planName: string,
        planPrice: number,
    ) => {
        if (planId === currentPriceId) {
            return;
        }

        // If user has active subscription and is not a trial, show change confirmation dialog
        if (
            !isTrial &&
            hasActiveSubscription &&
            currentPlanName &&
            currentPrice !== undefined
        ) {
            onOpenChange(false);

            setPlanChangeDialog({
                open: true,
                newPlanName: planName,
                newPriceId: planId,
                newPrice: planPrice,
            });
            return;
        }

        // Otherwise, create new checkout session
        try {
            setIsLoading(planId);
            const response = await createCheckoutSession(
                planId,
                customerId ?? undefined,
            );

            if (response?.url) {
                window.location.href = response.url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            toast({
                title: 'Error',
                description:
                    'Failed to create checkout session. Please try again.',
                variant: 'destructive',
            });
            setIsLoading(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange} modal>
                <DialogContent className="flex h-full w-full flex-col gap-6 sm:h-auto sm:max-w-xl">
                    <DialogHeader className="h-fit">
                        <DialogTitle>Explore More Plans</DialogTitle>
                        <DialogDescription>
                            {hasActiveSubscription && currentPlanName ? (
                                <>
                                    You are currently on the{' '}
                                    <span className="font-semibold">
                                        {currentPlanName}
                                    </span>{' '}
                                    plan. Upgrade or downgrade your plan for
                                    different credit limits and features.
                                </>
                            ) : (
                                'Choose a plan that best fits your needs. Upgrade or start a new plan for monthly credit limits.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="mb-4 grid w-full grid-cols-3">
                            {plans.map((plan, index) => (
                                <TabsTrigger
                                    key={plan.name}
                                    value={index.toString()}
                                    className="text-sm font-medium"
                                >
                                    {plan.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {plans.map((plan, index) => {
                            const price = plan.price.monthly.amount;
                            const stripePriceId =
                                plan.price.monthly.stripePriceId;
                            const isCurrentPlan =
                                hasActiveSubscription &&
                                plan.name === currentPlanName;
                            const isUpgrade =
                                hasActiveSubscription &&
                                currentPrice !== undefined &&
                                price > currentPrice;
                            const isDowngrade =
                                hasActiveSubscription &&
                                currentPrice !== undefined &&
                                price < currentPrice;

                            return (
                                <TabsContent
                                    key={plan.name}
                                    value={index.toString()}
                                    className="mt-0 rounded-md border p-4"
                                >
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                {plan.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {plan.description}
                                            </p>
                                            <div className="mt-4">
                                                <span className="text-4xl font-bold">
                                                    {`$${price / 100}`}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {' '}
                                                    /month
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {plan.features.map(
                                                (feature, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-start gap-3"
                                                    >
                                                        <div className="mt-0.5 shrink-0 rounded-full bg-primary p-1">
                                                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                                        </div>
                                                        <span className="text-sm leading-relaxed">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        <Button
                                            onClick={() =>
                                                handleSelectPlan(
                                                    stripePriceId,
                                                    plan.name,
                                                    price,
                                                )
                                            }
                                            disabled={
                                                isLoading === stripePriceId ||
                                                isCurrentPlan ||
                                                targetPlanName === plan.name
                                            }
                                            className="mt-4 w-full"
                                            size="lg"
                                        >
                                            {isLoading === stripePriceId && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            {isLoading === stripePriceId
                                                ? 'Processing...'
                                                : isCurrentPlan
                                                  ? 'Current Plan'
                                                  : hasActiveSubscription
                                                    ? isUpgrade
                                                        ? 'Upgrade Plan'
                                                        : isDowngrade
                                                          ? 'Downgrade Plan'
                                                          : 'Change Plan'
                                                    : 'Start Plan'}
                                        </Button>
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Plan Change Confirmation Dialog */}
            {planChangeDialog &&
                currentPlanName &&
                currentPrice !== undefined && (
                    <PlanChangeDialog
                        open={planChangeDialog.open}
                        onOpenChange={(open) => {
                            if (!open) {
                                setPlanChangeDialog(null);
                            }
                        }}
                        currentPlanName={currentPlanName}
                        newPlanName={planChangeDialog.newPlanName}
                        newPriceId={planChangeDialog.newPriceId}
                        currentPrice={currentPrice}
                        newPrice={planChangeDialog.newPrice}
                    />
                )}
        </>
    );
}
