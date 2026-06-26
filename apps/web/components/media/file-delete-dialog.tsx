import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { deleteFiles } from '@/actions/file';
import { toast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFiles } from '@/contexts/file-context';

interface FileDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    setSelectedItems: Dispatch<SetStateAction<string[]>>;
}
export function FileDeleteDialog({
    open,
    onOpenChange,
    setSelectedItems,
}: FileDeleteDialogProps) {
    const { invalidateFileQueries, dialogFileData, setDialogFileData } =
        useFiles();
    const [isLoading, setIsLoading] = useState(false);
    const isSingleFile = dialogFileData.files.length === 1;

    useEffect(() => {
        if (!open) {
            setDialogFileData({
                files: [],
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleDelete = async () => {
        setIsLoading(true);

        await deleteFiles(dialogFileData.files)
            .then((data) => {
                if (data.error) {
                    toast({
                        title: data.error,
                        description: isSingleFile
                            ? 'File was not deleted. Please try again.'
                            : 'Files were not deleted. Please try again.',
                        variant: 'destructive',
                    });
                }

                if (data.success) {
                    // Invalidate queries to refresh data
                    invalidateFileQueries();

                    setSelectedItems([]);
                    onOpenChange(false);

                    toast({
                        description: isSingleFile
                            ? 'File has been deleted.'
                            : 'Files have been deleted.',
                    });

                    setDialogFileData({
                        files: [],
                    });
                }
            })
            .catch(() => {
                toast({
                    title: 'Something went wrong.',
                    description: isSingleFile
                        ? 'File was not deleted. Please try again.'
                        : 'Files were not deleted. Please try again.',
                    variant: 'destructive',
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isSingleFile
                            ? 'Are you sure you want to delete this file?'
                            : 'Are you sure you want to delete these files?'}
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    {isSingleFile
                        ? 'This file will be permanently deleted from our servers. This action cannot be undone.'
                        : 'All files will be permanently deleted from our servers. This action cannot be undone.'}
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                        )}
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
