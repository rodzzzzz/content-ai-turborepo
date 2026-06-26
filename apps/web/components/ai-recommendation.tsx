'use client';

import { Calendar, InfoIcon, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';
import { Button, MagicButton } from './ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';
import { useAIRecommendations } from '@/hooks/use-ai-recommendation';
import { AIRecommendation } from '@/actions/tools/ai-recommendation';
import { Badge } from './ui/badge';
import Image from 'next/image';
import { MagicShadow } from './ui/magic-shadow';

interface AIRecommendationsProps {
    className?: React.HTMLAttributes<HTMLDivElement>['className'];
}

// Mock data to use when the server returns empty
const mockData = [
    {
        title: 'Optimal Posting Time',
        description:
            'Based on your audience activity, try posting on Twitter between 8-10 AM and 7-9 PM for maximum engagement.',
        iconType: 'calendar',
        priorityLevel: 'high',
    },
    {
        title: 'Content Strategy',
        description:
            'Video content is outperforming images by 34%. Consider creating more video content for Instagram and Facebook.',
        iconType: 'twitter',
        priorityLevel: 'medium',
    },
    {
        title: 'Engagement Opportunity',
        description:
            'Your LinkedIn audience is growing but engagement is low. Try posting more industry insights and professional content.',
        iconType: 'linkedin',
        priorityLevel: 'low',
    },
];

export function AIRecommendations({ className }: AIRecommendationsProps) {
    const [open, setOpen] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);

    // Fetch data using our recommendations hook only when triggered
    const { data, isLoading, isError } = useAIRecommendations(shouldFetch);

    const isEmpty = data?.isEmpty || !data?.data || data.data.length === 0;

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen && !shouldFetch) {
            setShouldFetch(true);
        }
    };

    const renderContent = () => {
        // Custom sorting function for priority levels (high → medium → low)
        const getPriorityValue = (priority: string): number => {
            switch (priority.toLowerCase()) {
                case 'high':
                    return 3;
                case 'medium':
                    return 2;
                case 'low':
                    return 1;
                default:
                    return 0;
            }
        };

        const sortedRecommendations = data?.data?.sort(
            (a, b) =>
                getPriorityValue(b.priorityLevel) -
                getPriorityValue(a.priorityLevel),
        );

        // Use mock data if the server returns empty
        const recommendationsToShow = isEmpty
            ? mockData
            : sortedRecommendations || [];

        // Render error state
        if (isError || data?.isError) {
            return (
                <div className="flex h-full items-center justify-center py-6">
                    <Alert variant="destructive" className="w-full max-w-md">
                        <InfoIcon className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {data?.error || 'Failed to load recommendations'}
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        // Render loading state
        if (isLoading) {
            return (
                <div className="h-full space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <MagicShadow variant="animated-sm" key={i}>
                            <div className="relative flex flex-1 flex-col gap-2 rounded-lg border bg-background p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                                <div className="w-full">
                                    <Skeleton className="mb-2 h-4 w-1/3" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="mt-1 h-3 w-2/3" />
                                </div>
                            </div>
                        </MagicShadow>
                    ))}
                </div>
            );
        }

        return (
            <div className={cn('relative h-full w-full', className)}>
                {isEmpty && (
                    <div className="absolute -inset-4 z-10 flex h-[calc(100%+2rem)] items-center justify-center bg-opacity-20 bg-clip-padding backdrop-blur-sm backdrop-filter">
                        <Alert className="w-fit" variant="primary">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>No Generated Suggestions</AlertTitle>
                            <AlertDescription>
                                There&apos;s not enough data to generate
                                suggestions.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <ScrollArea
                    className="relative h-full"
                    isFullHeight
                    type="auto"
                >
                    <div className="absolute inset-0 space-y-4">
                        {recommendationsToShow.map((recommendation) => (
                            <RecommendationCard
                                key={recommendation.title}
                                title={recommendation.title}
                                description={recommendation.description}
                                iconType={recommendation.iconType}
                                priorityLevel={recommendation.priorityLevel}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        );
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <MagicButton>
                    AI Suggestion
                    <Sparkles
                        fill="currentColor"
                        className="h-4 w-4 text-yellow-400"
                    />
                </MagicButton>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col sm:max-w-[600px]">
                <SheetHeader className="space-y-0">
                    <SheetTitle>AI Suggestions</SheetTitle>
                    <SheetDescription>
                        Get personalized suggestions for your social media
                        strategy.
                    </SheetDescription>
                </SheetHeader>
                {renderContent()}
                <SheetFooter className="w-full">
                    <div className="flex w-full flex-col gap-2">
                        <div className="flex items-center gap-2 rounded-md bg-muted p-4 text-muted-foreground">
                            <InfoIcon className="h-4 w-4 flex-shrink-0" />
                            <p className="text-xs">
                                Suggestions are based on your post performance
                                and engagement for the past 7 days.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Close
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function RecommendationCard({
    title,
    description,
    iconType,
    priorityLevel,
}: AIRecommendation) {
    let recommendationTypes;

    switch (iconType) {
        case 'calendar':
            recommendationTypes = (
                <Calendar className="h-5 w-5 fill-orange-200 stroke-orange-500" />
            );
            break;
        case 'twitter':
            recommendationTypes = (
                <Image
                    src="/twitter.svg"
                    alt="Twitter"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                />
            );

            break;
        case 'facebook':
            recommendationTypes = (
                <Image
                    src="/facebook.svg"
                    alt="Facebook"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                />
            );

            break;
        case 'instagram':
            recommendationTypes = (
                <Image
                    src="/instagram.svg"
                    alt="Instagram"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                />
            );

            break;
        case 'linkedin':
            recommendationTypes = (
                <Image
                    src="/linkedin.svg"
                    alt="Linkedin"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                />
            );

            break;
        default:
            recommendationTypes = (
                <InfoIcon className="h-5 w-5 fill-gray-200 stroke-gray-500" />
            );
            break;
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-2">
                {recommendationTypes}
                <Badge
                    variant={
                        priorityLevel === 'high'
                            ? 'negative'
                            : priorityLevel === 'medium'
                              ? 'mid'
                              : 'positive'
                    }
                    className="h-fit w-fit capitalize"
                >
                    {priorityLevel}
                </Badge>
            </div>
            <div className="flex-1">
                <h4 className="mb-1 text-sm font-medium">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
