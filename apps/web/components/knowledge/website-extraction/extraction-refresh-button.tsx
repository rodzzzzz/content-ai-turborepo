import { Button } from '@/components/ui/button';
import { useUpdateExtractedContent } from '@/hooks/use-knowledge-mutations';
import { cn } from '@/lib/utils';
import { ExtractedLink } from '@/lib/validations/website-extraction';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExtractionRefreshButtonProps {
    linkId: string;
    extractedLinks: ExtractedLink[];
}

export default function ExtractionRefreshButton({
    linkId,
    extractedLinks,
}: ExtractionRefreshButtonProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {
        mutate: updateExtractedContent,
        isPending,
        isSuccess,
    } = useUpdateExtractedContent();

    const handleRefresh = async (linkId: string) => {
        setIsRefreshing(true);

        const link = extractedLinks.find((l) => l.id === linkId);
        if (!link) return;

        updateExtractedContent({
            linkId,
            title: link.title,
            content: link.content,
            url: link.url,
        });
    };

    useEffect(() => {
        if (isSuccess) {
            setIsRefreshing(false);
        }
    }, [isSuccess]);

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRefresh(linkId)}
            disabled={isRefreshing || isPending}
        >
            <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
        </Button>
    );
}
