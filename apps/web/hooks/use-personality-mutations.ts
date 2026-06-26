import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    updateWritingStyle,
    updateInterests,
    updatePlatformGuidelines,
} from '@/actions/personality';
import { extractPersonalityFromWebsite } from '@/actions/website-extraction';
import {
    PersonalityFormValues,
    InterestFormValues,
    PlatformGuidelinesFormValues,
} from '@/lib/validations/personality';
import { toast } from '@/hooks/use-toast';
import { updateUserSetup } from '@/actions/setup';

export function useUpdateWritingStyle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: PersonalityFormValues) => {
            const result = await updateWritingStyle(data);
            if (!result.success) {
                throw new Error(
                    result.error || 'Failed to update writing style',
                );
            }

            await updateUserSetup('personality');

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personality'] });
            toast({
                description: 'Writing style preferences updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useUpdatePlatformGuidelines() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: PlatformGuidelinesFormValues) => {
            const result = await updatePlatformGuidelines(data);
            if (!result.success) {
                throw new Error(
                    result.error || 'Failed to update platform guidelines',
                );
            }

            await updateUserSetup('personality');

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personality'] });
            toast({
                description: 'Platform guidelines updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useUpdateInterests() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: InterestFormValues) => {
            const result = await updateInterests(data);
            if (!result.success) {
                throw new Error(result.error || 'Failed to update interests');
            }

            await updateUserSetup('personality');

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interests'] });
            toast({
                description: 'Interests updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useExtractPersonality() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (url: string) => {
            const result = await extractPersonalityFromWebsite(url);
            if (!result.success) {
                throw new Error(
                    result.error || 'Failed to extract personality',
                );
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personality'] });
            toast({
                description: 'Personality extracted successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
