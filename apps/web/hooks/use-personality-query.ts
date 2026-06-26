import { useQuery } from '@tanstack/react-query';
import { getPersonality } from '@/actions/personality';

export function usePersonality() {
    return useQuery({
        queryKey: ['personality'],
        queryFn: async () => {
            const result = await getPersonality();
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch personality');
            }
            return result.data;
        },
    });
}
