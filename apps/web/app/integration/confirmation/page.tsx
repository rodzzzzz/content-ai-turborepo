'use client';

import { Provider } from '@/constants/providers';
import { useSearchParams } from 'next/navigation';
import { CircleCheck, Loader2, TriangleAlert } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccountSelector } from '@/components/integration/account-selector';
import { Account, IntegrationUserData } from '@/types/integration';

const IntegrationConfirmationPage = () => {
    const wasCalled = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const [userData, setUserData] = useState<IntegrationUserData | null>(null);
    const [accessToken, setAccessToken] = useState<string>('');
    const [provider, setProvider] = useState<Provider['provider'] | ''>('');

    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    const sendAuthRequest = useCallback(
        async (code: string | null, provider: Provider['provider']) => {
            try {
                setIsLoading(true);

                const response = await fetch(`/api/integration/${provider}`, {
                    method: 'POST',
                    body: JSON.stringify({ code }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    let message =
                        'Something went wrong. Please try again later.';

                    if (response.status === 409) {
                        message = data.error;
                    }

                    window.opener?.postMessage(
                        JSON.stringify({
                            type: 'integration-error',
                            message,
                        }),
                        '*',
                    );
                    setHasError(true);
                    setIsLoading(false);
                    return;
                }

                // Store user data and access token for account selection
                setUserData(data);
                setAccessToken(data.access_token);
                setShowAccountSelector(true);
                setIsLoading(false);
                return;
            } catch (err) {
                console.error('Error sending auth request', err);
                window.opener?.postMessage(
                    JSON.stringify({
                        type: 'integration-error',
                        message:
                            'Something went wrong. Please try again later.',
                    }),
                    '*',
                );
                setIsLoading(false);
                setHasError(true);
            }
        },
        [],
    );

    const handleAccountSelection = async (selectedAccount: Account) => {
        try {
            setIsLoading(true);

            // Create integration with selected account
            const response = await fetch(
                `/api/integration/${provider}/complete`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        userData,
                        accessToken,
                        selectedAccount,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to complete integration');
            }

            window.opener?.postMessage(
                JSON.stringify({
                    type: 'integration-success',
                    accountName: selectedAccount.name,
                    accountType: selectedAccount.type,
                    profilePicture:
                        data.integration?.profile_picture ||
                        selectedAccount.picture,
                    username: selectedAccount.username,
                    integrationId: data.integration?.id, // Pass integration ID for analytics
                    isNewIntegration: data.isNewIntegration ?? true, // Default to true for backward compatibility
                }),
                '*',
            );

            setIsLoading(false);
            sessionStorage.removeItem('integration-provider');
            return;
        } catch (err) {
            console.error('Error completing integration:', err);
            window.opener?.postMessage(
                JSON.stringify({
                    type: 'integration-error',
                    message:
                        'Failed to complete integration. Please try again.',
                }),
                '*',
            );
            setIsLoading(false);
            setHasError(true);
        }
    };

    const handleCancel = () => {
        window.opener?.postMessage(
            JSON.stringify({
                type: 'integration-cancelled',
                message: 'Integration was cancelled.',
            }),
            '*',
        );
        window.close();
    };

    useEffect(() => {
        if (wasCalled.current) return;
        wasCalled.current = true;

        const currentProvider = sessionStorage.getItem(
            'integration-provider',
        ) as Provider['provider'];

        setProvider(currentProvider);
        sendAuthRequest(code, currentProvider);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sendAuthRequest]);

    const Message = () => {
        return (
            <>
                {hasError ? (
                    <div className="space-y-1 text-center">
                        <TriangleAlert className="mx-auto h-10 w-10 text-red-500 md:h-16 md:w-16" />
                        <h1 className="mt-2 text-2xl font-bold">
                            Integration Failed
                        </h1>
                        <p className="max-w-[45ch] text-sm text-muted-foreground">
                            Oops! Something went wrong. Please try again later.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1 text-center">
                        <CircleCheck className="mx-auto h-10 w-10 text-green-500 md:h-16 md:w-16" />
                        <h1 className="mt-2 text-2xl font-bold">
                            Integration Successful
                        </h1>
                        <p className="max-w-[45ch] text-sm text-muted-foreground">
                            You have successfully integrated your account.
                        </p>
                    </div>
                )}
            </>
        );
    };

    if (showAccountSelector && userData && accessToken) {
        return (
            <main className="flex h-screen w-full flex-col items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <AccountSelector
                        provider={provider}
                        accessToken={accessToken}
                        userData={userData}
                        onSelect={handleAccountSelection}
                        onCancel={handleCancel}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="flex h-screen w-full flex-col items-center justify-center">
            {isLoading ? (
                <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
                <Message />
            )}
        </main>
    );
};

export default IntegrationConfirmationPage;
