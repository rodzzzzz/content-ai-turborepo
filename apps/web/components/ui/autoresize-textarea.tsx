'use client';

import { cn } from '@/lib/utils';
import React, {
    useRef,
    useEffect,
    type TextareaHTMLAttributes,
    forwardRef,
} from 'react';

interface AutoResizeTextareaProps
    extends Omit<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        'value' | 'onChange'
    > {
    value: string;
    onChange: (value: string) => void;
}

export const AutoResizeTextarea = forwardRef<
    HTMLTextAreaElement,
    AutoResizeTextareaProps
>(({ className, value, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef =
        (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const resizeTextarea = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        resizeTextarea();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <textarea
            {...props}
            value={value}
            ref={textareaRef}
            rows={1}
            onChange={(e) => {
                onChange(e.target.value);
                resizeTextarea();
            }}
            className={cn('max-h-48 min-h-4 resize-none', className)}
        />
    );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
