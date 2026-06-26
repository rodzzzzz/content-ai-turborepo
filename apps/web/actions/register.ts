'use server';

import * as z from 'zod';

import { db } from '@/lib/db';
import { RegisterSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { hashPassword } from '@/lib/password';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await hashPassword(password);

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
        return { error: 'Email already in use!' };
    }

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(
        verificationToken.email,
        name,
        verificationToken.token,
    );

    return { success: 'Confirmation email sent!' };
};
