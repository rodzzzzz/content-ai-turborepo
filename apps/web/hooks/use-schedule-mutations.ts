'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Schedule, Status } from '@prisma/client';
import { ContentFormValues } from '@/components/schedule/content-create/content-creator';

type ScheduleData = Pick<
    Schedule,
    'date' | 'content' | 'platform' | 'mediaUrl' | 'status'
> & {
    id?: string;
};

// Create a new schedule
export function useCreateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ScheduleData) => {
            if (data.status === 'PUBLISHED') {
                return data;
            }

            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                if (response.status === 422) {
                    throw new Error('Date is in the past');
                }
                throw new Error('Failed to create schedule');
            }

            return response.json() as Promise<ScheduleData>;
        },
        onSuccess: (newSchedule) => {
            // Update the schedules list
            queryClient.setQueryData<ScheduleData[]>(
                ['schedules'],
                (old = []) => [...old, newSchedule],
            );

            // Find all active month queries and update them if the new schedule falls within their date range
            const queryCache = queryClient.getQueryCache();
            const monthQueries = queryCache.findAll({
                queryKey: ['schedules', 'month'],
            });

            monthQueries.forEach((query) => {
                // The query key is ['schedules', 'month', monthStartISO, timezone]
                const queryKey = query.queryKey;
                if (queryKey.length >= 3) {
                    const monthStartISO = queryKey[2] as string;
                    const monthStart = new Date(monthStartISO);

                    // Extract the month end from the month start (last day of that month)
                    const monthEnd = new Date(monthStart);
                    monthEnd.setMonth(monthEnd.getMonth() + 1);
                    monthEnd.setDate(0); // Last day of the month
                    monthEnd.setHours(23, 59, 59, 999); // End of the day

                    const scheduleDate = new Date(newSchedule.date);

                    // If the new schedule falls within this month's range, update the cache
                    if (
                        scheduleDate >= monthStart &&
                        scheduleDate <= monthEnd
                    ) {
                        queryClient.setQueryData<ScheduleData[]>(
                            query.queryKey,
                            (old = []) => [...old, newSchedule],
                        );
                    }
                }
            });

            // Alternative: Just invalidate all month queries to force a refetch
            // This is simpler but causes a network request
            // queryClient.invalidateQueries({
            //   queryKey: ['schedules', 'month'],
            //   refetchType: 'active',
            // });
        },
    });
}

// Update an existing schedule
export function useUpdateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: ScheduleData;
        }) => {
            const response = await fetch(`/api/schedule/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update schedule');
            }

            return response.json() as Promise<ScheduleData>;
        },
        onSuccess: (updatedSchedule) => {
            // Update the schedules list
            queryClient.setQueryData<ScheduleData[]>(
                ['schedules'],
                (old = []) =>
                    old?.map((schedule) =>
                        schedule.id === updatedSchedule.id
                            ? updatedSchedule
                            : schedule,
                    ) || [],
            );

            // Update all month queries containing this schedule
            const queryCache = queryClient.getQueryCache();
            const monthQueries = queryCache.findAll({
                queryKey: ['schedules', 'month'],
            });

            monthQueries.forEach((query) => {
                queryClient.setQueryData<ScheduleData[]>(
                    query.queryKey,
                    (old = []) =>
                        old?.map((schedule) =>
                            schedule.id === updatedSchedule.id
                                ? updatedSchedule
                                : schedule,
                        ) || [],
                );
            });
        },
    });
}

// Delete a schedule
export function useDeleteSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/schedule/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete schedule');
            }

            return id;
        },
        onSuccess: (deletedId) => {
            // Update the schedules list
            queryClient.setQueryData<ScheduleData[]>(
                ['schedules'],
                (old = []) =>
                    old?.filter((schedule) => schedule.id !== deletedId) || [],
            );

            // Update all month queries
            const queryCache = queryClient.getQueryCache();
            const monthQueries = queryCache.findAll({
                queryKey: ['schedules', 'month'],
            });

            monthQueries.forEach((query) => {
                queryClient.setQueryData<ScheduleData[]>(
                    query.queryKey,
                    (old = []) =>
                        old?.filter((schedule) => schedule.id !== deletedId) ||
                        [],
                );
            });
        },
    });
}
