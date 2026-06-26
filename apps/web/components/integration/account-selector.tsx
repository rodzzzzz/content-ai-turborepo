'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Building2, Globe } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Account, IntegrationUserData } from '@/types/integration';

interface AccountSelectorProps {
    provider: string;
    accessToken: string;
    userData: IntegrationUserData;
    onSelect: (account: Account) => Promise<void>;
    onCancel: () => void;
}

export function AccountSelector({
    provider,
    accessToken,
    userData,
    onSelect,
    onCancel,
}: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/integration/accounts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        provider,
                        accessToken,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch accounts');
                }

                const data = await response.json();

                // For Twitter, the accounts route already returns the personal account
                // For other providers, add personal account to the list
                if (provider === 'twitter') {
                    setAccounts(data.accounts);
                    setSelectedAccount(data.accounts[0]?.id || '');
                } else {
                    setAccounts(data.accounts);
                    setSelectedAccount(data.accounts[0]?.id || ''); // Default to first account
                }
            } catch (err) {
                console.error('Error fetching accounts:', err);
                setError('Failed to load accounts. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccounts();
    }, [provider, accessToken, userData]);

    const handleContinue = async () => {
        const selected = accounts.find(
            (account) => account.id === selectedAccount,
        );
        if (selected) {
            setIsSubmitting(true);
            try {
                await onSelect(selected);
            } catch (error) {
                console.error('Error selecting account:', error);
                setIsSubmitting(false);
            }
        }
    };

    const getProviderIcon = () => {
        switch (provider) {
            case 'facebook':
                return '/facebook.svg';
            case 'twitter':
                return '/twitter.svg';
            case 'linkedin':
                return '/linkedin.svg';
            default:
                return '/globe.svg';
        }
    };

    const getAccountTypeIcon = (type: string) => {
        switch (type) {
            case 'personal':
                return <User className="h-4 w-4" />;
            case 'page':
                return <Building2 className="h-4 w-4" />;
            case 'company':
                return <Building2 className="h-4 w-4" />;
            default:
                return <Globe className="h-4 w-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="mb-4 text-destructive">{error}</p>
                <Button onClick={onCancel} variant="outline">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="relative space-y-6">
            {isSubmitting && (
                <div className="absolute -inset-3 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">
                            Connecting account...
                        </p>
                    </div>
                </div>
            )}
            <div className="text-center">
                <div className="mb-4 flex items-center justify-center">
                    <Image
                        src={getProviderIcon()}
                        alt={provider}
                        width={32}
                        height={32}
                        className="mr-3"
                    />
                    <h2 className="text-2xl font-bold capitalize">
                        Select {provider} Account
                    </h2>
                </div>
                <p className="text-muted-foreground">
                    Choose which account you want to connect to your workspace
                </p>
            </div>

            <RadioGroup
                value={selectedAccount}
                onValueChange={setSelectedAccount}
                className="max-h-[400px] space-y-1 overflow-y-auto"
            >
                {accounts.map((account) => (
                    <Card
                        key={account.id}
                        className={`cursor-pointer transition-all hover:border-primary ${
                            selectedAccount === account.id
                                ? 'border-primary bg-primary/5'
                                : ''
                        }`}
                        onClick={() => setSelectedAccount(account.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem
                                    value={account.id}
                                    id={account.id}
                                    className="sr-only"
                                />
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={account.picture}
                                        alt={account.name}
                                    />
                                    <AvatarFallback>
                                        {getAccountTypeIcon(account.type)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <Label
                                            htmlFor={account.id}
                                            className="cursor-pointer text-sm font-medium"
                                        >
                                            {account.name}
                                        </Label>
                                        <Badge
                                            variant="outline"
                                            className="ml-auto px-1 py-0.5 capitalize"
                                        >
                                            {account.type}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {account.type === 'personal'
                                            ? 'Your personal account'
                                            : account.type === 'page'
                                              ? 'Facebook page'
                                              : 'Company page'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </RadioGroup>

            <div className="flex justify-end space-x-3">
                <Button
                    onClick={onCancel}
                    variant="outline"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={!selectedAccount || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        'Continue'
                    )}
                </Button>
            </div>
        </div>
    );
}
