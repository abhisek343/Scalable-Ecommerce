import { z } from 'zod';

/**
 * Send Email Schema
 */
export const sendEmailSchema = z.object({
    to: z
        .string({ required_error: 'Recipient email is required' })
        .email('Invalid email format'),
    subject: z
        .string({ required_error: 'Subject is required' })
        .min(1, 'Subject cannot be empty')
        .max(200, 'Subject cannot exceed 200 characters'),
    text: z
        .string({ required_error: 'Email body is required' })
        .min(1, 'Email body cannot be empty')
        .max(10000, 'Email body cannot exceed 10,000 characters')
});

/**
 * Send SMS Schema
 */
export const sendSmsSchema = z.object({
    to: z
        .string({ required_error: 'Phone number is required' })
        .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
    message: z
        .string({ required_error: 'Message is required' })
        .min(1, 'Message cannot be empty')
        .max(1600, 'Message cannot exceed 1600 characters') // SMS limit
});

// Type exports
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type SendSmsInput = z.infer<typeof sendSmsSchema>;
