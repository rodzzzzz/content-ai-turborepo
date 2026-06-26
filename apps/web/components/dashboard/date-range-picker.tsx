'use client';

import * as React from 'react';
import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { toZonedTime } from 'date-fns-tz';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { endOfDay, format, startOfDay } from 'date-fns';

interface DatePickerWithRangeProps {
    className?: string;
    dateRange: DateRange;
    setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
    timezone: string;
}

export function DatePickerWithRange({
    className,
    dateRange,
    setDateRange,
    timezone,
}: DatePickerWithRangeProps) {
    const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (range: DateRange | undefined) => {
        if (!range) return;
        // Store the selection in temporary state without applying it
        const processedRange = {
            from: range.from ? startOfDay(range.from) : undefined,
            to: range.to ? endOfDay(range.to) : undefined,
        };
        setTempDateRange(processedRange);
    };

    const handleApply = () => {
        // Apply the temporary date range to the actual state
        setDateRange(tempDateRange);
        setIsOpen(false);
    };

    const handleCancel = () => {
        // Reset temporary state to current applied state
        setTempDateRange(dateRange);
        setIsOpen(false);
    };

    // Update temp state when dateRange prop changes
    React.useEffect(() => {
        setTempDateRange(dateRange);
    }, [dateRange]);

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen} modal>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            'w-[260px] justify-start text-left font-normal',
                            !dateRange && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                                    {format(dateRange.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(dateRange.from, 'LLL dd, y')
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex flex-col">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={tempDateRange?.from}
                            selected={tempDateRange}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                            toDate={toZonedTime(new Date(), timezone)}
                        />
                        <div className="flex items-center justify-end gap-2 border-t p-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                                disabled={
                                    !tempDateRange?.from || !tempDateRange?.to
                                }
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
