import { z } from 'zod';

/**
 * User Registration Schema
 * - Name: 2-50 characters
 * - Email: Valid email format
 * - Password: 8+ chars, must contain uppercase, lowercase, and number
 */
export const registerSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .trim(),
    email: z
        .string({ required_error: 'Email is required' })
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});

/**
 * User Login Schema
 */
export const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required')
});

/**
 * Type exports for use in controllers
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
