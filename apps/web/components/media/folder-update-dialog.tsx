import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { updateFolder } from '@/actions/file';
import { toast } from '@/hooks/use-toast';
import { useFiles } from '@/contexts/file-context';
import { z } from 'zod';
import { folderUpdateSchema } from '@/lib/validations/file';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
} from '@/components/ui/form';

interface FolderUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FormData = z.infer<typeof folderUpdateSchema>;

export function FolderUpdateDialog({
    open,
    onOpenChange,
}: FolderUpdateDialogProps) {
    const { invalidateFileQueries, dialogFolderData, setDialogFolderData } =
        useFiles();
    const [isLoading, setIsLoading] = useState(false);
    const [disabledButton, setDisabledButton] = useState(true);

    const form = useForm<FormData>({
        resolver: zodResolver(folderUpdateSchema),
        defaultValues: {
            name: '',
        },
    });

    const { isDirty, isValid } = form.formState;

    useEffect(() => {
        const disabled = !isDirty || !isValid;
        setDisabledButton(disabled);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState]);

    useEffect(() => {
        if (open && dialogFolderData.folderName) {
            form.setValue('name', dialogFolderData.folderName);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, dialogFolderData.folderName]);

    useEffect(() => {
        if (!open) {
            form.reset();
            setDialogFolderData({
                folderId: null,
                folderName: null,
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function onUpdateFolder(values: FormData) {
        setIsLoading(true);

        if (!dialogFolderData.folderId) {
            return;
        }

        await updateFolder(dialogFolderData.folderId, { name: values.name })
            .then((data) => {
                if (data.error) {
                    toast({
                        title: data.error,
                        description:
                            'Folder was not updated. Please try again.',
                        variant: 'destructive',
                    });
                }

                if (data.success) {
                    // Invalidate queries to refresh data
                    invalidateFileQueries();

                    form.reset();

                    toast({
                        description: 'Folder has been updated.',
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
                    description: 'Folder was not updated. Please try again.',
                    variant: 'destructive',
                }),
            )
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Folder</DialogTitle>
                    <DialogDescription>
                        Rename the folder to a new name.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onUpdateFolder)}
                        id="folder-update-form"
                    >
                        <div className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Folder name"
                                                {...field}
                                                autoFocus
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button
                                disabled={isLoading || disabledButton}
                                type="submit"
                                form="folder-update-form"
                            >
                                {isLoading && (
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                )}
                                Update
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
