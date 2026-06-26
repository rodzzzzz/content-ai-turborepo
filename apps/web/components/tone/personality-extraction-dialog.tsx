'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PersonalityExtractionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExtract: (url: string) => Promise<void>;
    isExtracting: boolean;
}

export default function PersonalityExtractionDialog({
    isOpen,
    onClose,
    onExtract,
    isExtracting,
}: PersonalityExtractionDialogProps) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setUrl('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            return;
        }
        await onExtract(url.trim());
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Extract Personality from Website</DialogTitle>
                    <DialogDescription>
                        Enter your website URL to automatically extract
                        personality information that matches your brand voice
                        and content style.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">Website URL</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isExtracting}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isExtracting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isExtracting || !url.trim()}
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                'Extract Personality'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
