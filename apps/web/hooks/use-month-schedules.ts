'use client';

import { useQuery } from '@tanstack/react-query';
import { Schedule } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface UseMonthSchedulesOptions {
    currentMonth: Date;
    timezone?: string;
    enabled?: boolean;
}

export function useMonthSchedules({
    currentMonth,
    timezone,
    enabled = true,
}: UseMonthSchedulesOptions) {
    // Ensure dates are calculated in the user's timezone
    const monthStart = timezone
        ? startOfMonth(toZonedTime(currentMonth, timezone))
        : startOfMonth(currentMonth);
    const monthEnd = timezone
        ? endOfMonth(toZonedTime(currentMonth, timezone))
        : endOfMonth(currentMonth);

    return useQuery({
        queryKey: ['schedules', 'month', monthStart.toISOString(), timezone],
        queryFn: async () => {
            const url = new URL('/api/schedule', window.location.origin);
            url.searchParams.set('startDate', monthStart.toISOString());
            url.searchParams.set('endDate', monthEnd.toISOString());

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch schedules');
            }

            const data = await response.json();
            return data as Schedule[];
        },
        enabled: enabled && !!timezone, // Only run if enabled and timezone is available
        staleTime: 3 * 60 * 1000, // 3 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
