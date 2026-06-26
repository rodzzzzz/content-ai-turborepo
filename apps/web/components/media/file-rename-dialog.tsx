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
import { renameFile } from '@/actions/file';
import { toast } from '@/hooks/use-toast';
import { useFiles } from '@/contexts/file-context';
import { z } from 'zod';
import { fileRenameSchema } from '@/lib/validations/file';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
} from '@/components/ui/form';

interface FileRenameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FormData = z.infer<typeof fileRenameSchema>;

export function FileRenameDialog({
    open,
    onOpenChange,
}: FileRenameDialogProps) {
    const { invalidateFileQueries, dialogFileData, setDialogFileData } =
        useFiles();
    const [isLoading, setIsLoading] = useState(false);
    const [disabledButton, setDisabledButton] = useState(true);

    const form = useForm<FormData>({
        resolver: zodResolver(fileRenameSchema),
        defaultValues: {
            name: '',
            folderId: undefined, // This will be set from the file we're renaming
        },
    });

    const { isDirty, isValid } = form.formState;

    useEffect(() => {
        const disabled = !isDirty || !isValid;
        setDisabledButton(disabled);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState]);

    useEffect(() => {
        if (open && dialogFileData.fileName) {
            form.setValue('name', dialogFileData.fileName);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, dialogFileData.fileName]);

    useEffect(() => {
        if (!open) {
            form.reset();
            setDialogFileData({
                files: [],
                fileName: null,
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function onRenameFile(values: FormData) {
        setIsLoading(true);

        if (dialogFileData.files.length !== 1) {
            return;
        }

        await renameFile(dialogFileData.files[0].id, values)
            .then((data) => {
                if (data.error) {
                    toast({
                        title: data.error,
                        description: 'File was not renamed. Please try again.',
                        variant: 'destructive',
                    });
                }

                if (data.success) {
                    // Invalidate queries to refresh data
                    invalidateFileQueries();

                    form.reset();
                    onOpenChange(false);

                    toast({
                        description: 'File has been renamed.',
                    });

                    setDialogFileData({
                        files: [],
                        fileName: null,
                    });
                }
            })
            .catch(() => {
                toast({
                    title: 'Something went wrong.',
                    description: 'File was not renamed. Please try again.',
                    variant: 'destructive',
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename File</DialogTitle>
                    <DialogDescription>
                        Rename the file to a new name.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onRenameFile)}
                        id="file-rename-form"
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
                                                placeholder="File name"
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
                                form="file-rename-form"
                            >
                                {isLoading && (
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                )}
                                Rename
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
