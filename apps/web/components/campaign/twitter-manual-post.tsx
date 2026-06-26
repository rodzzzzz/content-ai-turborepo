'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRightIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TwitterManualPostProps {
    content: string;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
    variant?:
        | 'default'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
        | 'destructive';
}

export function TwitterManualPost({
    content,
    className,
    size = 'sm',
    variant = 'default',
}: TwitterManualPostProps) {
    const [isPosting, setIsPosting] = useState(false);
    const { toast } = useToast();

    const handlePostToTwitter = async () => {
        try {
            setIsPosting(true);

            // Encode the content for URL
            const encodedContent = encodeURIComponent(content);

            // Create Twitter intent URL with pre-filled text
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedContent}`;

            // Open Twitter in a new tab
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');

            toast({
                title: 'Opening Twitter',
                description:
                    'Your content has been copied to Twitter. You can now post it manually.',
            });
        } catch (error) {
            console.error('Error opening Twitter:', error);
            toast({
                title: 'Error',
                description: 'Failed to open Twitter. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Button
            onClick={handlePostToTwitter}
            disabled={isPosting}
            size={size}
            variant={variant}
            className={cn('gap-1', className)}
        >
            {isPosting ? 'Opening...' : 'Post Manually'}
            <ArrowUpRightIcon className="h-3 w-3" />
        </Button>
    );
}
