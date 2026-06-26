'use client';

import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ColorPalettePreview } from './color-palette-preview';
import {
    fontCategoryEnum,
    type BrandingProfile,
} from '@/lib/validations/brand-kit';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getFontFamily } from '@/constants/font-categories';
import Image from 'next/image';

interface BrandKitAssetSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    extractedData: BrandingProfile;
    onImport: (selectedData: Partial<BrandingProfile>) => void;
}

type AssetCategory = 'colors' | 'fonts' | 'logo' | 'icon';

export function BrandKitAssetSelector({
    open,
    onOpenChange,
    extractedData,
    onImport,
}: BrandKitAssetSelectorProps) {
    const [selectedCategories, setSelectedCategories] = useState<
        Set<AssetCategory>
    >(new Set());

    const availableAssets = useMemo(() => {
        const additionalColors = extractedData.additionalColors as
            | Record<string, string>
            | undefined;
        const hasColors =
            !!extractedData.primaryColor ||
            (additionalColors && Object.keys(additionalColors).length > 0);

        const assets: Record<AssetCategory, boolean> = {
            colors: !!hasColors,
            fonts: !!extractedData.font,
            logo: !!(extractedData.logo && extractedData.logo.trim() !== ''),
            icon: !!(extractedData.icon && extractedData.icon.trim() !== ''),
        };
        return assets;
    }, [extractedData]);

    const toggleCategory = (category: AssetCategory) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const selectAll = () => {
        const allAvailable = Object.entries(availableAssets)
            .filter((entry) => entry[1])
            .map(([category]) => category as AssetCategory);
        setSelectedCategories(new Set(allAvailable));
    };

    const deselectAll = () => {
        setSelectedCategories(new Set());
    };

    const handleImport = () => {
        const selectedData: Partial<BrandingProfile> = {};

        if (selectedCategories.has('colors')) {
            selectedData.primaryColor = extractedData.primaryColor;
            selectedData.additionalColors = extractedData.additionalColors;
        }

        if (selectedCategories.has('fonts')) {
            selectedData.font = extractedData.font;
        }

        if (selectedCategories.has('logo')) {
            selectedData.logo = extractedData.logo;
        }

        if (selectedCategories.has('icon')) {
            selectedData.icon = extractedData.icon;
        }

        onImport(selectedData);
        onOpenChange(false);
        setSelectedCategories(new Set());
    };

    const hasSelection = selectedCategories.size > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Select Assets to Import</DialogTitle>
                    <DialogDescription>
                        Choose which brand elements you want to import.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAll}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deselectAll}
                                >
                                    Deselect All
                                </Button>
                            </div>
                            {hasSelection && (
                                <Badge variant="secondary">
                                    {selectedCategories.size} selected
                                </Badge>
                            )}
                        </div>

                        {availableAssets.colors && (
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Checkbox
                                    id="colors"
                                    checked={selectedCategories.has('colors')}
                                    onCheckedChange={() =>
                                        toggleCategory('colors')
                                    }
                                />
                                <div className="flex flex-1 flex-col gap-4">
                                    <Label
                                        htmlFor="colors"
                                        className="cursor-pointer font-medium"
                                    >
                                        Colors
                                    </Label>
                                    <ColorPalettePreview
                                        className="lg:grid-cols-3"
                                        colors={{
                                            ...(extractedData.primaryColor
                                                ? {
                                                      Primary:
                                                          extractedData.primaryColor,
                                                  }
                                                : {}),
                                            ...((extractedData.additionalColors as Record<
                                                string,
                                                string
                                            >) || {}),
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {availableAssets.fonts && (
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Checkbox
                                    id="fonts"
                                    checked={selectedCategories.has('fonts')}
                                    onCheckedChange={() =>
                                        toggleCategory('fonts')
                                    }
                                />
                                <div className="flex flex-1 flex-col gap-4">
                                    <Label
                                        htmlFor="fonts"
                                        className="cursor-pointer font-medium"
                                    >
                                        Font
                                    </Label>
                                    {extractedData.font && (
                                        <div
                                            className={cn(
                                                'flex h-24 w-full flex-col items-center justify-center sm:h-32',
                                            )}
                                            style={{
                                                fontFamily: getFontFamily(
                                                    extractedData.font,
                                                ),
                                            }}
                                        >
                                            <h4 className="mb-1 text-4xl font-medium">
                                                Aa
                                            </h4>
                                            <p className="text-xs capitalize text-muted-foreground">
                                                {fontCategoryEnum.options.find(
                                                    (category) =>
                                                        category ===
                                                        extractedData.font,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {availableAssets.logo && (
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Checkbox
                                    id="logo"
                                    checked={selectedCategories.has('logo')}
                                    onCheckedChange={() =>
                                        toggleCategory('logo')
                                    }
                                />
                                <div className="flex flex-1 flex-col gap-4">
                                    <Label
                                        htmlFor="logo"
                                        className="cursor-pointer font-medium"
                                    >
                                        Logo
                                    </Label>
                                    <div className="relative flex items-center justify-center overflow-hidden p-4">
                                        <Image
                                            src={extractedData.logo!}
                                            alt="Logo"
                                            width={200}
                                            height={200}
                                            className="max-h-32 w-auto object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {availableAssets.icon && (
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Checkbox
                                    id="icon"
                                    checked={selectedCategories.has('icon')}
                                    onCheckedChange={() =>
                                        toggleCategory('icon')
                                    }
                                />
                                <div className="flex flex-1 flex-col gap-4">
                                    <Label
                                        htmlFor="icon"
                                        className="cursor-pointer font-medium"
                                    >
                                        Icon
                                    </Label>
                                    <div className="relative flex items-center justify-center overflow-hidden p-4">
                                        <Image
                                            src={extractedData.icon!}
                                            alt="Icon"
                                            width={64}
                                            height={64}
                                            className="h-16 w-16 object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!hasSelection && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Select at least one asset category to import
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!hasSelection}>
                        <Check className="h-4 w-4" />
                        Import Selected ({selectedCategories.size})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
