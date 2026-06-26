'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import React from 'react';

type DateTimePickerProps = {
    className?: React.ComponentProps<'div'>['className'];
    value?: Date;
    onChange: (date: Date) => void;
    disabledPast?: boolean;
    timezone?: string;
};

const toDateOnly = (date: Date) => {
    return formatISO(date || new Date(), { representation: 'date' });
};

const isToday = (date: Date) => {
    return toDateOnly(date) === toDateOnly(new Date());
};

function DateTimePicker({
    className,
    value = new Date(),
    onChange,
    disabledPast,
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: DateTimePickerProps) {
    const hours = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)];
    const minutes = Array.from({ length: 6 }, (_, i) => i * 10);
    const now = toZonedTime(new Date(), timezone);

    function handleDateSelect(date: Date | undefined) {
        if (date) {
            // When selecting today's date, set time to current time if the current value is in the past
            if (isToday(date) && date < now) {
                const newDate = new Date(date);
                newDate.setHours(
                    now.getHours(),
                    Math.ceil(now.getMinutes() / 10) * 10,
                );
                onChange(newDate);
            } else {
                onChange(date);
            }
        }
    }

    function isTimeDisabled(
        type: 'hour' | 'minute' | 'ampm',
        timeValue: string | number,
    ): boolean {
        if (!isToday(value) || !disabledPast) return false;

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const selectedHour = value.getHours();

        if (type === 'ampm') {
            if (timeValue === 'AM' && currentHour >= 12) return true;
            if (timeValue === 'PM' && currentHour < 12) return false;
            return false;
        }

        const isPM = value.getHours() >= 12;
        if (type === 'hour') {
            const hour = parseInt(timeValue.toString(), 10);
            const compareHour = isPM ? hour + 12 : hour;
            return compareHour < currentHour;
        }

        if (type === 'minute') {
            const minute = parseInt(timeValue.toString(), 10);
            if (selectedHour < currentHour) return true;
            if (selectedHour === currentHour) return minute <= currentMinute;
            return false;
        }

        return false;
    }

    function handleTimeChange(
        type: 'hour' | 'minute' | 'ampm',
        timeValue: string,
    ) {
        if (isTimeDisabled(type, timeValue)) return;

        const currentDate = value || new Date();
        const newDate = new Date(currentDate);

        if (type === 'hour') {
            const hour = parseInt(timeValue, 10);
            newDate.setHours(newDate.getHours() >= 12 ? hour + 12 : hour);
        } else if (type === 'minute') {
            newDate.setMinutes(parseInt(timeValue, 10));
        } else if (type === 'ampm') {
            const hours = newDate.getHours();
            if (timeValue === 'AM' && hours >= 12) {
                newDate.setHours(hours - 12);
            } else if (timeValue === 'PM' && hours < 12) {
                newDate.setHours(hours + 12);
            }
        }

        onChange(newDate);
    }

    return (
        <div className={cn('w-auto p-0', className)}>
            <div className="sm:flex">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={(date) =>
                        disabledPast
                            ? toDateOnly(date) < toDateOnly(new Date())
                            : false
                    }
                />
                <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
                    <ScrollArea className="w-64 sm:w-auto" type="always">
                        <div className="flex p-2 sm:flex-col">
                            {hours.map((hour) => (
                                <Button
                                    key={hour}
                                    size="icon"
                                    variant={
                                        value &&
                                        value.getHours() % 12 === hour % 12
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    disabled={isTimeDisabled('hour', hour)}
                                    className="aspect-square shrink-0 sm:w-full"
                                    onClick={() =>
                                        handleTimeChange(
                                            'hour',
                                            hour.toString(),
                                        )
                                    }
                                >
                                    {hour}
                                </Button>
                            ))}
                        </div>
                        <ScrollBar
                            orientation="horizontal"
                            className="sm:hidden"
                        />
                    </ScrollArea>
                    <ScrollArea className="w-64 sm:w-auto" type="always">
                        <div className="flex p-2 sm:flex-col">
                            {minutes.map((minute) => (
                                <Button
                                    key={minute}
                                    size="icon"
                                    variant={
                                        value && value.getMinutes() === minute
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    disabled={isTimeDisabled('minute', minute)}
                                    className="aspect-square shrink-0 sm:w-full"
                                    onClick={() =>
                                        handleTimeChange(
                                            'minute',
                                            minute.toString(),
                                        )
                                    }
                                >
                                    {minute.toString().padStart(2, '0')}
                                </Button>
                            ))}
                        </div>
                        <ScrollBar
                            orientation="horizontal"
                            className="sm:hidden"
                        />
                    </ScrollArea>
                    <ScrollArea className="">
                        <div className="flex p-2 sm:flex-col">
                            {['AM', 'PM'].map((ampm) => (
                                <Button
                                    key={ampm}
                                    size="icon"
                                    variant={
                                        value &&
                                        ((ampm === 'AM' &&
                                            value.getHours() < 12) ||
                                            (ampm === 'PM' &&
                                                value.getHours() >= 12))
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    disabled={isTimeDisabled('ampm', ampm)}
                                    className="aspect-square shrink-0 sm:w-full"
                                    onClick={() =>
                                        handleTimeChange('ampm', ampm)
                                    }
                                >
                                    {ampm}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker };
