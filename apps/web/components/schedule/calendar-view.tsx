'use client';

import { useEffect, useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    formatISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/schedule/post-card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Schedule } from '@prisma/client';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCurrentUser } from '@/hooks/use-current-user';
import { convertToZonedTime } from '@/lib/timezone';
import { toZonedTime } from 'date-fns-tz';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '../ui/dialog';
import { ContentCreator } from './content-create/content-creator';
import { useMonthSchedules } from '@/hooks/use-month-schedules';
import { PostDeleteDialog } from './post-delete-dialog';
import { redirect } from 'next/navigation';
import { DEFAULT_LOGOUT_REDIRECT } from '@/routes';
import { Badge } from '../ui/badge';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
    const user = useCurrentUser();

    if (!user) {
        redirect(DEFAULT_LOGOUT_REDIRECT);
    }

    const currentDate = toZonedTime(new Date(), user.timeZone);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState<Schedule | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        undefined,
    );

    // For delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

    // Use TanStack Query for schedules
    const { data: fetchedSchedules, isLoading: isLoadingSchedules } =
        useMonthSchedules({
            currentMonth,
            timezone: user.timeZone,
            enabled: !!user.timeZone,
        });

    // Format posts with the user's timezone - This ensures we only convert once
    const postsFormatted =
        fetchedSchedules
            ?.map((post: Schedule) => ({
                ...post,
                date: convertToZonedTime(post.date, user.timeZone),
            }))
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            ) || [];

    useEffect(() => {
        if (!isDialogOpen) {
            setSelectedDate(undefined);
        }
    }, [isDialogOpen]);

    // Updated to open delete confirmation dialog
    const handleDeleteClick = (id: string) => {
        setPostToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const getDaysInMonth = (date: Date) => {
        const start = startOfWeek(startOfMonth(date));
        const end = endOfWeek(endOfMonth(date));
        return eachDayOfInterval({ start, end });
    };

    const daysInMonth = getDaysInMonth(currentMonth);

    const toDateOnly = (date: Date) => {
        return formatISO(date, { representation: 'date' });
    };

    const prevMonth = () => {
        const newDate = subMonths(currentMonth, 1);
        setCurrentMonth(newDate);
    };

    const nextMonth = () => {
        const newDate = addMonths(currentMonth, 1);
        setCurrentMonth(newDate);
    };

    const handleEditClick = (post: Schedule) => {
        setPostToEdit(post);
        setIsDialogOpen(true);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setPostToEdit(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex w-full items-center justify-between space-x-4 sm:w-auto sm:justify-start">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={prevMonth}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="min-w-[140px] text-center text-base font-semibold sm:text-lg">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={nextMonth}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    New Post
                </Button>
            </div>

            {isLoadingSchedules ? (
                <CalendarViewSkeleton />
            ) : (
                <>
                    {/* Mobile View */}
                    <div className="flex flex-col gap-6 lg:hidden">
                        {daysInMonth.map((day, index) => {
                            const dayPosts = postsFormatted.filter((post) =>
                                isSameDay(post.date, day),
                            );
                            const toDisplay =
                                isSameMonth(day, currentMonth) &&
                                dayPosts.length > 0;

                            if (!toDisplay) return null;

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between py-2">
                                        <p className="font-semibold">
                                            {format(day, 'MMMM dd')}
                                        </p>
                                        <Badge variant="secondary">
                                            {dayPosts.length}{' '}
                                            {dayPosts.length === 1
                                                ? 'item'
                                                : 'items'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {dayPosts.map((post) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                onDelete={handleDeleteClick}
                                                onEdit={handleEditClick}
                                                isOnPast={
                                                    post.date < currentDate
                                                }
                                                timeZone={user.timeZone}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 lg:grid">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="bg-gray-100 py-2 text-center font-semibold"
                            >
                                {day}
                            </div>
                        ))}
                        {daysInMonth.map((day, index) => {
                            const dayPosts = postsFormatted.filter((post) =>
                                isSameDay(post.date, day),
                            );

                            const isDateOnPast =
                                toDateOnly(day) < toDateOnly(currentDate);
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        'group relative flex h-[200px] flex-col p-2',
                                        isSameMonth(day, currentMonth)
                                            ? 'bg-white'
                                            : 'bg-gray-50 text-gray-400',
                                        isDateOnPast && 'bg-gray-50',
                                    )}
                                >
                                    <div className="mb-2 flex h-6 items-center">
                                        <p className="text-sm font-semibold leading-none text-muted-foreground">
                                            {format(day, 'd')}
                                        </p>
                                    </div>
                                    <ScrollArea className="h-full">
                                        <div className="flex flex-col gap-2">
                                            {dayPosts.map((post) => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    onDelete={handleDeleteClick}
                                                    onEdit={handleEditClick}
                                                    isOnPast={
                                                        post.date < currentDate
                                                    }
                                                    timeZone={user.timeZone}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    {dayPosts.length > 0 && (
                                        <Badge
                                            className={cn(
                                                'absolute right-2 top-2 opacity-100 transition-opacity duration-300',
                                                !isDateOnPast &&
                                                    'group-hover:opacity-0',
                                            )}
                                            variant="secondary"
                                        >
                                            {dayPosts.length}{' '}
                                            {dayPosts.length === 1
                                                ? 'item'
                                                : 'items'}
                                        </Badge>
                                    )}
                                    {!isDateOnPast && (
                                        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            handleDateClick(
                                                                day,
                                                            );
                                                        }}
                                                        className="h-6 w-6"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    align="end"
                                                    side="bottom"
                                                >
                                                    {`Schedule post to ${format(
                                                        day,
                                                        'MMMM dd',
                                                    )}`}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTitle className="sr-only">Schedule Post</DialogTitle>
                <DialogDescription className="sr-only">
                    Schedule a post to your social media accounts
                </DialogDescription>
                <DialogContent
                    className="h-full max-w-6xl sm:rounded-none lg:max-h-[80vh] lg:rounded-lg"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                    onEscapeKeyDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    <ContentCreator
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        dateFromCalendar={selectedDate}
                        postToEdit={postToEdit}
                        setPostToEdit={setPostToEdit}
                    />
                </DialogContent>
            </Dialog>

            {/* Add the delete confirmation dialog */}
            <PostDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                postId={postToDelete}
            />
        </div>
    );
}

const CalendarViewSkeleton = () => {
    return (
        <>
            {/* Mobile Skeleton View */}
            <div className="flex flex-col gap-6 lg:hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between py-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {Array.from({
                                length: (index % 3) + 1,
                            }).map((_, postIndex) => (
                                <div
                                    key={postIndex}
                                    className="rounded-lg border p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Skeleton className="h-8 w-8 rounded" />
                                            <Skeleton className="h-8 w-8 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Skeleton View */}
            <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 lg:grid">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="bg-gray-100 py-2 text-center font-semibold"
                    >
                        {day}
                    </div>
                ))}
                {Array.from({ length: 35 }).map((_, index) => (
                    <div
                        key={index}
                        className="group relative flex h-[200px] flex-col bg-white p-2"
                    >
                        <div className="mb-2 flex h-6 items-center">
                            <Skeleton className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {index % 7 > 4 && (
                                <div className="rounded border p-2">
                                    <Skeleton className="mb-1 h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            )}
                            {index % 11 > 8 && (
                                <div className="rounded border p-2">
                                    <Skeleton className="mb-1 h-3 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            )}
                        </div>
                        {index % 5 > 2 && (
                            <Skeleton className="absolute right-2 top-2 h-5 w-12 rounded-full" />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};
