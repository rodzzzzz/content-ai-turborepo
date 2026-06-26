'use client';

import { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useExtractBranding } from '@/hooks/use-brand-kit';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    BrandingProfile,
    extractBrandingSchema,
} from '@/lib/validations/brand-kit';

interface BrandKitExtractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExtracted: (data: BrandingProfile) => void;
}

export function BrandKitExtractDialog({
    open,
    onOpenChange,
    onExtracted,
}: BrandKitExtractDialogProps) {
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { mutateAsync: extractBranding, isPending } = useExtractBranding();

    const handleExtract = async () => {
        if (!websiteUrl.trim()) {
            setError('Please enter a website URL');
            return;
        }

        const { data: validatedUrl, error: validationError } =
            extractBrandingSchema.safeParse({
                url: websiteUrl,
            });

        if (validationError) {
            setError('Please enter a valid website URL');
            return;
        }

        setError(null);

        try {
            const data = await extractBranding(validatedUrl.url);
            if (data) {
                onExtracted(data);
                setWebsiteUrl('');
                setError(null);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to extract branding from website',
            );
        }
    };

    const handleClose = (open: boolean) => {
        if (!isPending) {
            onOpenChange(open);
            if (!open) {
                setWebsiteUrl('');
                setError(null);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extract Branding from Website</DialogTitle>
                    <DialogDescription>
                        Enter your website URL to automatically extract brand
                        colors, fonts, typography, and other design elements.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="extract-website-url">Website URL</Label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="extract-website-url"
                                type="url"
                                placeholder="https://example.com"
                                value={websiteUrl}
                                onChange={(e) => {
                                    setWebsiteUrl(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isPending) {
                                        handleExtract();
                                    }
                                }}
                                className="pl-9"
                                disabled={isPending}
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <p className="text-xs text-muted-foreground">
                            We&apos;ll analyze your website to extract brand
                            elements automatically. This may take a few moments.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExtract}
                        disabled={isPending || !websiteUrl.trim()}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            'Extract Branding'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
