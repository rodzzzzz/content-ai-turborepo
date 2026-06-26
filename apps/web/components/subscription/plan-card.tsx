'use client';

import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanCardProps {
    name: string;
    description: string;
    price: number;
    features: string[];
    isPopular?: boolean;
    isLoading?: boolean;
    onSelect: () => void;
    isYearly?: boolean;
}

export function PlanCard({
    name,
    description,
    price,
    features,
    isPopular = false,
    isLoading = false,
    onSelect,
    isYearly = false,
}: PlanCardProps) {
    const monthlyPrice = isYearly ? Math.round(price / 12) : price;

    return (
        <Card
            className={cn(
                'relative flex h-full min-h-[350px] flex-col transition-all duration-200',
                isPopular && 'bg-primary text-primary-foreground shadow-lg',
            )}
        >
            {isPopular && (
                <div className="absolute -top-3 left-6">
                    <Badge className="bg-yellow-400 text-black hover:bg-yellow-300">
                        🔥 Most Popular
                    </Badge>
                </div>
            )}
            <CardHeader className="flex flex-col gap-2 pb-6 pt-8">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold leading-tight">
                        {name}
                    </h3>
                    <p
                        className={cn(
                            'text-sm text-muted-foreground',
                            isPopular && 'text-primary-foreground/60',
                        )}
                    >
                        {description}
                    </p>
                </div>
                <div>
                    <AnimatePresence initial={false}>
                        <div className="flex items-baseline">
                            <motion.span
                                key={`price-${isYearly ? 'yearly' : 'monthly'}`}
                                className="inline-block text-5xl font-extrabold"
                                initial={{
                                    opacity: 0,
                                    y: isYearly ? -20 : 20,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: isYearly ? -20 : 20,
                                }}
                                transition={{
                                    duration: 0.5,
                                    type: 'spring',
                                }}
                            >
                                ${monthlyPrice}
                            </motion.span>

                            <span
                                className={cn(
                                    'ml-1 text-lg font-semibold text-muted-foreground',
                                    isPopular && 'text-primary-foreground/60',
                                )}
                            >
                                /mo
                            </span>
                        </div>
                        {isYearly && (
                            <motion.div
                                key="yearly-billing-info"
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.3, type: 'tween' }}
                                className="mt-1 flex items-center gap-2"
                            >
                                <p
                                    className={cn(
                                        'text-sm text-muted-foreground',
                                        isPopular &&
                                            'text-primary-foreground/60',
                                    )}
                                >
                                    Billed annually
                                </p>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'px-1',
                                        isPopular && 'bg-secondary/80',
                                    )}
                                >
                                    2 months free
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li
                            key={`${name}-${index}`}
                            className="flex items-start gap-2"
                        >
                            <div
                                className={cn(
                                    'shrink-0 rounded bg-primary p-1 text-primary-foreground',
                                    isPopular &&
                                        'bg-primary-foreground text-primary',
                                )}
                            >
                                <Check className="h-3 w-3" />
                            </div>
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="pt-2">
                <Button
                    onClick={onSelect}
                    disabled={isLoading}
                    className={cn(
                        'w-full justify-center',
                        isPopular &&
                            'bg-primary-foreground text-primary hover:bg-primary-foreground/90',
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Choose Plan
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
