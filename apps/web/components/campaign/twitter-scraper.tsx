import { cn, kFormatter } from '@/lib/utils';
import {
    BadgeCheckIcon,
    HeartIcon,
    Repeat2Icon,
    ReplyIcon,
} from 'lucide-react';

export type TwitterScraperType = {
    text: string;
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    author: {
        userName: string;
        isBlueVerified: boolean;
    };
};

export function TwitterScraper({
    scrapedContent,
    className,
    ...props
}: {
    scrapedContent: TwitterScraperType;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-lg border p-4',
                className,
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <p className="text-sm font-medium">
                        @{scrapedContent.author.userName}
                    </p>
                    {scrapedContent.author.isBlueVerified && (
                        <BadgeCheckIcon className="h-4 w-4 fill-[#1D9BF0] text-white" />
                    )}
                </div>
                <div className="ml-auto flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                    <Repeat2Icon className="h-3 w-3" />
                    <p>{kFormatter(scrapedContent.retweetCount)}</p>
                    <ReplyIcon className="ml-1 h-3 w-3" />
                    <p>{kFormatter(scrapedContent.replyCount)}</p>
                    <HeartIcon className="ml-1 h-3 w-3" />
                    <p>{kFormatter(scrapedContent.likeCount || 0)}</p>
                </div>
            </div>

            <p className="line-clamp-4 text-xs text-muted-foreground">
                {scrapedContent.text}
            </p>
        </div>
    );
}
