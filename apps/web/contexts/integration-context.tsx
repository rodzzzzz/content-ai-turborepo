'use client';

import type React from 'react';
import {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
    useEffect,
} from 'react';
import { Provider } from '@/constants/providers';
import {
    disconnectAccount,
    getIntegratedAccounts,
} from '@/actions/integration';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { updateUserSetup } from '@/actions/setup';

interface IntegrationStatus {
    isConnected: boolean;
    isConnecting: boolean;
    error?: string;
    accountName?: string;
    accountType?: string;
    profilePicture?: string;
    username?: string;
    isExpired?: boolean;
    isExpiringSoon?: boolean;
    daysUntilExpiration?: number | null;
}

interface IntegrationContextType {
    statuses: Record<Provider['provider'], IntegrationStatus>;
    setStatuses: React.Dispatch<
        React.SetStateAction<Record<string, IntegrationStatus>>
    >;
    connect: (platform: Provider['provider']) => Promise<void>;
    disconnect: (platform: Provider['provider']) => Promise<void>;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(
    undefined,
);

export function IntegrationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>(
        {
            facebook: {
                isConnected: false,
                isConnecting: false,
                accountName: undefined,
                accountType: undefined,
                profilePicture: undefined,
                username: undefined,
                isExpired: false,
                isExpiringSoon: false,
                daysUntilExpiration: null,
            },
            instagram: {
                isConnected: false,
                isConnecting: false,
                accountName: undefined,
                accountType: undefined,
                profilePicture: undefined,
                username: undefined,
                isExpired: false,
                isExpiringSoon: false,
                daysUntilExpiration: null,
            },
            linkedin: {
                isConnected: false,
                isConnecting: false,
                accountName: undefined,
                accountType: undefined,
                profilePicture: undefined,
                username: undefined,
                isExpired: false,
                isExpiringSoon: false,
                daysUntilExpiration: null,
            },
            twitter: {
                isConnected: false,
                isConnecting: false,
                accountName: undefined,
                accountType: undefined,
                profilePicture: undefined,
                username: undefined,
                isExpired: false,
                isExpiringSoon: false,
                daysUntilExpiration: null,
            },
            pinterest: {
                isConnected: false,
                isConnecting: false,
                accountName: undefined,
                accountType: undefined,
                profilePicture: undefined,
                username: undefined,
                isExpired: false,
                isExpiringSoon: false,
                daysUntilExpiration: null,
            },
        },
    );

    // Track processed integration IDs to prevent duplicate analytics requests
    const processedIntegrations = useRef<Set<string>>(new Set());
    const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(
        null,
    );

    // Memoized function to fetch analytics for an integration
    const fetchAnalyticsForIntegration = useCallback(
        async (integrationId: string) => {
            // Early return if we've already processed this integration
            if (processedIntegrations.current.has(integrationId)) {
                return;
            }

            // Mark this integration as being processed
            processedIntegrations.current.add(integrationId);

            try {
                // Show toast for analytics fetching
                toast({
                    title: 'Setting up your account',
                    description: 'Fetching your social media analytics...',
                });

                // Fetch initial analytics
                const analyticsResponse = await fetch(
                    '/api/integration/initial-analytics',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            integrationId,
                        }),
                    },
                );

                const analyticsData = await analyticsResponse.json();

