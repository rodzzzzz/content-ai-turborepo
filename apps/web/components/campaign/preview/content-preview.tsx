import Link from 'next/link';
import { FacebookPreview } from './facebook-preview';
import { LinkedInPreview } from './linkedin-preview';
import { TwitterPreview } from './twitter-preview';
import {
    UserSearchIcon,
    ImageIcon,
    Loader2Icon,
    CalendarIcon,
    AlertTriangleIcon,
} from 'lucide-react';
import { useIntegratedAccounts } from '@/contexts/integration-context';
import { ContentItem } from '@/types/campaign';
import { useCampaignPreview } from '@/contexts/campaign-preview-context';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { MediaEditDialog } from './media-edit-dialog';
import { toast } from '@/hooks/use-toast';
import { isEqual } from 'lodash';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateTimePicker } from '@/components/schedule/content-create/date-time-picker';
import { ContentCreate } from './content-create';

export const ContentPreview = ({
    content,
    setContent,
    isEditing,
    setIsEditing,
}: {
    content: ContentItem;
    setContent: Dispatch<SetStateAction<ContentItem | null>>;
    isEditing: boolean;
    setIsEditing: Dispatch<SetStateAction<boolean>>;
}) => {
    const { data: integratedAccounts } = useIntegratedAccounts();
    const { updateContent, isUpdatingCampaignContent } = useCampaignPreview();

    // Editing state management
    const [editedContent, setEditedContent] = useState(content);
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

    // Initialize editing state when content changes
    useEffect(() => {
        if (content) {
            setEditedContent(content);
        }
    }, [content]);

    useEffect(() => {
        if (isEditing) {
            setEditedContent(content);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const hasChanges = !isEqual(content, editedContent);

    // Platform settings based on the content platform
    const getPlatformSettings = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'twitter':
                return {
                    name: 'Twitter',
                    contentMaxLength: 280,
                    mediaMaxCount: 4,
                };
            case 'facebook':
                return {
                    name: 'Facebook',
                    contentMaxLength: 63206,
                    mediaMaxCount: 10,
                };
            case 'linkedin':
                return {
                    name: 'LinkedIn',
                    contentMaxLength: 3000,
                    mediaMaxCount: 9,
                };
            default:
                return {
                    name: platform,
                    contentMaxLength: 1000,
                    mediaMaxCount: 10,
                };
        }
    };

    const platformSettings = getPlatformSettings(content.platform);

    const handleSave = async () => {
        try {
            await updateContent(content.id, editedContent);
        } catch (error) {
            console.error('Error saving content:', error);
            toast({
                title: 'Content not saved',
                description: 'Something went wrong.',
                variant: 'destructive',
            });
        }

        setContent((prev) => ({
            ...prev,
            ...editedContent,
        }));

        setIsEditing(false);
    };

    const handleUndo = () => {
        setEditedContent(content);
    };

    const handleContentChange = (updatedContent: ContentItem) => {
        setEditedContent(updatedContent);
    };

    if (!integratedAccounts) {
        return null;
    }

    const platform = content?.platform.toLowerCase() as
        | 'facebook'
        | 'twitter'
        | 'linkedin';

    const account = integratedAccounts?.find(
        (account) => account.provider === platform,
    );

    if (!account) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                <UserSearchIcon className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No account found</h3>
                <p className="text-sm text-muted-foreground">
                    Please{' '}
                    <Link
                        href="/settings/integrations"
                        className="text-blue-500 hover:underline"
                    >
                        connect your account
                    </Link>{' '}
                    to view the preview of this content.
                </p>
            </div>
        );
    }

    if (content.status === 'empty') {
        return (
            <ContentCreate
                contentCopyPrompt={content.contentCopyPrompt}
                platform={platform}
                content={content}
                setContent={setContent}
            />
        );
    }

    return (
        <>
            <AnimatePresence initial={false}>
                {isEditing && (
                    <motion.div
                        className="w-full overflow-clip border-b border-border bg-muted"
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                    >
                        <div className="space-y-3 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <Dialog
                                    open={mediaDialogOpen}
                                    onOpenChange={setMediaDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isUpdatingCampaignContent}
                                        >
                                            <ImageIcon
                                                className="h-3 w-3"
                                                style={{
                                                    height: '12px',
                                                    width: '12px',
                                                }}
                                            />
                                            Edit Media
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        className="h-full max-w-7xl p-4 sm:rounded-none lg:max-h-[90vh] lg:rounded-lg lg:p-6 [&>button]:hidden"
                                        onInteractOutside={(e) => {
                                            e.preventDefault();
                                        }}
                                        onEscapeKeyDown={(e) => {
                                            e.preventDefault();
                                        }}
                                    >
                                        <DialogTitle className="sr-only">
                                            Edit Media
                                        </DialogTitle>
                                        <DialogDescription className="sr-only">
                                            Edit the media for your post
                                        </DialogDescription>
                                        <MediaEditDialog
                                            content={editedContent}
                                            onContentChange={
                                                handleContentChange
                                            }
                                            onClose={() =>
                                                setMediaDialogOpen(false)
                                            }
                                            platformSettings={platformSettings}
                                            mediaSuggestion={
                                                content.mediaSuggestion
                                            }
                                            imagePrompt={
                                                content.mediaCreationPrompt
                                            }
                                        />
                                    </DialogContent>
                                </Dialog>
                                <Popover modal>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                'text-left',
                                                !editedContent.dateAndTime &&
                                                'text-muted-foreground',
                                            )}
                                            disabled={isUpdatingCampaignContent}
                                        >
                                            <CalendarIcon
                                                className="ml-auto h-3 w-3"
                                                style={{
                                                    height: '12px',
                                                    width: '12px',
                                                }}
                                            />
                                            {editedContent.dateAndTime ? (
                                                format(
                                                    editedContent.dateAndTime,
                                                    'MMM dd, yyyy hh:mm a',
                                                )
                                            ) : (
                                                <span>
                                                    Pick a date and time
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <DateTimePicker
                                            value={
                                                editedContent.dateAndTime
                                                    ? new Date(
                                                        editedContent.dateAndTime,
                                                    )
                                                    : new Date()
                                            }
                                            onChange={(d) =>
                                                setEditedContent({
                                                    ...editedContent,
                                                    dateAndTime:
                                                        d.toISOString(),
                                                })
                                            }
                                            disabledPast
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex h-full justify-center overflow-y-auto md:my-4 md:px-4">
                {content && (
                    <div className="flex h-fit w-full flex-col items-center gap-4">
                        {platform === 'twitter' && (
                            <TwitterPreview
                                authorName={account?.account_name || ''}
                                authorHandle={account?.username || ''}
                                authorImage={account?.profile_picture || ''}
                                content={content}
                                isEditing={isEditing}
                                editedContent={editedContent}
                                onContentChange={setEditedContent}
                                disabled={isUpdatingCampaignContent}
                            />
                        )}
                        {platform === 'facebook' && (
                            <FacebookPreview
                                authorName={account?.account_name || ''}
                                authorImage={account?.profile_picture || ''}
                                content={content}
                                isEditing={isEditing}
                                editedContent={editedContent}
                                onContentChange={setEditedContent}
                                disabled={isUpdatingCampaignContent}
                            />
                        )}
                        {platform === 'linkedin' && (
                            <LinkedInPreview
                                authorName={account?.account_name || ''}
                                authorImage={account?.profile_picture || ''}
                                content={content}
                                isEditing={isEditing}
                                editedContent={editedContent}
                                onContentChange={setEditedContent}
                                disabled={isUpdatingCampaignContent}
                            />
                        )}
                    </div>
                )}
            </div>
            <AnimatePresence initial={false}>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute bottom-6 left-0 right-0 mx-auto w-fit rounded-full border border-yellow-500 bg-yellow-50 p-2 pl-4 shadow-lg"
                    >
                        <div className="flex items-center gap-1">
                            <AlertTriangleIcon className="h-4 w-4 stroke-yellow-500" />
                            <p className="text-xs md:text-sm">
                                Unsaved changes
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-4 rounded-full"
                                onClick={handleUndo}
                                disabled={
                                    isUpdatingCampaignContent || !hasChanges
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="rounded-full"
                                onClick={handleSave}
                                disabled={
                                    isUpdatingCampaignContent || !hasChanges
                                }
                            >
                                {isUpdatingCampaignContent && (
                                    <Loader2Icon
                                        className="h-3 w-3 animate-spin"
                                        style={{
                                            height: '12px',
                                            width: '12px',
                                        }}
                                    />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
