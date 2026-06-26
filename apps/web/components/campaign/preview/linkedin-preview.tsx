import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    MoreHorizontal,
    ThumbsUp,
    MessageSquare,
    Repeat2,
    Send,
    Globe,
} from 'lucide-react';
import { ImageGrid } from './image-grid';
import { ContentItem } from '@/types/campaign';
import { Dispatch, SetStateAction } from 'react';

interface LinkedInPreviewProps {
    authorName: string;
    authorImage: string;
    content: ContentItem;
    isEditing?: boolean;
    editedContent?: ContentItem;
    onContentChange: Dispatch<SetStateAction<ContentItem>>;
    disabled?: boolean;
}

export function LinkedInPreview({
    authorName,
    authorImage,
    content,
    isEditing = false,
    editedContent,
    onContentChange,
    disabled = false,
}: LinkedInPreviewProps) {
    const initials = authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <Card className="flex w-full max-w-xl flex-col border-0 md:border">
            {/* Header */}
            <div className="flex items-start justify-between p-3">
                <div className="flex gap-2">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback className="bg-[#0a66c2] text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="text-sm font-semibold">
                            {authorName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            128,026 followers
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Just now</span>
                            <span>·</span>
                            <Globe className="h-3 w-3" />
                        </div>
                    </div>
                </div>
                <div className="p-2 text-muted-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                </div>
            </div>

            {/* Content */}
            <div className="px-3 pb-3">
                {isEditing ? (
                    <Textarea
                        value={editedContent?.content || ''}
                        onChange={(e) =>
                            onContentChange((prev) => ({
                                ...prev,
                                content: e.target.value,
                            }))
                        }
                        autoFocus
                        placeholder="What do you want to talk about?"
                        className="field-sizing-content min-h-[80px] resize-none rounded-none border-0 p-0 text-sm shadow-none ring-1 ring-border ring-offset-4 focus-visible:ring-primary"
                        disabled={disabled}
                    />
                ) : (
                    <p className="whitespace-pre-wrap text-sm">
                        {content?.content}
                    </p>
                )}
            </div>

            {/* Images */}
            {(() => {
                const media = isEditing ? editedContent?.media : content?.media;
                return media && media.length > 0;
            })() && (
                <ImageGrid
                    images={
                        isEditing
                            ? editedContent?.media || []
                            : content?.media || []
                    }
                />
            )}

            {/* Stats */}
            <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#0a66c2]">
                            <ThumbsUp className="h-2.5 w-2.5 fill-white text-white" />
                        </div>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#6dae4f]">
                            <span className="text-xs font-bold text-white">
                                👏
                            </span>
                        </div>
                    </div>
                    <span>324</span>
                </div>
                <div className="flex gap-2">
                    <span>48 comments</span>
                    <span>·</span>
                    <span>12 reposts</span>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-1 border-t border-border px-2 py-1">
                <div className="flex items-center justify-center gap-1.5 rounded py-3 text-sm font-semibold text-muted-foreground">
                    <ThumbsUp className="h-5 w-5" />
                    <span>Like</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded py-3 text-sm font-semibold text-muted-foreground">
                    <MessageSquare className="h-5 w-5" />
                    <span>Comment</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded py-3 text-sm font-semibold text-muted-foreground">
                    <Repeat2 className="h-5 w-5" />
                    <span>Repost</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded py-3 text-sm font-semibold text-muted-foreground">
                    <Send className="h-5 w-5" />
                    <span>Send</span>
                </div>
            </div>
        </Card>
    );
}
