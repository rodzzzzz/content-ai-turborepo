import { z } from "zod";
import { passwordSchema } from "./validations/password";

export const LoginSchema = z.object({
  email: z.email({ message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  code: z.string().optional(),
});

export const RegisterSchema = z.object({
  email: z.email({ message: "Email is required" }),
  password: passwordSchema,
  name: z.string().min(1, { message: "Name is required" }),
});

export const ResetSchema = z.object({
  email: z.email({ message: "Email is required" }),
});

export const NewPasswordSchema = z.object({
  password: passwordSchema,
});
