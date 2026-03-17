import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        'outline-destructive':
          'border border-destructive text-destructive bg-background shadow-xs hover:bg-destructive/10 hover:text-destructive',
      },
      size: {
        default: 'h-9 px-4 py-2',
        xs: 'py-1 rounded px-2 text-xs gap-1',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-xs': 'p-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

const magicButtonShadowVariants = cva(
  'absolute -inset-0.5 rounded-md opacity-50 blur',
  {
    variants: {
      shadowVariant: {
        default:
          'bg-magic transition-colors duration-300 group-hover:opacity-60',
        animated: ' bg-magic animate-magic-shadow',
        outline: '[background-image:none]',
      },
    },
    defaultVariants: {
      shadowVariant: 'default',
    },
  },
);

const magicButtonVariants = cva('rounded-md bg-white', {
  variants: {
    variant: {
      default:
        'before:bg-magic before:absolute before:inset-0 before:-z-10 before:rounded-md before:p-[1px]',
      primary: 'bg-primary text-primary-foreground',
      outline:
        'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
    },
    size: {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9',
      'icon-sm': 'h-8 w-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface MagicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof magicButtonVariants>,
  VariantProps<typeof magicButtonShadowVariants> {
  asChild?: boolean;
}

const MagicButton = React.forwardRef<HTMLButtonElement, MagicButtonProps>(
  (
    {
      className,
      shadowVariant,
      variant,
      size,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'group relative focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none',
          shadowVariant !== 'animated' && 'disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      >
        <div className={magicButtonShadowVariants({ shadowVariant })} />
        <div
          className={cn(
            magicButtonVariants({ variant, size }),
            'relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          )}
        >
          {children}
        </div>
      </Comp>
    );
  },
);
MagicButton.displayName = 'MagicButton';

export { Button, buttonVariants, MagicButton, magicButtonVariants };
