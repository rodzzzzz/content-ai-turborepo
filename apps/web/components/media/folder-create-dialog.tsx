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
import { createFolder } from '@/actions/file';
import { toast } from '@/hooks/use-toast';
import { useFiles } from '@/contexts/file-context';
import { useForm } from 'react-hook-form';
import { folderCreateSchema } from '@/lib/validations/file';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form';
import { z } from 'zod';

interface FolderCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FormData = z.infer<typeof folderCreateSchema>;

export function FolderCreateDialog({
    open,
    onOpenChange,
}: FolderCreateDialogProps) {
    const { invalidateFileQueries } = useFiles();
    const [isLoading, setIsLoading] = useState(false);
    const [disabledButton, setDisabledButton] = useState(true);

    const form = useForm<FormData>({
        resolver: zodResolver(folderCreateSchema),
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
        if (!open) {
            form.reset();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function onCreateFolder(values: FormData) {
        setIsLoading(true);

        await createFolder({ name: values.name })
            .then((data) => {
                if (data.error) {
                    toast({
                        title: data.error,
                        description:
                            'Folder was not created. Please try again.',
                        variant: 'destructive',
                    });
                }

                if (data.success) {
                    // Invalidate queries to refresh data
                    invalidateFileQueries();

                    form.reset();

                    toast({
                        description: 'New folder has been created.',
                    });

                    onOpenChange(false);
                }
            })
            .catch(() =>
                toast({
                    title: 'Something went wrong.',
                    description: 'Folder was not created. Please try again.',
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
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                        Create a new folder to store your files.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onCreateFolder)}
                        id="folder-create-form"
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
                                form="folder-create-form"
                            >
                                {isLoading && (
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                )}
                                Create
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
