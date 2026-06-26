import { cn } from '@/lib/utils';
import { Platform } from '@prisma/client';
import { RssIcon } from 'lucide-react';
import Image from 'next/image';

export const platformImage = (
    platform: Platform,
    className?: React.HTMLAttributes<HTMLDivElement>['className'],
    key?: React.Key,
) => {
    switch (platform) {
        case Platform.FACEBOOK:
            return (
                <Image
                    key={key}
                    src="/facebook.svg"
                    alt={platform || 'platform'}
                    className={cn('h-4 w-4', className)}
                    width={16}
                    height={16}
                />
            );
        case Platform.TWITTER:
            return (
                <Image
                    key={key}
                    src="/twitter.svg"
                    alt={platform || 'platform'}
                    className={cn('h-4 w-4', className)}
                    width={16}
                    height={16}
                />
            );
        case Platform.LINKEDIN:
            return (
                <Image
                    key={key}
                    src="/linkedin.svg"
                    alt={platform || 'platform'}
                    className={cn('h-4 w-4', className)}
                    width={16}
                    height={16}
                />
            );
        default:
            return null;
    }
};
