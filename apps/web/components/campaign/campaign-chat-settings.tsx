'use client';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Platform } from '@prisma/client';
import Image from 'next/image';
import { platformImage } from '@/constants/platform-images';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { addDays, differenceInDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

interface CampaignChatSettingsProps {
    selectedPlatforms: Platform[];
    setSelectedPlatforms: (
        value: Platform[] | ((prev: Platform[]) => Platform[]),
    ) => void;
    dateRange: DateRange | undefined;
    setDateRange: (value: DateRange | undefined) => void;
    disabled?: boolean;
    // includeBlogPosts: boolean;
    // setIncludeBlogPosts: (value: boolean) => void;
}

export function CampaignChatSettings({
    selectedPlatforms,
    setSelectedPlatforms,
    dateRange,
    setDateRange,
    disabled = false,
    // includeBlogPosts,
    // setIncludeBlogPosts,
}: CampaignChatSettingsProps) {
    const togglePlatform = (platform: Platform) => {
        if (
            selectedPlatforms.length === 1 &&
            selectedPlatforms.includes(platform)
        ) {
            toast({
                description: 'You must select at least one platform.',
            });
            return;
        }

        setSelectedPlatforms((prev) =>
            prev.includes(platform)
                ? prev.filter((p) => p !== platform)
                : [...prev, platform],
        );
    };

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        if (!range?.from) {
            setDateRange(undefined);
            return;
        }

        if (range.to) {
            const daysDiff = differenceInDays(range.to, range.from);
            if (daysDiff > 30) {
                // If range is more than 30 days, adjust the end date
                setDateRange({
                    from: range.from,
                    to: addDays(range.from, 30),
                });

                toast({
                    description: 'The maximum date range is 30 days.',
                });

                return;
            }
        }

        setDateRange(range);
    };

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            className="flex items-center gap-1 p-1"
                        >
                            <div
                                className={cn(
                                    'flex items-center gap-1',
                                    selectedPlatforms.length > 1 && 'mx-1',
                                )}
                            >
                                {selectedPlatforms.map((platform) =>
                                    platformImage(
                                        platform.toUpperCase() as keyof typeof platformImage,
                                        cn(
                                            'h-5 w-5 flex-shrink-0 rounded-full border-2 border-white',
                                            selectedPlatforms.length > 1 &&
                                                '-m-1',
                                        ),
                                        platform,
                                    ),
                                )}
                                {/* {includeBlogPosts && (
                                    <div className="-ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-orange-500 p-0.5">
                                        <RssIcon className="flex-shrink stroke-2 text-white" />
                                    </div>
                                )} */}
                            </div>

                            {dateRange && (
                                <>
                                    <Separator
                                        orientation="vertical"
                                        className="mx-1"
                                    />

                                    <Badge
                                        variant="outline"
                                        className="rounded-sm border-dashed border-primary bg-primary/20 px-1.5 text-xs"
                                    >
                                        {dateRange.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(
                                                        dateRange.from,
                                                        'LLL dd',
                                                    )}{' '}
                                                    -{' '}
                                                    {format(
                                                        dateRange.to,
                                                        'LLL dd',
                                                    )}
                                                </>
                                            ) : (
                                                format(dateRange.from, 'LLL dd')
                                            )
                                        ) : (
                                            'Campaign Date'
                                        )}
                                    </Badge>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Campaign Settings</p>
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-72 p-4" align="start">
                <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground">
                        Platforms
                    </h3>
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="facebook"
                            className="flex items-center gap-2 text-xs"
                        >
                            <Image
                                src="/facebook.svg"
                                alt="Facebook"
                                width={12}
                                height={12}
                                className="h-4 w-4 rounded-sm"
                            />
                            Facebook
                        </Label>
                        <Switch
                            id="facebook"
                            className="h-4 w-8"
                            thumbClassName="h-3 w-3 [state=checked]:translate-x-3"
                            checked={selectedPlatforms.includes(
                                Platform.FACEBOOK,
                            )}
                            onCheckedChange={() =>
                                togglePlatform(Platform.FACEBOOK)
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="linkedin"
                            className="flex items-center gap-2 text-xs"
                        >
                            <Image
                                src="/linkedin.svg"
                                alt="LinkedIn"
                                width={12}
                                height={12}
                                className="h-4 w-4 rounded-sm"
                            />
                            LinkedIn
                        </Label>
                        <Switch
                            id="linkedin"
                            className="h-4 w-8"
                            thumbClassName="h-3 w-3 [state=checked]:translate-x-3"
                            checked={selectedPlatforms.includes(
                                Platform.LINKEDIN,
                            )}
                            onCheckedChange={() =>
                                togglePlatform(Platform.LINKEDIN)
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="x"
                            className="flex items-center gap-2 text-xs"
                        >
                            <Image
                                src="/twitter.svg"
                                alt="X"
                                width={12}
                                height={12}
                                className="h-4 w-4 rounded-sm"
                            />
                            X (Twitter)
                        </Label>
                        <Switch
                            id="x"
                            className="h-4 w-8"
                            thumbClassName="h-3 w-3 [state=checked]:translate-x-3"
                            checked={selectedPlatforms.includes(
                                Platform.TWITTER,
                            )}
                            onCheckedChange={() =>
                                togglePlatform(Platform.TWITTER)
                            }
                        />
                    </div>

                    {/* TODO: Implement using blog posts later */}
                    {/*<h3 className="mt-2 text-xs font-medium text-muted-foreground">
                        Additional Settings
                    </h3>

                     <div className="flex items-center justify-between">
                        <Label
                            htmlFor="blog"
                            className="flex items-center gap-2 text-xs"
                        >
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 p-0.5">
                                <RssIcon className="flex-shrink stroke-2 text-white" />
                            </div>
                            Include Blog Posts
                        </Label>
                        <Switch
                            id="blog"
                            className="h-4 w-8"
                            thumbClassName="h-3 w-3 [state=checked]:translate-x-3"
                            checked={includeBlogPosts}
                            onCheckedChange={setIncludeBlogPosts}
                        />
                    </div> */}

                    <div className="mt-2 flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="xs"
                                    className={cn(
                                        'h-6 flex-1 border border-dashed border-transparent bg-primary/10 text-primary hover:bg-primary/20',
                                        dateRange &&
                                            'border-primary bg-primary/20',
                                    )}
                                    disabled={disabled}
                                >
                                    <CalendarIcon
                                        size={12}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                        }}
                                    />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(
                                                    dateRange.from,
                                                    'LLL dd',
                                                )}{' '}
                                                -{' '}
                                                {format(dateRange.to, 'LLL dd')}
                                            </>
                                        ) : (
                                            format(dateRange.from, 'LLL dd')
                                        )
                                    ) : (
                                        'Campaign Date'
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={handleDateRangeSelect}
                                    numberOfMonths={2}
                                    disabled={(date) =>
                                        date <
                                        new Date(
                                            new Date().setHours(0, 0, 0, 0),
                                        )
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                        {dateRange && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setDateRange(undefined);
                                }}
                                disabled={disabled}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
