import { z } from 'zod';

/**
 * Product Creation Schema
 */
export const createProductSchema = z.object({
    name: z
        .string({ required_error: 'Product name is required' })
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .trim(),
    description: z
        .string({ required_error: 'Description is required' })
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description cannot exceed 2000 characters')
        .trim(),
    price: z
        .number({ required_error: 'Price is required' })
        .positive('Price must be a positive number')
        .max(1000000, 'Price cannot exceed 1,000,000'),
    category: z
        .string({ required_error: 'Category is required' })
        .min(2, 'Category must be at least 2 characters')
        .max(50, 'Category cannot exceed 50 characters')
        .trim(),
    stock: z
        .number({ required_error: 'Stock is required' })
        .int('Stock must be a whole number')
        .min(0, 'Stock cannot be negative')
        .max(100000, 'Stock cannot exceed 100,000')
});

/**
 * Product Update Schema (all fields optional)
 */
export const updateProductSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().min(10).max(2000).trim().optional(),
    price: z.number().positive().max(1000000).optional(),
    category: z.string().min(2).max(50).trim().optional(),
    stock: z.number().int().min(0).max(100000).optional()
});

/**
 * Stock Deduction Schema
 */
export const deductStockSchema = z.object({
    quantity: z
        .number({ required_error: 'Quantity is required' })
        .int('Quantity must be a whole number')
        .positive('Quantity must be positive')
});

/**
 * Product ID Parameter Schema
 */
export const productIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
});

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeductStockInput = z.infer<typeof deductStockSchema>;
