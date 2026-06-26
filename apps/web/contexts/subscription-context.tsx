'use client';

import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subscription } from '@prisma/client';
import { getSubscriptionData } from '@/actions/subscription';
import { PLAN_REDIRECT } from '@/routes';
import { useRouter, usePathname } from 'next/navigation';

interface UsageMetrics {
    credits: {
        used: number;
        total: number;
        monthly: number;
        purchased: number;
    };
    organizations: {
        used: number;
        total: number;
    };
}

interface SubscriptionContextType {
    subscription: Subscription | null;
    usageMetrics: UsageMetrics | null;
    isLoading: boolean;
    isRefetching: boolean;
    hasCredits: (minAmount?: number) => boolean;
    canCreateOrganization: () => boolean;
    availableCredits: number; // in dollars
    remainingOrganizations: number;
    subscriptionStatus: string | null;
    isPastDue: boolean;
    requiresAction: boolean;
    // Trial-related fields
    isTrial: boolean;
    trialEndDate: Date | null;
    daysRemainingInTrial: number | null;
    isTrialExpired: boolean;
    refetch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
    undefined,
);

export function SubscriptionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    // Use React Query to fetch subscription data
    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            const result = await getSubscriptionData();
            if ('error' in result) {
                throw new Error(result.error);
            }
            return result;
        },
        staleTime: 0, // Always refetch when invalidated
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchInterval: 10 * 60 * 1000, // Poll every 10 minutes to catch credit deductions
        retry: 1,
    });

    const subscription = data?.subscription ?? null;
    const usageMetrics = data?.usageMetrics ?? null;
    const trialInfo = data?.trialInfo ?? {
        isTrial: false,
        trialEndDate: null,
        trialStartDate: null,
        daysRemainingInTrial: null,
        isTrialExpired: false,
    };

    // Handle redirect for canceled subscriptions
    // Note: Middleware should also handle this, but this provides client-side redirect
    useEffect(() => {
        if (
            subscription?.status === 'canceled' &&
            pathname !== PLAN_REDIRECT
        ) {
            router.push(PLAN_REDIRECT);
        }
    }, [subscription?.status, pathname, router]);

    // Helper functions
    const hasCredits = (minAmount: number = 0): boolean => {
        if (!usageMetrics) return false;
        return usageMetrics.credits.total > minAmount;
    };

    const canCreateOrganization = (): boolean => {
        if (!usageMetrics) return false;
        return (
            usageMetrics.organizations.used < usageMetrics.organizations.total
        );
    };

    const availableCredits = usageMetrics?.credits.total ?? 0;
    const remainingOrganizations = usageMetrics
        ? Math.max(
              0,
              usageMetrics.organizations.total -
                  usageMetrics.organizations.used,
          )
        : 0;

    const subscriptionStatus = subscription?.status ?? null;
    const isPastDue =
        subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid';
    const requiresAction = subscriptionStatus === 'requires_action';

    return (
        <SubscriptionContext.Provider
            value={{
                subscription,
                usageMetrics,
                isLoading,
                isRefetching,
                hasCredits,
                canCreateOrganization,
                availableCredits,
                remainingOrganizations,
                subscriptionStatus,
                isPastDue,
                requiresAction,
                isTrial: trialInfo.isTrial,
                trialEndDate: trialInfo.trialEndDate,
                daysRemainingInTrial: trialInfo.daysRemainingInTrial,
                isTrialExpired: trialInfo.isTrialExpired,
                refetch,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);

    if (!context) {
        throw new Error(
            'useSubscription must be used within a SubscriptionProvider',
        );
    }

    return context;
}
