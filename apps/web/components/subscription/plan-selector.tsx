'use client';

import { useState } from 'react';
import { PlanCard } from './plan-card';
import { createCheckoutSession } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface PlanSelectorProps {
    plans: {
        name: string;
        description: string;
        price: {
            monthly: {
                amount: number;
                stripePriceId: string;
            };
        };
        features: string[];
    }[];
    currentPlanId?: string;
    customerId?: string;
}

export function PlanSelector({
    plans,
    currentPlanId,
    customerId,
}: PlanSelectorProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSelectPlan = async (planId: string) => {
        if (planId === currentPlanId) {
            return;
        }

        try {
            setIsLoading(planId);
            const response = await createCheckoutSession(planId, customerId);

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
        <div className="flex flex-col gap-12">
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-4xl font-bold tracking-tight">
                    Choose your plan
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                    Select the plan that best fits your needs.
                </p>
            </motion.div>

            <motion.div
                className="grid gap-6 md:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            delayChildren: 0.6,
                            staggerChildren: 0.15,
                        },
                    },
                }}
            >
                {plans.map((plan) => {
                    const isPopular = plan.name === 'Growth';
                    const price = plan.price.monthly.amount;
                    const stripePriceId = plan.price.monthly.stripePriceId;
                    return (
                        <motion.div
                            key={plan.name}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { duration: 0.5 },
                                },
                            }}
                        >
                            <PlanCard
                                name={plan.name}
                                description={plan.description}
                                price={price / 100}
                                features={plan.features}
                                isPopular={isPopular}
                                isLoading={isLoading === stripePriceId}
                                onSelect={() => handleSelectPlan(stripePriceId)}
                                isYearly={false}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
