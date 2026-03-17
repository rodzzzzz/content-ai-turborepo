import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const magicShadowVariants = cva(
    'absolute -inset-0.5 rounded-md bg-magic opacity-50 blur',
    {
        variants: {
            variant: {
                default: '',
                animated: 'animate-magic-shadow',
                'animated-sm': 'animate-magic-shadow-sm',
                none: '[background-image:none]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface MagicShadowProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof magicShadowVariants> {
    isFullWidth?: boolean;
}

function MagicShadow({
    className,
    variant,
    children,
    isFullWidth = false,
}: MagicShadowProps) {
    return (
        <div className={cn('group relative', isFullWidth && 'w-full')}>
            <div className={cn(magicShadowVariants({ variant }), className)} />

            {children}
        </div>
    );
}

export { MagicShadow, magicShadowVariants };
