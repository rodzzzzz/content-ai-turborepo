'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Settings2Icon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

export type ImageSize = 'square' | 'landscape' | 'portrait';

export interface ImagePreferencesType {
    size: ImageSize;
}

interface ImagePreferencesProps {
    preferences: ImagePreferencesType;
    onPreferencesChange: (preferences: ImagePreferencesType) => void;
    disabled?: boolean;
}

const SIZE_OPTIONS = [
    { value: 'square', label: 'Square (1024×1024)' },
    { value: 'landscape', label: 'Landscape (1536×1024)' },
    { value: 'portrait', label: 'Portrait (1024×1536)' },
] as const;

export function ImagePreferences({
    preferences,
    onPreferencesChange,
    disabled = false,
}: ImagePreferencesProps) {
    const handleSizeChange = (size: ImageSize) => {
        onPreferencesChange({ ...preferences, size });
    };

    const getSizeLabel = (size: ImageSize) => {
        return (
            SIZE_OPTIONS.find((option) => option.value === size)?.label ||
            'Square (1024×1024)'
        );
    };

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            className="flex items-center gap-1 py-1 pl-2 pr-1"
                        >
                            <Settings2Icon className="hidden h-4 w-4 md:block" />
                            <Separator
                                orientation="vertical"
                                className="mx-1 hidden md:block"
                            />

                            <Badge
                                variant="secondary"
                                className="rounded border border-dashed border-muted-foreground px-1"
                            >
                                {getSizeLabel(preferences.size)}
                            </Badge>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Image preferences</p>
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-72 p-4" align="end">
                <div className="space-y-4">
                    <h3 className="font-medium">Image preferences</h3>
                    <Separator />

                    <div className="space-y-2">
                        <label className="text-sm">Size</label>
                        <Select
                            value={preferences.size}
                            onValueChange={handleSizeChange}
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                                {SIZE_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
