'use server';

import { db } from '@/lib/db';
import { unstable_update } from '@/auth';
import { currentUser } from '@/lib/auth';
import { SetupStep } from '@/types/setup';

export async function updateUserSetup(step: SetupStep['id']) {
    const user = await currentUser();

    if (!user || !user.id) {
        return { error: 'Unauthorized' };
    }

    // Update setup status in database and session if step is not already completed
    if (!user.setupSteps.includes(step)) {
        await db.user.update({
            where: { id: user.id },
            data: {
                setupSteps: [...user.setupSteps, step],
            },
        });

        // Update session
        await unstable_update({
            user: {
                setupSteps: [...user.setupSteps, step],
            },
        });
    }
}
