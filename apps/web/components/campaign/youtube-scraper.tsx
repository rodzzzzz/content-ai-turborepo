import { cn, kFormatter } from '@/lib/utils';
import { ClockIcon, EyeIcon, HeartIcon, TvIcon } from 'lucide-react';

export type YouTubeScraperType = {
    title: string;
    viewCount: number;
    likes: number;
    duration: number;
    channelName: string;
    summary: string;
};

export function YouTubeScraper({
    scrapedContent,
    className,
    ...props
}: {
    scrapedContent: YouTubeScraperType;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-lg border p-4',
                className,
            )}
            {...props}
        >
            <div className="flex items-start gap-2">
                <p className="line-clamp-2 text-sm font-medium">
                    {scrapedContent.title}
                </p>
                <div className="ml-auto flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                    <EyeIcon className="h-3 w-3" />
                    <p>{kFormatter(scrapedContent.viewCount)}</p>
                    <HeartIcon className="ml-1 h-3 w-3" />
                    <p>{kFormatter(scrapedContent.likes)}</p>
                </div>
            </div>

            <p className="line-clamp-4 text-xs text-muted-foreground">
                {scrapedContent.summary}
            </p>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <TvIcon className="h-3 w-3" />
                    <p className="text-xs">{scrapedContent.channelName}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <p className="text-xs">{scrapedContent.duration}</p>
                </div>
            </div>
        </div>
    );
}
