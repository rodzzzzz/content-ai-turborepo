import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    MoreHorizontal,
    ThumbsUp,
    MessageCircle,
    Share2,
    Globe,
} from 'lucide-react';
import { ImageGrid } from './image-grid';
import { ContentItem } from '@/types/campaign';
import { Dispatch, SetStateAction } from 'react';

interface FacebookPreviewProps {
    authorName: string;
    authorImage: string;
    content: ContentItem;
    isEditing?: boolean;
    editedContent?: ContentItem;
    onContentChange: Dispatch<SetStateAction<ContentItem>>;
    disabled?: boolean;
}

export function FacebookPreview({
    authorName,
    authorImage,
    content,
    isEditing = false,
    editedContent,
    onContentChange,
    disabled = false,
}: FacebookPreviewProps) {
    const initials = authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <Card className="flex w-full max-w-xl flex-col border-0 md:border">
            {/* Header */}
            <div className="flex items-start justify-between p-4">
                <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback className="bg-[#1877f2] text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="text-sm font-semibold">
                            {authorName}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
            <div className="w-full px-4 pb-3">
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
                        placeholder="Write your post..."
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
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="rounded-full bg-[#1877f2] p-1">
                        <ThumbsUp className="h-[10px] w-[10px] fill-white text-white" />
                    </div>
                    <span>324</span>
                </div>
                <div className="flex gap-2">
                    <span>48 comments</span>
                    <span>12 shares</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-around gap-1 px-4 py-1">
                <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-muted-foreground">
                    <ThumbsUp className="h-[18px] w-[18px]" />
                    <span>Like</span>
                </div>
                <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-muted-foreground">
                    <MessageCircle className="h-[18px] w-[18px]" />
                    <span>Comment</span>
                </div>
                <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-muted-foreground">
                    <Share2 className="h-[18px] w-[18px]" />
                    <span>Share</span>
                </div>
            </div>
        </Card>
    );
}
