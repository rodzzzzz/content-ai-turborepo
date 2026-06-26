import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { passwordSchema } from './password';

export const userDetailsSchema = z.object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    image: z.optional(z.string()),
    timeZone: z.optional(z.string()),
});

export const userPasswordSchema = z
    .object({
        password: z.optional(z.string().min(6)),
        newPassword: z.optional(passwordSchema),
        confirmNewPassword: z.optional(z.string().min(6)),
    })
    .refine(
        (data) => {
            if (
                (data.password || data.confirmNewPassword) &&
                !data.newPassword
            ) {
                return false;
            }

            return true;
        },
        {
            message: 'New password is required!',
            path: ['newPassword'],
        },
    )
    .refine(
        (data) => {
            if (
                (data.newPassword || data.confirmNewPassword) &&
                !data.password
            ) {
                return false;
            }

            return true;
        },
        {
            message: 'Password is required!',
            path: ['password'],
        },
    )
    .refine(
        (data) => {
            if (
                (data.newPassword || data.password) &&
                !data.confirmNewPassword
            ) {
                return false;
            }

            return true;
        },
        {
            message: 'Confirm new password is required!',
            path: ['confirmNewPassword'],
        },
    );

export const userRoleSchema = z.object({
    role: z.nativeEnum(UserRole),
});
