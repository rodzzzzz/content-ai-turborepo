import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least one special character",
  });

export function hasMinLength(password: string) {
  return password.length >= 8;
}
export function hasUppercase(password: string) {
  return /[A-Z]/.test(password);
}
export function hasLowercase(password: string) {
  return /[a-z]/.test(password);
}
export function hasNumber(password: string) {
  return /[0-9]/.test(password);
}
export function hasSpecialChar(password: string) {
  return /[^A-Za-z0-9]/.test(password);
}
export function getPasswordStrength(password: string) {
  let strength = 0;
  if (hasMinLength(password)) strength++;
  if (hasUppercase(password)) strength++;
  if (hasLowercase(password)) strength++;
  if (hasNumber(password)) strength++;
  if (hasSpecialChar(password)) strength++;
  return strength;
}
export function getPasswordStrengthLabel(password: string) {
  const strength = getPasswordStrength(password);
  if (strength === 0) return { label: "Very Weak", color: "bg-red-500" };
  if (strength <= 2) return { label: "Weak", color: "bg-orange-500" };
  if (strength <= 3) return { label: "Medium", color: "bg-yellow-500" };
  if (strength <= 4) return { label: "Strong", color: "bg-green-500" };
  return { label: "Very Strong", color: "bg-green-600" };
}
export function getPasswordRequirements(password: string) {
  return [
    { label: "At least 8 characters", met: hasMinLength(password) },
    { label: "One uppercase letter", met: hasUppercase(password) },
    { label: "One lowercase letter", met: hasLowercase(password) },
    { label: "One number", met: hasNumber(password) },
    { label: "One special character (e.g. !@#$%^&*)", met: hasSpecialChar(password) },
  ];
}
