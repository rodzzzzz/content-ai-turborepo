import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { deleteFolder } from '@/actions/file';
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

interface FolderDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FolderDeleteDialog({
    open,
    onOpenChange,
}: FolderDeleteDialogProps) {
    const { invalidateFileQueries, dialogFolderData, setDialogFolderData } =
        useFiles();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setDialogFolderData({
                folderId: null,
                folderName: null,
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleDelete = async () => {
        setIsLoading(true);

        if (!dialogFolderData.folderId) {
            return;
        }

        await deleteFolder(dialogFolderData.folderId)
            .then((data) => {
                if (data.error) {
                    toast({
                        title: data.error,
                        description:
                            'Folder was not deleted. Please try again.',
                        variant: 'destructive',
                    });
                }

                if (data.success) {
                    // Invalidate queries to refresh data
                    invalidateFileQueries();

                    toast({
                        description: 'Folder has been deleted.',
                    });

                    onOpenChange(false);

                    setDialogFolderData({
                        folderId: null,
                        folderName: null,
                    });
                }
            })
            .catch(() =>
                toast({
                    title: 'Something went wrong.',
                    description: 'Folder was not deleted. Please try again.',
                    variant: 'destructive',
                }),
            )
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this folder?
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    This action cannot be undone. All files in this folder will
                    be moved to home.
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