                toast({
                    title: 'Setup complete!',
                    description: analyticsData.message,
                });
            } catch (error) {
                console.error('Error during setup process:', error);
                toast({
                    title: 'Setup partially complete',
                    description:
                        'Account connected successfully, but analytics could not be fetched.',
                    variant: 'destructive',
                });
            }
        },
        [],
    );

    // Cleanup event listeners on component unmount
    useEffect(() => {
        return () => {
            if (messageHandlerRef.current) {
                window.removeEventListener(
                    'message',
                    messageHandlerRef.current,
                );
                messageHandlerRef.current = null;
            }
        };
    }, []);

    const connect = async (provider: Provider['provider']) => {
        const hasOpenPopup = Object.values(statuses).some(
            (status) => status.isConnecting,
        );

        if (hasOpenPopup) {
            toast({
                title: 'Another connection is in progress',
                description:
                    'Please wait for the previous connection to complete. Or close the popup and try again.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setStatuses((prev) => ({
                ...prev,
                [provider]: {
                    ...prev[provider],
                    isConnecting: true,
                    error: undefined,
                },
            }));

            const popup = window.open(
                `${process.env.NEXT_PUBLIC_APP_URL}/integration?provider=${provider}`,
                '_blank',
                'width=700,height=800',
            );

            var timer = setInterval(function () {
                if (popup?.closed) {
                    clearInterval(timer);
                    setStatuses((prev) => ({
                        ...prev,
                        [provider]: {
                            ...prev[provider],
                            isConnecting: false,
                        },
                    }));
                }
            }, 1000);

            // Remove any existing message handler to prevent duplicates
            if (messageHandlerRef.current) {
                window.removeEventListener(
                    'message',
                    messageHandlerRef.current,
                );
            }

            const handleMessage = (event: MessageEvent) => {
                if (typeof event.data === 'string') {
                    const data = JSON.parse(event.data || '{}');

                    if (data.type === 'integration-success') {
                        setStatuses((prev) => ({
                            ...prev,
                            [provider]: {
                                ...prev[provider],
                                isConnected: true,
                                isConnecting: false,
                                accountName: data.accountName,
                                accountType: data.accountType,
                                profilePicture: data.profilePicture,
                                username: data.username,
                                isExpired: false,
                                isExpiringSoon: false,
                                daysUntilExpiration: null,
                            },
                        }));

                        toast({
                            title: 'Integration successful',
                            description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account connected successfully!`,
                        });

                        popup?.close();

                        // Update setup status only for new integrations
                        // isNewIntegration defaults to true for backward compatibility
                        const isNewIntegration =
                            data.isNewIntegration !== false;
                        if (isNewIntegration) {
                            updateUserSetup('integrations');
                        }

                        // Trigger analytics fetching only for new integrations (not reconnections)
                        if (data.integrationId && isNewIntegration) {
                            // Use setTimeout to make the async operations non-blocking
                            setTimeout(() => {
                                fetchAnalyticsForIntegration(
                                    data.integrationId,
                                );
                            }, 100); // Small delay to ensure UI updates first
                        }

                        // Clean up the event listener after successful integration
                        if (messageHandlerRef.current) {
                            window.removeEventListener(
                                'message',
                                messageHandlerRef.current,
                            );
                            messageHandlerRef.current = null;
                        }
                    }

                    if (data.type === 'integration-error') {
                        setStatuses((prev) => ({
                            ...prev,
                            [provider]: {
                                ...prev[provider],
                                isConnected: false,
                                isConnecting: false,
                                error: data.message,
                            },
                        }));

                        // Clean up the event listener after error
                        if (messageHandlerRef.current) {
                            window.removeEventListener(
                                'message',
                                messageHandlerRef.current,
                            );
                            messageHandlerRef.current = null;
                        }
                    }
                }
            };

            // Store the handler reference and add the event listener
            messageHandlerRef.current = handleMessage;
            window.addEventListener('message', handleMessage);
        } catch (error) {
            setStatuses((prev) => ({
                ...prev,
                [provider]: {
                    ...prev[provider],
                    isConnecting: false,
                    error: 'Failed to connect',
                },
            }));

            // Clean up the event listener on error
            if (messageHandlerRef.current) {
                window.removeEventListener(
                    'message',
                    messageHandlerRef.current,
                );
                messageHandlerRef.current = null;
            }
        }
    };

    const disconnect = async (provider: Provider['provider']) => {
        try {
            setStatuses((prev) => ({
                ...prev,
                [provider]: { ...prev[provider], isConnecting: true },
            }));

            const response = await disconnectAccount(provider);

            if (response.error) {
                setStatuses((prev) => ({
                    ...prev,
                    [provider]: {
                        ...prev[provider],
                        isConnecting: false,
                        error: response.error,
                    },
                }));

                toast({
                    title: 'Error disconnecting account',
                    description:
                        'Something went wrong. Please try again later.',
                    variant: 'destructive',
                });
                return;
            }

            setStatuses((prev) => ({
                ...prev,
                [provider]: {
                    ...prev[provider],
                    isConnected: false,
                    isConnecting: false,
                    accountName: undefined,
                    accountType: undefined,
                    profilePicture: undefined,
                    username: undefined,
                    isExpired: false,
                    isExpiringSoon: false,
                    daysUntilExpiration: null,
                },
            }));

            // Handle different success scenarios with appropriate messages
            if (response.warning) {
                toast({
                    title: 'Account disconnected',
                    description: response.warning,
                    variant: 'default',
                });
            } else {
                toast({
                    title: 'Account disconnected successfully',
                    description:
                        response.success || 'You can connect it again anytime',
                });
            }
        } catch (error) {
            setStatuses((prev) => ({
                ...prev,
                [provider]: {
                    ...prev[provider],
                    isConnecting: false,
                    error: 'Failed to disconnect',
                },
            }));

            toast({
                title: 'Error disconnecting account',
                description: 'Something went wrong. Please try again later.',
            });
        }
    };

    return (
        <IntegrationContext.Provider
            value={{ statuses, setStatuses, connect, disconnect }}
        >
            {children}
        </IntegrationContext.Provider>
    );
}

export const useIntegrations = () => {
    const context = useContext(IntegrationContext);
    if (context === undefined) {
        throw new Error(
            'useIntegrations must be used within an IntegrationProvider',
        );
    }
    return context;
};

export const useIntegratedAccounts = () => {
    return useQuery({
        queryKey: ['integratedAccounts'],
        queryFn: async () => {
            const result = await getIntegratedAccounts();

            if (result.error) {
                throw new Error(result.error);
            }

            if (
                !result.integratedAccounts ||
                result.integratedAccounts.length === 0
            ) {
                return [];
            }

            return result.integratedAccounts;
        },
    });
};
