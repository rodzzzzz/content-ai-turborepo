'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface ColorPalettePreviewProps {
    colors?: Record<string, string>;
    className?: string;
    onColorClick?: (colorName: string) => void;
}

export function ColorPalettePreview({
    colors,
    className,
    onColorClick,
}: ColorPalettePreviewProps) {
    const [copiedColor, setCopiedColor] = useState<string | null>(null);

    if (!colors) {
        return null;
    }

    const colorEntries = Object.entries(colors).filter(
        (entry) => entry[1] && typeof entry[1] === 'string',
    );

    if (colorEntries.length === 0) {
        return null;
    }

    const handleCopy = async (color: string, name: string) => {
        try {
            await navigator.clipboard.writeText(color);
            setCopiedColor(name);
            setTimeout(() => setCopiedColor(null), 2000);
        } catch (err) {
            console.error('Failed to copy color:', err);
        }
    };

    return (
        <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
            {colorEntries.map(([name, color]) => (
                <div
                    key={name}
                    className={cn(
                        'group relative overflow-hidden rounded-lg border transition-all',
                        onColorClick && 'cursor-pointer hover:border-primary',
                    )}
                    onClick={() => onColorClick?.(name)}
                >
                    <div
                        className="h-32 w-full"
                        style={{ backgroundColor: color }}
                    />
                    <div className="border-t bg-background p-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                    {name.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {color}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(color, name);
                                }}
                                title="Copy color code"
                            >
                                {copiedColor === name ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
