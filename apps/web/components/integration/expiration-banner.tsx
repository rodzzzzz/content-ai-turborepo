'use client';

import { useIntegrations } from '@/contexts/integration-context';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { Provider } from '@/constants/providers';
import { getIntegratedAccounts } from '@/actions/integration';
import { startTransition } from 'react';
import { cn } from '@/lib/utils';

interface ExpiredIntegration {
    provider: Provider['provider'];
    accountName?: string;
    isExpired: boolean;
    daysUntilExpiration: number | null;
}

export function ExpirationBanner() {
    const { statuses, setStatuses } = useIntegrations();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);
    const wasCalled = useRef(false);

    // Load integration accounts with expiration data if not already loaded
    useEffect(() => {
        if (wasCalled.current) return;

        // Check if we have any connected accounts with expiration data
        const hasExpirationData = Object.values(statuses).some(
            (status) =>
                status.isConnected && status.hasOwnProperty('isExpired'),
        );

        // If no expiration data, fetch it
        if (!hasExpirationData) {
            wasCalled.current = true;
            startTransition(() => {
                getIntegratedAccounts().then((data) => {
                    if (data?.success) {
                        const updatedStatuses = { ...statuses };
                        data.integratedAccounts.forEach((account) => {
                            updatedStatuses[
                                account.provider as Provider['provider']
                            ] = {
                                ...updatedStatuses[
                                    account.provider as Provider['provider']
                                ],
                                isConnected: true,
                                isExpired: account.isExpired || false,
                                isExpiringSoon: account.isExpiringSoon || false,
                                daysUntilExpiration:
                                    account.daysUntilExpiration || null,
                                accountName: account.account_name || undefined,
                                accountType: account.account_type || undefined,
                                profilePicture:
                                    account.profile_picture || undefined,
                                username: account.username || undefined,
                            };
                        });
                        setStatuses(updatedStatuses);
                    }
                });
            });
        }
    }, [statuses, setStatuses]);

    // Find expired or expiring integrations
    const expiredIntegrations: ExpiredIntegration[] = Object.entries(statuses)
        .filter(([, status]) => {
            return (
                status.isConnected &&
                (status.isExpired || status.isExpiringSoon)
            );
        })
        .map(
            ([provider, status]): ExpiredIntegration => ({
                provider: provider as Provider['provider'],
                accountName: status.accountName,
                isExpired: status.isExpired || false,
                daysUntilExpiration: status.daysUntilExpiration ?? null,
            }),
        );

    // Don't show banner if no expired/expiring integrations or dismissed
    if (dismissed || expiredIntegrations.length === 0) {
        return null;
    }

    // Sort: expired first, then by days until expiration
    expiredIntegrations.sort((a, b) => {
        if (a.isExpired && !b.isExpired) return -1;
        if (!a.isExpired && b.isExpired) return 1;
        const aDays = a.daysUntilExpiration ?? Infinity;
        const bDays = b.daysUntilExpiration ?? Infinity;
        return aDays - bDays;
    });

    const primaryIntegration = expiredIntegrations[0];
    const providerName =
        primaryIntegration.provider.charAt(0).toUpperCase() +
        primaryIntegration.provider.slice(1);

    // Determine banner styling and message
    const isExpired = primaryIntegration.isExpired;

    const message = isExpired
        ? `Connection to your ${providerName} account has expired.`
        : `Connection to your ${providerName} account expires in ${primaryIntegration.daysUntilExpiration} ${primaryIntegration.daysUntilExpiration === 1 ? 'day' : 'days'}.`;

    const handleGoToSettings = () => {
        router.push('/settings/integrations');
    };

    return (
        <div
            className={cn(
                'flex w-full items-center gap-2 p-3 md:rounded-t-md',
                isExpired
                    ? 'border-red-300 bg-red-100'
                    : 'border-yellow-300 bg-yellow-100',
            )}
        >
            <div className="flex w-full flex-wrap items-center justify-center gap-x-2">
                <AlertTriangle
                    className={cn(
                        'h-4 w-4 shrink-0',
                        isExpired ? 'text-red-600' : 'text-yellow-600',
                    )}
                />
                <p
                    className={cn(
                        'text-center text-sm',
                        isExpired ? 'text-red-900' : 'text-yellow-900',
                    )}
                >
                    {message}
                </p>
                <Button
                    variant="link"
                    size="sm"
                    onClick={handleGoToSettings}
                    className={cn(
                        'p-0 text-sm underline hover:opacity-80',
                        isExpired ? 'text-red-900' : 'text-yellow-900',
                    )}
                >
                    Reconnect now.
                </Button>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'ml-auto h-6 w-6 shrink-0 hover:bg-transparent hover:opacity-70',
                    isExpired ? 'text-red-900' : 'text-yellow-900',
                )}
                onClick={() => setDismissed(true)}
                aria-label="Dismiss banner"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
