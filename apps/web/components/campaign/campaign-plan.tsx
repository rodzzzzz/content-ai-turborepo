import { ChevronRightIcon, SquareTerminalIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/card';
import { CampaignType } from '@/types/campaign';
import { Button } from '../ui/button';
import { isEmpty } from 'lodash';
import { platformImage } from '@/constants/platform-images';

export const CampaignPlan = ({ campaign }: { campaign: CampaignType }) => {
    return (
        <div
            className="group relative max-w-xl cursor-pointer py-2"
        >
            <Card className="relative flex items-center justify-between gap-2 p-4 shadow-none transition-all group-hover:border-primary/50">
                {campaign.changesSummary &&
                    !isEmpty(campaign.campaign) ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <h4 className="text-sm font-semibold">
                                {campaign.changesSummary}
                            </h4>

                            <div className="ml-1 flex items-center gap-1">
                                {campaign.campaign.map(
                                    (campaignItem, index) =>
                                        platformImage(
                                            campaignItem.platform.toUpperCase() as keyof typeof platformImage,
                                            '-m-1 h-5 w-5 rounded-full border-2 border-white',
                                            `${campaign.id}-${campaignItem.platform}-${index}`,
                                        ),
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="icon">
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex flex-col gap-2">
                            <div className="h-5 w-[200px] animate-pulse rounded-md bg-muted" />
                            <div className="h-[22px] w-[100px] animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
                    </div>
                )}
            </Card>
        </div>
    );
};

interface PromptStreamingDisplayProps {
    prompt: string;
    title?: string;
    height?: string;
    className?: string;
}

export const PromptStreamingDisplay = ({
    prompt,
    title = 'Creating prompt...',
    className = '',
}: PromptStreamingDisplayProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex max-w-2xl flex-col gap-4 py-3 ${className}`}
        >
            <div className="flex animate-pulse items-center gap-2">
                <SquareTerminalIcon className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm font-medium">{title}</p>
            </div>
            <div className="relative h-full w-full">
                <div
                    ref={(el) => {
                        if (el) {
                            el.scrollTop = el.scrollHeight;
                        }
                    }}
                    className="scrollbar-hide relative h-full max-h-48 w-full overflow-y-auto scroll-smooth whitespace-pre-wrap text-left text-xs text-muted-foreground"
                >
                    {prompt}
                </div>
                <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b from-background via-transparent to-background" />
            </div>
        </motion.div>
    );
};
