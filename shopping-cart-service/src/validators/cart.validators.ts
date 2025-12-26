import { z } from 'zod';

/**
 * Cart Item Schema
 */
const cartItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    quantity: z.number().int().positive('Quantity must be at least 1')
});

/**
 * Add to Cart Schema
 */
export const addToCartSchema = z.object({
    productId: z
        .string({ required_error: 'Product ID is required' })
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    quantity: z
        .number({ required_error: 'Quantity is required' })
        .int('Quantity must be a whole number')
        .positive('Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100')
});

/**
 * Update Cart Item Quantity Schema
 */
export const updateQuantitySchema = z.object({
    quantity: z
        .number({ required_error: 'Quantity is required' })
        .int('Quantity must be a whole number')
        .positive('Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100')
});

/**
 * User ID Parameter Schema
 */
export const userIdSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
});

/**
 * Product ID Parameter Schema
 */
export const productIdSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
});

// Type exports
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;
