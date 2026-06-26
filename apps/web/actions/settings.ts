'use server';

import * as z from 'zod';

import { unstable_update } from '@/auth';
import { db } from '@/lib/db';
import { getUserById } from '@/data/user';
import { currentUser } from '@/lib/auth';
// import { generateVerificationToken } from '@/lib/tokens';
// import { sendVerificationEmail } from '@/lib/mail';
import { userDetailsSchema, userPasswordSchema } from '@/lib/validations/user';
import { comparePassword, hashPassword } from '@/lib/password';

export const userDetails = async (
    values: z.infer<typeof userDetailsSchema>,
) => {
    const user = await currentUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    const dbUser = await getUserById(user.id!);

    if (!dbUser) {
        return { error: 'Unauthorized' };
    }

    // if (user.isOAuth) {
    //     values.email = undefined;
    //     values.isTwoFactorEnabled = undefined;
    // }

    // if (values.email && values.email !== user.email) {
    //     const existingUser = await getUserByEmail(values.email);

    //     if (existingUser && existingUser.id !== user.id) {
    //         return { error: 'Email already in use' };
    //     }

    //     const verificationToken = await generateVerificationToken(values.email);
    //     await sendVerificationEmail(
    //         verificationToken.email,
    //         existingUser.name || 'there',
    //         verificationToken.token,
    //     );

    //     return { success: 'Verification email sent' };
    // }

    const updatedUser = await db.user.update({
        where: { id: dbUser.id },
        data: {
            name: values.name,
            // email: values.email,
            isTwoFactorEnabled: values.isTwoFactorEnabled,
            timeZone: values.timeZone || undefined,
        },
    });

    await unstable_update({
        user: {
            name: updatedUser.name,
            email: updatedUser.email,
            isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
            timeZone: updatedUser.timeZone || undefined,
        },
    });

    return { success: 'User details has been updated' };
};

export const userPassword = async (
    values: z.infer<typeof userPasswordSchema>,
) => {
    const user = await currentUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    if (values.newPassword !== values.confirmNewPassword) {
        return { error: 'Passwords do not match' };
    }

    const dbUser = await getUserById(user.id!);

    if (!dbUser) {
        return { error: 'Unauthorized' };
    }

    if (user.isOAuth) {
        values.password = undefined;
        values.newPassword = undefined;
    }

    if (values.password && values.newPassword && dbUser.password) {
        const passwordsMatch = await comparePassword(
            values.password,
            dbUser.password,
        );

        if (!passwordsMatch) {
            return { error: 'Incorrect password' };
        }

        const hashedPassword = await hashPassword(values.newPassword);
        values.password = hashedPassword;
        values.newPassword = undefined;
    }

    await db.user.update({
        where: { id: dbUser.id },
        data: {
            password: values.password,
        },
    });

    return { success: 'Password was updated' };
};
