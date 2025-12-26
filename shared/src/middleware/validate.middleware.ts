import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validation middleware factory using Zod schemas.
 * Validates request body, query, or params against provided schema.
 * 
 * Usage:
 *   router.post('/users', validate(createUserSchema), createUser)
 *   router.get('/users', validate(querySchema, 'query'), getUsers)
 */
export const validate = (
    schema: ZodSchema,
    source: 'body' | 'query' | 'params' = 'body'
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[source];
            const parsed = schema.parse(data);

            // Replace with parsed (and potentially transformed) data
            req[source] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: formattedErrors
                });
                return;
            }

            res.status(500).json({
                success: false,
                error: 'Validation error occurred'
            });
        }
    };
};

/**
 * Validates multiple sources at once
 */
export const validateMultiple = (schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const allErrors: Array<{ source: string; field: string; message: string }> = [];

        for (const [source, schema] of Object.entries(schemas)) {
            if (!schema) continue;

            try {
                const data = req[source as keyof typeof schemas];
                const parsed = schema.parse(data);
                (req as any)[source] = parsed;
            } catch (error) {
                if (error instanceof ZodError) {
                    error.errors.forEach((err) => {
                        allErrors.push({
                            source,
                            field: err.path.join('.'),
                            message: err.message
                        });
                    });
                }
            }
        }

        if (allErrors.length > 0) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: allErrors
            });
            return;
        }

        next();
    };
};
