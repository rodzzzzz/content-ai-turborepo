import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    FileIcon,
    FolderIcon,
    HomeIcon,
    Loader2Icon,
} from 'lucide-react';
import { SetStateAction, Dispatch, useEffect, useState } from 'react';
import { moveFiles } from '@/actions/file';
import { toast } from '@/hooks/use-toast';
import { useFiles } from '@/contexts/file-context';
import { z } from 'zod';
import { fileMoveSchema } from '@/lib/validations/file';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectValue,
    SelectTrigger,
    SelectItem,
} from '@/components/ui/select';
import { formatBytes } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileMoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    setSelectedItems: Dispatch<SetStateAction<string[]>>;
}

type FormData = z.infer<typeof fileMoveSchema>;

export function FileMoveDialog({
    open,
    onOpenChange,
    setSelectedItems,
}: FileMoveDialogProps) {
    const {
        folders,
        dialogFileData,
        setDialogFileData,
        invalidateFileQueries,
    } = useFiles();
    const [isLoading, setIsLoading] = useState(false);
    const [disabledButton, setDisabledButton] = useState(true);

    const filesToMove = dialogFileData.files;
    const movableToHome = dialogFileData.movableToHome;

    const form = useForm<FormData>({
        resolver: zodResolver(fileMoveSchema),
        defaultValues: {
            folderId: '',
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
            setDialogFileData({
                files: [],
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function onMoveFile(values: FormData) {
        setIsLoading(true);

        await moveFiles(
            dialogFileData.files,
            values.folderId === 'HOME' ? 'HOME' : values.folderId,
        )
            .then((res) => {
                if (res.success) {
                    toast({
                        title: 'Success!',
                        description:
                            dialogFileData.files.length === 1
                                ? 'File was moved successfully.'
                                : 'Files were moved successfully.',
                    });

                    // Invalidate queries to refresh data
                    invalidateFileQueries();

                    onOpenChange(false);
                    setSelectedItems([]);
                } else if (res.error) {
                    toast({
                        title: 'Error',
                        description:
                            dialogFileData.files.length === 1
                                ? 'File was not moved. Please try again.'
                                : 'Files were not moved. Please try again.',
                        variant: 'destructive',
                    });
                }
            })
            .catch(() => {
                toast({
                    title: 'Error',
                    description:
                        dialogFileData.files.length === 1
                            ? 'File was not moved. Please try again.'
                            : 'Files were not moved. Please try again.',
                    variant: 'destructive',
                });
            })
            .finally(() => {
                setIsLoading(false);

                // Reset form and dialog data
                form.reset();
                setDialogFileData({
                    files: [],
                });
            });
    }

    const getDestinationName = (): string => {
        if (disabledButton || form.getValues('folderId') === '') return '';

        const folderId = form.getValues('folderId');

        if (folderId === 'HOME') {
            return 'Home';
        }

        const folder = folders.find((f) => f.id === folderId);
        return folder ? folder.name : '';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onMoveFile)}
                    id="file-move-form"
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {`Move ${filesToMove.length} ${filesToMove.length === 1 ? 'file' : 'files'}`}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Move the file to a new folder.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex w-full flex-col gap-y-4 py-2">
                            <FormField
                                control={form.control}
                                name="folderId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Destination Folder
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger
                                                    id="destination"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Select destination folder" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {movableToHome && (
                                                        <SelectItem value="HOME">
                                                            <div className="flex items-center gap-2">
                                                                <HomeIcon className="h-4 w-4" />
                                                                Home Folder
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                    {folders.map((folder) => (
                                                        <SelectItem
                                                            key={folder.id}
                                                            value={folder.id}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <FolderIcon className="h-4 w-4" />
                                                                {folder.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Files to move */}
                            <div className="w-full space-y-2">
                                <h4 className="text-sm font-medium">
                                    Files to Move ({filesToMove.length})
                                </h4>

                                <ScrollArea className="flex max-h-[250px] w-full flex-col gap-y-2 rounded-md border p-1">
                                    {filesToMove.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex w-full items-center gap-2 rounded-md p-2 text-sm"
                                        >
                                            <FileIcon className="h-4 w-4 flex-shrink-0" />
                                            <div className="min-w-0 max-w-[250px] flex-1 truncate">
                                                {file.name}
                                            </div>

                                            <div className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
                                                {formatBytes(file.fileSize)}
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>

                            {/* Move destination visualization */}
                            {form.getValues('folderId') && (
                                <div className="flex items-center justify-center gap-3 py-2 text-sm">
                                    <div className="flex items-center gap-1">
                                        <FileIcon className="h-4 w-4" />
                                        <span>
                                            {`${filesToMove.length} ${
                                                filesToMove.length === 1
                                                    ? 'file'
                                                    : 'files'
                                            }`}
                                        </span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex items-center gap-1">
                                        {form.getValues('folderId') ===
                                        'HOME' ? (
                                            <>
                                                <HomeIcon className="h-4 w-4" />
                                                Home Folder
                                            </>
                                        ) : (
                                            <>
                                                <FolderIcon className="h-4 w-4" />
                                                <span>
                                                    {getDestinationName()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="gap-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="file-move-form"
                                disabled={disabledButton}
                            >
                                {isLoading && (
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                )}
                                Move
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Form>
        </Dialog>
    );
}
