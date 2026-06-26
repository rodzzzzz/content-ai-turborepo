'use client';

import { motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { PlatformInsightsCard } from '../dashboard/platform-insights';
import { PlatformInsight } from '@/actions/tools/insight';
import { ContentEvaluation, ContentEvaluationType } from './content-evaluation';
import { TwitterScraper, TwitterScraperType } from './twitter-scraper';
import { Badge } from '../ui/badge';
import { YouTubeScraper, YouTubeScraperType } from './youtube-scraper';

interface ToolResultProps {
    toolName: string;
    result: unknown;
    isRunning?: boolean;
}

export function ToolResult({ toolName, result, isRunning }: ToolResultProps) {
    if (isEmpty(result) || !result)
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="sr-only">No result</AlertTitle>
                <AlertDescription className="text-xs">
                    No result from executed tool
                </AlertDescription>
            </Alert>
        );

    switch (toolName) {
        case 'get_user_platform_insights':
            return (
                <motion.div
                    key={isRunning ? 'running' : 'result'}
                    initial={isRunning ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2"
                >
                    {(result as PlatformInsight[]).map((insight, index) => (
                        <motion.div
                            key={index}
                            initial={
                                isRunning ? { opacity: 0, scale: 0.95 } : false
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                            }}
                        >
                            {insight ? (
                                <PlatformInsightsCard
                                    insight={insight}
                                    className="rounded-md"
                                    isEmptyInsights={false}
                                    onChat={true}
                                />
                            ) : (
                                <p className="rounded-md bg-muted p-4 text-xs italic text-muted-foreground">
                                    No insights found for this platform
                                </p>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            );

        case 'evaluateContent':
            return (
                <motion.div>
                    <ContentEvaluation
                        evaluation={result as ContentEvaluationType}
                    />
                </motion.div>
            );
        case 'youtube_scraper': {
            const scrapedResults = result as YouTubeScraperType[];
            return (
                <motion.div
                    key={isRunning ? 'running' : 'result'}
                    initial={isRunning ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex flex-col gap-2"
                >
                    {scrapedResults.map((scrapedContent, index) => (
                        <motion.div
                            key={index}
                            initial={
                                isRunning ? { opacity: 0, scale: 0.95 } : false
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                            }}
                        >
                            <YouTubeScraper scrapedContent={scrapedContent} />
                        </motion.div>
                    ))}
                </motion.div>
            );
        }
        case 'twitter_scraper': {
            const scrapedResults = result as TwitterScraperType[];
            const sortedResults = scrapedResults.sort((a, b) => {
                return (
                    b.retweetCount +
                    b.replyCount +
                    b.likeCount -
                    a.retweetCount -
                    a.replyCount -
                    a.likeCount
                );
            });
            const visibleResults = sortedResults.slice(0, 4);
            const hiddenCount = sortedResults.length - 4;
            return (
                <motion.div
                    key={isRunning ? 'running' : 'result'}
                    initial={isRunning ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex flex-col gap-2"
                >
                    {visibleResults.map((scrapedContent, index) => (
                        <motion.div
                            key={index}
                            initial={
                                isRunning ? { opacity: 0, scale: 0.95 } : false
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                            }}
                        >
                            <TwitterScraper scrapedContent={scrapedContent} />
                        </motion.div>
                    ))}
                    {hiddenCount > 0 && (
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-20 items-center justify-center">
                            <div className="absolute h-full w-full bg-gradient-to-t from-background/90 to-transparent" />
                            <Badge
                                variant="outline"
                                className="z-10 bg-background shadow-lg"
                            >
                                +{hiddenCount} more post
                                {hiddenCount > 1 ? 's' : ''}
                            </Badge>
                        </div>
                    )}
                </motion.div>
            );
        }
        default:
            return (
                <pre className="text-pretty rounded-md bg-muted p-4 text-xs">
                    {JSON.stringify(result, null, 2)}
                </pre>
            );
    }
}
