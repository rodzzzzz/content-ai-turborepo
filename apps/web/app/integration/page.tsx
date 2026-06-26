'use client';

import { Button } from '@/components/ui/button';
import { Provider, providers } from '@/constants/providers';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export default function IntegrationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const provider = searchParams.get('provider') as Provider['provider'];
    const callbackUrl = searchParams.get('callbackUrl');

    if (!provider) {
        return <div>No provider found</div>;
    }

    // Store the provider in session storage for later use
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('integration-provider', provider);
    }

    const providerDetails = providers.find((p) => p.provider === provider);

    const urlBuilder = async (provider: Provider['provider']) => {
        try {
            const response = await fetch('/api/integration/oauth-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    callbackUrl:
                        callbackUrl ||
                        `${process.env.NEXT_PUBLIC_APP_URL}/integration/confirmation`,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate OAuth URL');
            }

            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('Error generating OAuth URL:', error);
            throw error;
        }
    };

    const onClick = async (provider: Provider['provider']) => {
        const url = await urlBuilder(provider);

        if (url) {
            router.push(url);
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold">
                    Connect your {providerDetails?.name} Account
                </h1>
                <p className="max-w-[45ch] text-sm text-muted-foreground">
                    Connect your {providerDetails?.name} account to start using
                    our integration and using it to login to your account.
                </p>
            </div>

            <Button variant="outline" onClick={() => onClick(provider)}>
                <Image
                    src={providerDetails!.icon}
                    alt={providerDetails!.name}
                    width={16}
                    height={16}
                />
                Connect {providerDetails?.name}
            </Button>
        </div>
    );
}
