'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getPasswordRequirements,
  getPasswordStrength,
  getPasswordStrengthLabel,
} from '@/lib/validations/password';
import { Progress } from '@/components/ui/progress';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

/**
 * Password strength indicator component that shows real-time validation feedback
 * and a visual strength meter
 */
export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const requirements = React.useMemo(
    () => getPasswordRequirements(password),
    [password],
  );
  const strength = React.useMemo(
    () => getPasswordStrength(password),
    [password],
  );
  const strengthLabel = React.useMemo(
    () => getPasswordStrengthLabel(password),
    [password],
  );

  // Don't show indicator if password is empty
  if (!password) {
    return null;
  }

  const strengthPercentage = (strength / 5) * 100;

  return (
    <div className={cn('space-y-2 pt-3', className)}>
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            Password strength
          </span>
          <span
            className={cn(
              'text-xs font-medium',
              strength <= 2
                ? 'text-red-500'
                : strength <= 3
                  ? 'text-yellow-500'
                  : 'text-green-500',
            )}
          >
            {strengthLabel.label}
          </span>
        </div>
        <Progress
          value={strengthPercentage}
          className={cn(
            'h-2',
            strength <= 2
              ? '[&>div]:bg-red-500'
              : strength <= 3
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-green-500',
          )}
        />
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Requirements:
        </p>
        <ul className="space-y-1.5" role="list">
          {requirements.map((requirement, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              {requirement.met ? (
                <Check
                  className="h-4 w-4 shrink-0 text-green-500"
                  aria-hidden="true"
                />
              ) : (
                <X
                  className="h-4 w-4 shrink-0 text-red-500"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  requirement.met
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground',
                )}
              >
                {requirement.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
