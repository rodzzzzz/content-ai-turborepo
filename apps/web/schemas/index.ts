import * as z from 'zod';
import { passwordSchema } from '@/lib/validations/password';

export const NewPasswordSchema = z.object({
    password: passwordSchema,
});

export const ResetSchema = z.object({
    email: z.string().email({
        message: 'Email is required',
    }),
});

export const LoginSchema = z.object({
    email: z.string().email({
        message: 'Email is required',
    }),
    password: z.string().min(1, {
        message: 'Password is required',
    }),
    code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
    email: z.string().email({
        message: 'Email is required',
    }),
    password: passwordSchema,
    name: z.string().min(1, {
        message: 'Name is required',
    }),
});
