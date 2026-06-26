import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CrawlResult } from '@/lib/validations/website-extraction';
import { Search } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';

interface ExtractDialogProps {
    isOpen: boolean;
    onClose: () => void;
    urls: CrawlResult[];
    onConfirm: (selectedUrls: string[]) => void;
    trainedUrls: string[];
}

export default function ExtractDialog({
    isOpen,
    onClose,
    urls,
    onConfirm,
    trainedUrls,
}: ExtractDialogProps) {
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSelectedUrls([]);
            setSearchQuery('');
        }
    }, [isOpen]);

    const filteredUrls = urls.filter(
        (url) =>
            url.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            url.url.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleSelectAll = () => {
        if (selectedUrls.length === urls.length) {
            setSelectedUrls([]);
        } else {
            setSelectedUrls(urls.map((url) => url.url));
        }
    };

    const handleToggleUrl = (url: string) => {
        setSelectedUrls((prev) =>
            prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-w-3xl flex-col">
                <DialogHeader>
                    <DialogTitle>Select pages to train</DialogTitle>
                    <DialogDescription className="sr-only">
                        Select the pages you want to train the bot on.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input
                            placeholder="Search pages"
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={selectedUrls.length === urls.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm">
                            Select all {urls.length} pages
                        </span>
                    </div>
                </div>

                {filteredUrls.length > 0 ? (
                    <ScrollArea className="flex h-full max-h-[550px] w-full flex-col gap-y-2 rounded-md border">
                        {filteredUrls.map((url, index) => {
                            const isTrained = trainedUrls.includes(url.url);
                            return (
                                <div
                                    key={`${url.url}-${index}`}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-4 p-3 hover:bg-muted/50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
                                        selectedUrls.includes(url.url) &&
                                            'bg-muted/50',
                                    )}
                                    aria-disabled={isTrained}
                                    onClick={(e) => {
                                        if (
                                            e.target instanceof HTMLInputElement
                                        ) {
                                            return;
                                        }
                                        if (isTrained) {
                                            return;
                                        }
                                        handleToggleUrl(url.url);
                                    }}
                                >
                                    <Checkbox
                                        checked={selectedUrls.includes(url.url)}
                                        onCheckedChange={() => {
                                            if (isTrained) {
                                                return;
                                            }
                                            handleToggleUrl(url.url);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {url.title}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {url.url}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-3">
                            <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            No pages found
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(selectedUrls)}
                        disabled={selectedUrls.length === 0}
                    >
                        Train Bot
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
