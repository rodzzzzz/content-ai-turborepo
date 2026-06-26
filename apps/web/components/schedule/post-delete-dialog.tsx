'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useDeleteSchedule } from '@/hooks/use-schedule-mutations';
import { toast } from '@/hooks/use-toast';

interface PostDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: string | null;
}

export function PostDeleteDialog({
    open,
    onOpenChange,
    postId,
}: PostDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteScheduleMutation = useDeleteSchedule();

    const handleDelete = async () => {
        if (!postId) return;

        setIsDeleting(true);
        try {
            await deleteScheduleMutation.mutateAsync(postId);

            toast({
                description: 'Post has been deleted.',
            });

            onOpenChange(false);
        } catch (error) {
            console.error(error);

            toast({
                title: 'Something went wrong.',
                description: 'Post was not deleted. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this post?
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    This post will be permanently deleted. This action cannot be
                    undone.
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
