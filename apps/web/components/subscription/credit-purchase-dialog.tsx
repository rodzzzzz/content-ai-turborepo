'use client';

import { useState, useMemo } from 'react';
import { createCreditPurchaseSession } from '@/actions/credit-purchase';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/subscription-context';
import { Separator } from '../ui/separator';
import { formatDollars } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const CREDIT_OPTIONS = [
    { amount: 20, label: '$20', description: 'Perfect for small projects' },
    { amount: 50, label: '$50', description: 'Great for regular usage' },
    { amount: 100, label: '$100', description: 'Best value for power users' },
];

const MIN_AMOUNT = 5;
const MAX_AMOUNT = 500;

export default function CreditPurchaseDialog() {
    const { toast } = useToast();
    const { usageMetrics, isTrial } = useSubscription();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(20);
    const [isCustomSelected, setIsCustomSelected] = useState(true);
    const [customAmount, setCustomAmount] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    // Calculate adjusted minimum based on negative balance
    const adjustedMinAmount = useMemo(() => {
        const monthlyBalance = usageMetrics?.credits.monthly ?? 0;
        if (monthlyBalance < 0) {
            // If balance is negative, adjust minimum to cover it
            // Round up the negative balance amount to the nearest dollar
            const negativeAmount = Math.abs(monthlyBalance);
            const roundedUpNegative = Math.ceil(negativeAmount);
            return MIN_AMOUNT + roundedUpNegative;
        }
        return MIN_AMOUNT;
    }, [usageMetrics?.credits.monthly]);

    const validateCustomAmount = (value: string): boolean => {
        if (!value.trim()) {
            setValidationError('Please enter an amount');
            return false;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setValidationError('Please enter a valid number');
            return false;
        }

        if (numValue < adjustedMinAmount) {
            const monthlyBalance = usageMetrics?.credits.monthly ?? 0;
            if (monthlyBalance < 0) {
                setValidationError(
                    `Minimum amount is ${formatDollars(adjustedMinAmount)} to cover your negative balance of ${formatDollars(Math.abs(monthlyBalance))}`,
                );
            } else {
                setValidationError(
                    `Minimum amount is ${formatDollars(adjustedMinAmount)}`,
                );
            }
            return false;
        }

        if (numValue > MAX_AMOUNT) {
            setValidationError(`Maximum amount is $${MAX_AMOUNT}`);
            return false;
        }

        setValidationError(null);
        return true;
    };

    const handleCustomAmountChange = (value: string) => {
        // Remove any non-numeric characters except decimal point
        const sanitized = value.replace(/[^\d.]/g, '');

        // Allow only one decimal point
        const parts = sanitized.split('.');
        const formatted =
            parts.length > 2
                ? parts[0] + '.' + parts.slice(1).join('')
                : sanitized;

        // Limit to 2 decimal places
        const decimalParts = formatted.split('.');
        const finalValue =
            decimalParts.length > 1 && decimalParts[1].length > 2
                ? decimalParts[0] + '.' + decimalParts[1].slice(0, 2)
                : formatted;

        setCustomAmount(finalValue);

        if (finalValue) {
            validateCustomAmount(finalValue);
        } else {
            setValidationError(null);
        }
    };

    const handleCustomInputFocus = () => {
        setIsCustomSelected(true);
        setSelectedAmount(0); // Use 0 as a marker for custom
    };

    const handleOptionSelect = (amount: number) => {
        setSelectedAmount(amount);
        setIsCustomSelected(false);
        setCustomAmount('');
        setValidationError(null);
    };

    const getPurchaseAmount = (): number | null => {
        if (isCustomSelected && customAmount) {
            const numValue = parseFloat(customAmount);
            if (validateCustomAmount(customAmount)) {
                return numValue;
            }
            return null;
        }
        return selectedAmount;
    };

    const getPurchaseButtonText = (): string => {
        if (isLoading) {
            return 'Redirecting...';
        }

        if (isCustomSelected && customAmount) {
            const numValue = parseFloat(customAmount);
            if (!isNaN(numValue)) {
                return `Purchase $${numValue.toFixed(2)}`;
            }
        }

        const option = CREDIT_OPTIONS.find(
            (opt) => opt.amount === selectedAmount,
        );
        return option ? `Purchase ${option.label}` : 'Purchase';
    };

    const handlePurchase = async () => {
        if (isTrial) {
            toast({
                title: 'Credit Purchase Unavailable',
                description:
                    'Credit purchases are not available during your trial period. Please wait until your trial ends.',
                variant: 'destructive',
            });
            return;
        }

        const amount = getPurchaseAmount();

        if (amount === null) {
            toast({
                title: 'Invalid Amount',
                description:
                    validationError || 'Please select or enter a valid amount',
                variant: 'destructive',
            });
            return;
        }

        // Validate preset amounts against adjusted minimum
        if (amount < adjustedMinAmount) {
            const monthlyBalance = usageMetrics?.credits.monthly ?? 0;
            const errorMessage =
                monthlyBalance < 0
                    ? `Minimum amount is ${formatDollars(adjustedMinAmount)} to cover your negative balance of ${formatDollars(Math.abs(monthlyBalance))}`
                    : `Minimum amount is ${formatDollars(adjustedMinAmount)}`;
            toast({
                title: 'Invalid Amount',
                description: errorMessage,
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await createCreditPurchaseSession(amount);

            if (response?.url) {
                window.location.href = response.url;
            }
        } catch (error) {
            console.error('Error creating credit purchase session:', error);
            toast({
                title: 'Error',
                description:
                    'Failed to create credit purchase session. Please try again.',
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state when dialog closes
            setSelectedAmount(20);
            setIsCustomSelected(false);
            setCustomAmount('');
            setValidationError(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-fit"
                                disabled={isLoading || isTrial}
                            >
                                Buy Credits
                            </Button>
                        </DialogTrigger>
                    </div>
                </TooltipTrigger>
                {isTrial && (
                    <TooltipContent side="left">
                        <p>
                            Buying credits is not available during your trial
                            period.
                        </p>
                    </TooltipContent>
                )}
            </Tooltip>
            <DialogContent className="h-full w-full sm:h-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Purchase Additional Credits</DialogTitle>
                    <DialogDescription>
                        Choose an amount to add to your account. Credits never
                        expire and can be used for any AI-powered features.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    <div
                        className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors ${
                            isCustomSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => {
                            setIsCustomSelected(true);
                            setSelectedAmount(0);
                        }}
                    >
                        <div className="flex-1">
                            <div className="font-semibold">Custom Amount</div>
                            <div className="text-sm text-muted-foreground">
                                {adjustedMinAmount > MIN_AMOUNT ? (
                                    <>
                                        Enter any amount between{' '}
                                        {formatDollars(adjustedMinAmount)} and{' '}
                                        {formatDollars(MAX_AMOUNT)}
                                    </>
                                ) : (
                                    <>
                                        Enter any amount between{' '}
                                        {formatDollars(MIN_AMOUNT)} and{' '}
                                        {formatDollars(MAX_AMOUNT)}
                                    </>
                                )}
                            </div>
                        </div>
                        <div
                            className={`h-4 w-4 rounded-full border-2 ${
                                isCustomSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                            }`}
                        >
                            {isCustomSelected && (
                                <div className="m-0.5 h-2 w-2 rounded-full bg-white" />
                            )}
                        </div>
                    </div>
                    {isCustomSelected && (
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={customAmount}
                                    autoFocus
                                    onChange={(e) =>
                                        handleCustomAmountChange(e.target.value)
                                    }
                                    onFocus={handleCustomInputFocus}
                                    placeholder="0.00"
                                    className={`py-6 pl-8 ${
                                        validationError
                                            ? 'border-destructive focus-visible:ring-destructive'
                                            : ''
                                    }`}
                                />
                            </div>
                            {validationError && (
                                <p className="text-sm text-destructive">
                                    {validationError}
                                </p>
                            )}
                        </div>
                    )}

                    <Separator className="my-2" />

                    {CREDIT_OPTIONS.map((option) => {
                        const isDisabled = option.amount < adjustedMinAmount;
                        return (
                            <div
                                key={option.amount}
                                className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                                    isDisabled
                                        ? 'cursor-not-allowed border-muted bg-muted/30 opacity-60'
                                        : selectedAmount === option.amount &&
                                            !isCustomSelected
                                          ? 'cursor-pointer border-primary bg-primary/5'
                                          : 'cursor-pointer border-border hover:bg-muted/50'
                                }`}
                                onClick={() => {
                                    if (!isDisabled) {
                                        handleOptionSelect(option.amount);
                                    }
                                }}
                            >
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {option.label}
                                        {isDisabled && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                (Minimum:{' '}
                                                {formatDollars(
                                                    adjustedMinAmount,
                                                )}
                                                )
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {option.description}
                                    </div>
                                </div>
                                <div
                                    className={`h-4 w-4 rounded-full border-2 ${
                                        selectedAmount === option.amount &&
                                        !isCustomSelected
                                            ? 'border-primary bg-primary'
                                            : 'border-muted-foreground'
                                    }`}
                                >
                                    {selectedAmount === option.amount &&
                                        !isCustomSelected && (
                                            <div className="m-0.5 h-2 w-2 rounded-full bg-white" />
                                        )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        disabled={
                            isLoading ||
                            isTrial ||
                            (isCustomSelected &&
                                (!customAmount || !!validationError))
                        }
                    >
                        {getPurchaseButtonText()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
