'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ColorPalettePreview } from './color-palette-preview';
import { ColorPickerDialog } from './color-picker-dialog';
import {
    brandingProfileSchema,
    fontCategoryEnum,
    type BrandingProfile,
} from '@/lib/validations/brand-kit';
import { Loader2, Globe, Plus, X, ImageIcon, Palette } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getFontFamily } from '@/constants/font-categories';
import { useSaveBrandKit } from '@/hooks/use-brand-kit';
import { useUploadThing } from '@/lib/uploadthing';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

interface BrandKitFormProps {
    initialData?: BrandingProfile | null;
    importedBrandingData?: BrandingProfile | null;
    onExtract?: () => void;
}

export function BrandKitForm({
    initialData,
    importedBrandingData,
    onExtract,
}: BrandKitFormProps) {
    const { mutateAsync: saveBrandKit, isPending: isSaving } =
        useSaveBrandKit();

    // Color picker dialog state
    const [colorDialogOpen, setColorDialogOpen] = useState(false);
    const [colorDialogMode, setColorDialogMode] = useState<'add' | 'edit'>(
        'add',
    );
    const [editingColorName, setEditingColorName] = useState<
        string | undefined
    >();
    const [isEditingPrimary, setIsEditingPrimary] = useState(false);

    // Logo upload state
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Icon upload state
    const [iconUploading, setIconUploading] = useState(false);
    const iconInputRef = useRef<HTMLInputElement>(null);

    // Upload thing hook
    const { startUpload: startLogoUpload } = useUploadThing(
        'brandKitAssetUploader',
        {
            onClientUploadComplete: async (res) => {
                if (res && res[0]) {
                    form.setValue('logo', res[0].ufsUrl, {
                        shouldDirty: true,
                    });
                }
                setLogoUploading(false);
            },
            onUploadError: (error) => {
                setLogoUploading(false);
                toast({
                    title: 'Upload Error',
                    description: error.message || 'Failed to upload logo',
                    variant: 'destructive',
                });
            },
        },
    );

    const { startUpload: startIconUpload } = useUploadThing(
        'brandKitAssetUploader',
        {
            onClientUploadComplete: async (res) => {
                if (res && res[0]) {
                    form.setValue('icon', res[0].ufsUrl, {
                        shouldDirty: true,
                    });
                }
                setIconUploading(false);
            },
            onUploadError: (error) => {
                setIconUploading(false);
                toast({
                    title: 'Upload Error',
                    description: error.message || 'Failed to upload icon',
                    variant: 'destructive',
                });
            },
        },
    );

    const form = useForm({
        resolver: zodResolver(brandingProfileSchema),
        defaultValues: {
            logo: initialData?.logo || '',
            icon: initialData?.icon || '',
            primaryColor: initialData?.primaryColor || '',
            additionalColors: initialData?.additionalColors || {},
            font: initialData?.font || undefined,
        },
    });

    const isDirty = form.formState.isDirty;
    const isValid = form.formState.isValid;
    const isSubmitSuccessful = form.formState.isSubmitSuccessful;

    // Reset form when importedBrandingData changes (e.g., after asset import)
    useEffect(() => {
        if (importedBrandingData) {
            form.reset(
                {
                    logo: importedBrandingData?.logo || '',
                    icon: importedBrandingData?.icon || '',
                    primaryColor: importedBrandingData?.primaryColor || '',
                    additionalColors:
                        importedBrandingData?.additionalColors || {},
                    font: importedBrandingData?.font || undefined,
                },
                { keepDefaultValues: true },
            );
        }
    }, [importedBrandingData, form]);

    useEffect(() => {
        if (isSubmitSuccessful) {
            form.reset({}, { keepValues: true });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmitSuccessful]);

    const handleSubmit = async (values: BrandingProfile) => {
        try {
            await saveBrandKit(values);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save brand kit',
                variant: 'destructive',
            });
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
            >
                <Card className="border-0 lg:border">
                    <CardHeader className="p-0 pb-6 lg:p-6">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                            <div>
                                <CardTitle>
                                    {initialData
                                        ? 'Edit Brand Kit'
                                        : 'Create Brand Kit'}
                                </CardTitle>
                                <CardDescription>
                                    {initialData
                                        ? "Update your organization's brand identity"
                                        : 'Manually create your brand kit or extract from your website'}
                                </CardDescription>
                            </div>
                            <div className="flex justify-end gap-2">
                                {onExtract && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onExtract}
                                        disabled={isSaving}
                                    >
                                        <Globe className="h-4 w-4" />
                                        Extract from Website
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isSaving || !isDirty || !isValid}
                                >
                                    {isSaving && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {initialData
                                        ? 'Update Brand Kit'
                                        : 'Create Brand Kit'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator className="hidden lg:block" />

                    <CardContent className="space-y-8 p-0 lg:p-6">
                        <div>
                            <h3 className="mb-4 text-sm font-medium">Font</h3>
                            <FormField
                                control={form.control}
                                name="font"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroup
                                                value={field.value || undefined}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                }}
                                                className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                                            >
                                                {fontCategoryEnum.options.map(
                                                    (category) => {
                                                        const isSelected =
                                                            field.value ===
                                                            category;
                                                        return (
                                                            <div
                                                                key={category}
                                                                className="relative"
                                                            >
                                                                <RadioGroupItem
                                                                    value={
                                                                        category
                                                                    }
                                                                    id={`font-${category}`}
                                                                    className="peer sr-only"
                                                                />
                                                                <label
                                                                    htmlFor={`font-${category}`}
                                                                    className={cn(
                                                                        'flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border bg-background transition-all hover:border-primary hover:bg-accent sm:h-32',
                                                                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                                                                        !isSelected &&
                                                                            'border-input',
                                                                    )}
                                                                >
                                                                    <h4
                                                                        className="mb-1 text-4xl font-medium"
                                                                        style={{
                                                                            fontFamily:
                                                                                getFontFamily(
                                                                                    category,
                                                                                ),
                                                                        }}
                                                                    >
                                                                        Aa
                                                                    </h4>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {
                                                                            category
                                                                        }
                                                                    </p>
                                                                </label>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormDescription>
                                            Select a font category for your
                                            brand
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Primary Color Section */}
                        <div>
                            <h3 className="mb-4 text-sm font-medium">
                                Primary Color
                            </h3>
                            <FormField
                                control={form.control}
                                name="primaryColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="space-y-4">
                                                {field.value ? (
                                                    <ColorPalettePreview
                                                        colors={{
                                                            Primary:
                                                                field.value,
                                                        }}
                                                        onColorClick={() => {
                                                            setIsEditingPrimary(
                                                                true,
                                                            );
                                                            setEditingColorName(
                                                                undefined,
                                                            );
                                                            setColorDialogMode(
                                                                'edit',
                                                            );
                                                            setColorDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            'relative flex min-h-[140px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 transition-all',
                                                            'cursor-pointer border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20',
                                                        )}
                                                        onClick={() => {
                                                            setIsEditingPrimary(
                                                                true,
                                                            );
                                                            setEditingColorName(
                                                                undefined,
                                                            );
                                                            setColorDialogMode(
                                                                'add',
                                                            );
                                                            setColorDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="relative rounded-full bg-primary/5 p-3">
                                                                <Palette className="h-6 w-6 text-primary" />
                                                            </div>

                                                            <div className="text-center">
                                                                <p className="text-sm font-medium text-foreground">
                                                                    Click to add
                                                                    primary
                                                                    color
                                                                </p>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    Choose your
                                                                    brand&apos;s
                                                                    main color
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Additional Colors Section */}

                        <FormField
                            control={form.control}
                            name="additionalColors"
                            render={({ field }) => {
                                const additionalColors =
                                    (field.value as Record<string, string>) ||
                                    {};
                                const hasColors =
                                    Object.keys(additionalColors).length > 0;

                                return (
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-sm font-medium">
                                                Additional Colors
                                            </h3>
                                            {hasColors && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsEditingPrimary(
                                                            false,
                                                        );
                                                        setEditingColorName(
                                                            undefined,
                                                        );
                                                        setColorDialogMode(
                                                            'add',
                                                        );
                                                        setColorDialogOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add Color
                                                </Button>
                                            )}
                                        </div>
                                        <FormItem>
                                            <FormControl>
                                                <div className="space-y-4">
                                                    {hasColors ? (
                                                        <ColorPalettePreview
                                                            colors={
                                                                additionalColors
                                                            }
                                                            onColorClick={(
                                                                colorName,
                                                            ) => {
                                                                setIsEditingPrimary(
                                                                    false,
                                                                );
                                                                setEditingColorName(
                                                                    colorName,
                                                                );
                                                                setColorDialogMode(
                                                                    'edit',
                                                                );
                                                                setColorDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        />
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                'relative flex min-h-[140px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 transition-all',
                                                                'cursor-pointer border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20',
                                                            )}
                                                            onClick={() => {
                                                                setIsEditingPrimary(
                                                                    false,
                                                                );
                                                                setEditingColorName(
                                                                    undefined,
                                                                );
                                                                setColorDialogMode(
                                                                    'add',
                                                                );
                                                                setColorDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="relative rounded-full bg-primary/5 p-3">
                                                                    <Palette className="h-6 w-6 text-primary" />
                                                                </div>

                                                                <div className="text-center">
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        Click to
                                                                        add
                                                                        color
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        Add
                                                                        additional
                                                                        brand
                                                                        colors
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </div>
                                );
                            }}
                        />

                        {/* Logo Section */}
                        <div>
                            <h3 className="mb-4 text-sm font-medium">Logo</h3>
                            <FormField
                                control={form.control}
                                name="logo"
                                render={({ field }) => {
                                    const logoValue = field.value || '';
                                    const hasLogo = logoValue !== '';

                                    const handleFileSelect = async (
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0)
                                            return;

                                        const file = files[0];
                                        if (!file.type.startsWith('image/')) {
                                            toast({
                                                title: 'Invalid File',
                                                description:
                                                    'Please select an image file',
                                                variant: 'destructive',
                                            });
                                            return;
                                        }

                                        setLogoUploading(true);
                                        await startLogoUpload([file]);
                                        e.target.value = '';
                                    };

                                    return (
                                        <FormItem>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    {hasLogo ? (
                                                        <div className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                                            <div className="flex items-center justify-center">
                                                                <Image
                                                                    src={
                                                                        logoValue
                                                                    }
                                                                    alt="Logo"
                                                                    width={200}
                                                                    height={200}
                                                                    className="max-h-32 w-auto object-contain transition-transform group-hover:scale-105"
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute right-3 top-3 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                                                                onClick={() => {
                                                                    field.onChange(
                                                                        '',
                                                                    );
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                'relative flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 transition-all',
                                                                logoUploading
                                                                    ? 'border-primary/50 bg-primary/5'
                                                                    : 'cursor-pointer border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20',
                                                            )}
                                                            onClick={() =>
                                                                !logoUploading &&
                                                                logoInputRef.current?.click()
                                                            }
                                                        >
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="relative rounded-full bg-primary/5 p-3">
                                                                    {logoUploading ? (
                                                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                    ) : (
                                                                        <ImageIcon className="h-6 w-6 text-primary" />
                                                                    )}
                                                                </div>

                                                                <div className="text-center">
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {logoUploading
                                                                            ? 'Uploading...'
                                                                            : 'Click to upload logo'}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        PNG or
                                                                        JPEG
                                                                        (max
                                                                        8MB)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        ref={logoInputRef}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg"
                                                        className="hidden"
                                                        onChange={
                                                            handleFileSelect
                                                        }
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Upload your organization&apos;s
                                                logo image. View example
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>

                        {/* Icon Section */}
                        <div>
                            <h3 className="mb-4 text-sm font-medium">Icon</h3>
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => {
                                    const iconValue = field.value || '';
                                    const hasIcon = iconValue !== '';

                                    const handleFileSelect = async (
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0)
                                            return;

                                        const file = files[0];

                                        // Only allow PNG and JPEG
                                        if (
                                            file.type !== 'image/png' &&
                                            file.type !== 'image/jpeg' &&
                                            file.type !== 'image/jpg'
                                        ) {
                                            toast({
                                                title: 'Invalid File',
                                                description:
                                                    'Only PNG and JPEG images are allowed',
                                                variant: 'destructive',
                                            });
                                            return;
                                        }

                                        setIconUploading(true);
                                        await startIconUpload([file]);
                                        e.target.value = '';
                                    };

                                    return (
                                        <FormItem>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    {hasIcon ? (
                                                        <div className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                                            <div className="flex items-center justify-center">
                                                                <Image
                                                                    src={
                                                                        iconValue
                                                                    }
                                                                    alt="Icon"
                                                                    width={200}
                                                                    height={200}
                                                                    className="max-h-32 w-auto object-contain transition-transform group-hover:scale-105"
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute right-3 top-3 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                                                                onClick={() => {
                                                                    field.onChange(
                                                                        '',
                                                                    );
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                'relative flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-6 transition-all',
                                                                iconUploading
                                                                    ? 'border-primary/50 bg-primary/5'
                                                                    : 'cursor-pointer border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20',
                                                            )}
                                                            onClick={() =>
                                                                !iconUploading &&
                                                                iconInputRef.current?.click()
                                                            }
                                                        >
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="relative rounded-full bg-primary/5 p-3">
                                                                    {iconUploading ? (
                                                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                    ) : (
                                                                        <ImageIcon className="h-6 w-6 text-primary" />
                                                                    )}
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {iconUploading
                                                                            ? 'Uploading...'
                                                                            : 'Click to upload icon'}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        PNG or
                                                                        JPEG
                                                                        (max
                                                                        8MB)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        ref={iconInputRef}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg"
                                                        className="hidden"
                                                        onChange={
                                                            handleFileSelect
                                                        }
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Upload your organization&apos;s
                                                icon image. View example
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Color Picker Dialog - Primary Color */}
            {isEditingPrimary && (
                <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => {
                        const handleSave = (_name: string, value: string) => {
                            field.onChange(value);
                            setColorDialogOpen(false);
                        };

                        return (
                            <ColorPickerDialog
                                open={colorDialogOpen}
                                onOpenChange={setColorDialogOpen}
                                mode={colorDialogMode}
                                colorName={undefined}
                                colorValue={field.value || undefined}
                                existingColorNames={[]}
                                onSave={handleSave}
                                onDelete={undefined}
                                isPrimary={true}
                            />
                        );
                    }}
                />
            )}

            {/* Color Picker Dialog - Additional Colors */}
            {!isEditingPrimary && (
                <FormField
                    control={form.control}
                    name="additionalColors"
                    render={({ field }) => {
                        const additionalColors =
                            (field.value as Record<string, string>) || {};

                        const handleSave = (name: string, value: string) => {
                            if (
                                colorDialogMode === 'edit' &&
                                editingColorName
                            ) {
                                // Rename or update existing color
                                const newAdditional = {
                                    ...additionalColors,
                                };
                                if (editingColorName !== name) {
                                    // Rename: remove old key, add new key
                                    delete newAdditional[editingColorName];
                                }
                                newAdditional[name] = value;
                                field.onChange(newAdditional);
                            } else {
                                // Add new color
                                field.onChange({
                                    ...additionalColors,
                                    [name]: value,
                                });
                            }
                            setColorDialogOpen(false);
                        };

                        const handleDelete = () => {
                            if (editingColorName) {
                                const newAdditional = {
                                    ...additionalColors,
                                };
                                delete newAdditional[editingColorName];
                                field.onChange(newAdditional);
                            }
                            setColorDialogOpen(false);
                        };

                        const getColorValue = (): string | undefined => {
                            if (editingColorName) {
                                return additionalColors[editingColorName];
                            }
                            return undefined;
                        };

                        return (
                            <ColorPickerDialog
                                open={colorDialogOpen}
                                onOpenChange={setColorDialogOpen}
                                mode={colorDialogMode}
                                colorName={editingColorName}
                                colorValue={getColorValue()}
                                existingColorNames={Object.keys(
                                    additionalColors,
                                )}
                                onSave={handleSave}
                                onDelete={
                                    editingColorName ? handleDelete : undefined
                                }
                                isPrimary={false}
                            />
                        );
                    }}
                />
            )}
        </Form>
    );
}
