'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useUpdateExtractedContent } from '@/hooks/use-knowledge-mutations';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, SaveIcon } from 'lucide-react';

interface ContentDialogProps {
    selectedLinkId: string;
    content: string;
    title: string;
    url: string;
    children: React.ReactNode;
}

export default function ContentDialog({
    selectedLinkId,
    content,
    title,
    url,
    children,
}: ContentDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editedContent, setEditedContent] = useState(content);
    const { mutateAsync: updateExtractedContent, isPending } =
        useUpdateExtractedContent();

    const handleUpdate = async () => {
        const result = await updateExtractedContent({
            linkId: selectedLinkId,
            title,
            content: editedContent,
            url,
        });

        if (result.success) {
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit Content</DialogTitle>
                    <DialogDescription>
                        Review and edit the scraped content from the website.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[400px]"
                        placeholder="Content will appear here..."
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <SaveIcon className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
