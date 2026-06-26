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
import { useDeleteExtractedLink } from '@/hooks/use-knowledge-mutations';
import { Trash2Icon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface ExtractionDeleteDialogProps {
    selectedLinks: string[];
    setSelectedLinks: (links: string[]) => void;
    children: React.ReactNode;
}

export default function ExtractionDeleteDialog({
    selectedLinks,
    setSelectedLinks,
    children,
}: ExtractionDeleteDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { mutateAsync: deleteExtractedLink, isPending } =
        useDeleteExtractedLink();

    const handleDelete = async () => {
        const result = await deleteExtractedLink(selectedLinks);

        if (result.success) {
            setSelectedLinks([]);
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Selected Links</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {selectedLinks.length}{' '}
                        selected link(s)? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2Icon className="h-4 w-4" />
                        )}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
