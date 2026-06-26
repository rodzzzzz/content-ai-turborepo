'use client';

import { useState, useEffect } from 'react';
import { parseColor } from 'react-aria-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/textfield';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ColorPicker,
    ColorArea,
    ColorSlider,
    ColorField,
    ColorThumb,
    SliderTrack,
} from '@/components/ui/color';
import { Trash2 } from 'lucide-react';

interface ColorPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    colorName?: string; // For edit mode
    colorValue?: string; // For edit mode (hex string)
    existingColorNames?: string[]; // To prevent duplicates
    onSave: (name: string, value: string) => void;
    onDelete?: () => void; // For edit mode
    isPrimary?: boolean; // If true, don't allow rename/delete
}

export function ColorPickerDialog({
    open,
    onOpenChange,
    mode,
    colorName: initialColorName,
    colorValue: initialColorValue,
    existingColorNames = [],
    onSave,
    onDelete,
    isPrimary = false,
}: ColorPickerDialogProps) {
    const [colorName, setColorName] = useState(initialColorName || 'New Color');
    const [colorValue, setColorValue] = useState(
        parseColor(initialColorValue || '#f00'),
    );
    const [nameError, setNameError] = useState<string | null>(null);

    // Sync state when props change (e.g., when dialog opens with different values)
    useEffect(() => {
        if (open) {
            // Reset state when dialog opens
            if (initialColorName) {
                setColorName(initialColorName);
            } else {
                setColorName('New Color');
            }

            if (initialColorValue) {
                try {
                    setColorValue(parseColor(initialColorValue));
                } catch {
                    setColorValue(parseColor('#f00'));
                }
            } else {
                setColorValue(parseColor('#f00'));
            }

            setNameError(null);
        }
    }, [open, initialColorName, initialColorValue]);

    const validateName = (name: string): string | null => {
        if (isPrimary) {
            return null; // Primary color doesn't need name validation
        }

        if (!name || name.trim() === '') {
            return 'Color name is required';
        }

        const trimmedName = name.trim();
        if (mode === 'add' && existingColorNames.includes(trimmedName)) {
            return 'A color with this name already exists';
        }

        if (
            mode === 'edit' &&
            trimmedName !== initialColorName &&
            existingColorNames.includes(trimmedName)
        ) {
            return 'A color with this name already exists';
        }

        // Validate format: alphanumeric, spaces, dashes, underscores
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
            return 'Color name can only contain letters, numbers, spaces, dashes, and underscores';
        }

        if (trimmedName.toLowerCase() === 'primary') {
            return 'Color name cannot be "Primary"';
        }

        return null;
    };

    const handleSave = () => {
        const nameToUse = isPrimary ? 'primary' : colorName.trim();
        const error = validateName(nameToUse);

        if (error) {
            setNameError(error);
            return;
        }

        // Convert ColorValue to hex string
        const hexValue = colorValue.toString('hex');
        onSave(nameToUse, hexValue);
        onOpenChange(false);
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
                <DialogHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                    <div className="flex flex-col gap-1 text-left">
                        <DialogTitle>
                            {mode === 'add' ? 'Add Color' : 'Edit Color'}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === 'add'
                                ? 'Pick a color and give it a name'
                                : 'Update the color value or rename it'}
                        </DialogDescription>
                    </div>

                    {mode === 'edit' && !isPrimary && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </Button>
                    )}
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Color Name Input (hidden for primary) */}
                    {!isPrimary && (
                        <div className="space-y-2">
                            <Label htmlFor="color-name">Color Name</Label>
                            <Input
                                id="color-name"
                                placeholder="e.g., Secondary, Accent, Background"
                                value={colorName}
                                onChange={(e) => {
                                    setColorName(e.target.value);
                                    setNameError(null);
                                }}
                                onBlur={() => {
                                    const error = validateName(colorName);
                                    setNameError(error);
                                }}
                            />
                            {nameError && (
                                <p className="text-xs text-destructive">
                                    {nameError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Color Picker */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4">
                            <ColorPicker
                                value={colorValue}
                                onChange={setColorValue}
                            >
                                <div className="flex flex-col items-center">
                                    <ColorArea
                                        colorSpace="hsb"
                                        xChannel="saturation"
                                        yChannel="brightness"
                                        className="h-[164px] w-full rounded-b-none border-b-0"
                                    >
                                        <ColorThumb className="z-50" />
                                    </ColorArea>
                                    <ColorSlider
                                        colorSpace="hsb"
                                        channel="hue"
                                        className="w-full"
                                    >
                                        <SliderTrack className="w-full rounded-t-none border-t-0">
                                            <ColorThumb className="top-1/2" />
                                        </SliderTrack>
                                    </ColorSlider>
                                </div>
                                <ColorField colorSpace="hsb" className="w-full">
                                    <Label>Hex</Label>
                                    <Input autoFocus className="" />
                                </ColorField>
                            </ColorPicker>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:space-x-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        {mode === 'add' ? 'Add Color' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
