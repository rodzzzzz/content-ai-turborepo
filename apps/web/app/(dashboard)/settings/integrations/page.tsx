'use client';

import { Card, CardContent } from '@/components/ui/card';
import type React from 'react';
import { ConnectionButton } from '@/components/integration/connection-button';
import { StatusBadge } from '@/components/integration/status-badge';
import { ReconnectButton } from '@/components/integration/reconnect-button';
import { useIntegrations } from '@/contexts/integration-context';

import Image from 'next/image';
import DashboardShell from '@/components/dashboard-shell';
import { Provider, providers } from '@/constants/providers';
import { startTransition, useEffect, useRef, useState } from 'react';
import { getIntegratedAccounts } from '@/actions/integration';

export default function IntegrationsPage() {
    const wasCalled = useRef(false);
    const { statuses, connect, disconnect, setStatuses } =
        useIntegrations();
    const [loadingIntegratedAccounts, setLoadingIntegratedAccounts] =
        useState(true);

    useEffect(() => {
        if (wasCalled.current) return;
        wasCalled.current = true;

        startTransition(() => {
            getIntegratedAccounts().then((data) => {
                setLoadingIntegratedAccounts(false);
                if (data?.error) {
                    // setError(data.error);
                }

                if (data?.success) {
                    const updatedStatuses = { ...statuses };
                    data.integratedAccounts.forEach((account) => {
                        updatedStatuses[
                            account.provider as Provider['provider']
                        ] = {
                            isConnected: true,
                            isConnecting: false,
                            accountName: account.account_name || undefined,
                            accountType: account.account_type || undefined,
                            profilePicture:
                                account.profile_picture || undefined,
                            username: account.username || undefined,
                            isExpired: account.isExpired || false,
                            isExpiringSoon: account.isExpiringSoon || false,
                            daysUntilExpiration:
                                account.daysUntilExpiration || null,
                        };
                    });
                    setStatuses(updatedStatuses);
                }
            });
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DashboardShell
            title="Social Media Integrations"
            description="Connect your social media accounts for seamless management and enhanced productivity."
        >
            <div className="flex flex-col gap-6">
                {providers.map((provider) => {
                    const status = statuses[provider.provider];

                    return (
                        <Card
                            key={provider.provider}
                            className={`group relative overflow-hidden transition-all ${
                                status.error ? 'border-destructive/50' : ''
                            }`}
                        >
                            <CardContent className="p-0 pt-6">
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-between px-6">
                                        <Image
                                            src={provider.icon}
                                            alt={provider.name}
                                            width={24}
                                            height={24}
                                        />

                                        <div className="flex items-center gap-2">
                                            {(status.isExpired ||
                                                status.isExpiringSoon) &&
                                                status.isConnected && (
                                                    <ReconnectButton
                                                        isReconnecting={
                                                            status.isConnecting ||
                                                            false
                                                        }
                                                        onReconnect={() =>
                                                            connect(
                                                                provider.provider,
                                                            )
                                                        }
                                                    />
                                                )}
                                            <ConnectionButton
                                                id={provider.provider}
                                                isConnected={status.isConnected}
                                                isConnecting={
                                                    status.isConnecting ||
                                                    loadingIntegratedAccounts
                                                }
                                                onConnect={() =>
                                                    connect(provider.provider)
                                                }
                                                onDisconnect={() =>
                                                    disconnect(
                                                        provider.provider,
                                                    )
                                                }
                                                accountName={status.accountName}
                                                accountType={status.accountType}
                                            />
                                        </div>
                                    </div>
                                    <div className="px-6">
                                        <h3 className="font-semibold tracking-tight">
                                            {provider.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {provider.description}
                                        </p>
                                    </div>
                                    <StatusBadge
                                        isConnected={status.isConnected}
                                        error={status.error}
                                        accountName={status.accountName}
                                        accountType={status.accountType}
                                        profilePicture={status.profilePicture}
                                        isExpired={status.isExpired}
                                        isExpiringSoon={status.isExpiringSoon}
                                        daysUntilExpiration={
                                            status.daysUntilExpiration
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </DashboardShell>
    );
}
