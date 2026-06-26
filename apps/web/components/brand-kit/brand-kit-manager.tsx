'use client';

import { useState } from 'react';
import { useBrandKit } from '@/hooks/use-brand-kit';
import { BrandKitForm } from './brand-kit-form';
import { BrandKitExtractDialog } from './brand-kit-extract-dialog';
import { BrandKitAssetSelector } from './brand-kit-asset-selector';
import type { BrandingProfile } from '@/lib/validations/brand-kit';
import { BrandKitFormSkeleton } from './brand-kit-form-skeleton';
import { merge } from 'lodash';

export function BrandKitManager() {
    const [showExtractDialog, setShowExtractDialog] = useState(false);
    const [showAssetSelector, setShowAssetSelector] = useState(false);
    const [extractedData, setExtractedData] = useState<BrandingProfile | null>(
        null,
    );
    const [importedBrandingData, setImportedBrandingData] =
        useState<BrandingProfile | null>(null);

    const { data: brandKit, isLoading } = useBrandKit();

    const handleExtracted = (data: BrandingProfile) => {
        setExtractedData(data);
        setShowExtractDialog(false);
        setShowAssetSelector(true);
    };

    const handleAssetImport = (selectedData: Partial<BrandingProfile>) => {
        // Merge selected assets with current brand kit data
        const currentBrandingData = brandKit as BrandingProfile | null;

        if (currentBrandingData) {
            const mergedData = merge(currentBrandingData, selectedData);
            setImportedBrandingData(mergedData);
        } else {
            setImportedBrandingData(selectedData);
        }
        setShowAssetSelector(false);
    };

    if (isLoading) {
        return <BrandKitFormSkeleton />;
    }

    return (
        <>
            <BrandKitForm
                initialData={brandKit as BrandingProfile | null}
                importedBrandingData={importedBrandingData}
                onExtract={() => setShowExtractDialog(true)}
            />
            <BrandKitExtractDialog
                open={showExtractDialog}
                onOpenChange={setShowExtractDialog}
                onExtracted={handleExtracted}
            />
            {extractedData && (
                <BrandKitAssetSelector
                    open={showAssetSelector}
                    onOpenChange={setShowAssetSelector}
                    extractedData={extractedData}
                    onImport={handleAssetImport}
                />
            )}
        </>
    );
}
