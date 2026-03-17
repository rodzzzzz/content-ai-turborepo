import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
                positive:
                    'border-transparent bg-green-100 text-green-600 hover:bg-green-200',
                mid: 'border-transparent bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
                negative:
                    'border-transparent bg-red-100 text-red-600 hover:bg-red-200',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

const magicBadgeVariants = cva(
    'absolute -inset-0.5 rounded-md bg-magic opacity-50 blur',
    {
        variants: {
            variant: {
                default:
                    'transition-colors duration-300 group-hover:opacity-75',
                animated: 'animate-magic-shadow',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface MagicBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof magicBadgeVariants> { }

function MagicBadge({ className, variant, ...props }: MagicBadgeProps) {
    return (
        <div className="group relative">
            <div className={cn(magicBadgeVariants({ variant }), className)} />

            <div
                className="relative inline-flex items-center gap-2 rounded-md border-0 bg-white px-2.5 py-0.5 text-xs font-semibold transition-colors before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-magic before:p-px focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...props}
            />
        </div>
    );
}

export { Badge, badgeVariants, MagicBadge };
