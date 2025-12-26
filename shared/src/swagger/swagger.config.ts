import swaggerJsdoc from 'swagger-jsdoc';

export interface SwaggerOptions {
    serviceName: string;
    serviceDescription: string;
    version: string;
    port: number;
    apiPath: string;
}

export const createSwaggerSpec = (options: SwaggerOptions) => {
    const swaggerOptions: swaggerJsdoc.Options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: `${options.serviceName} API`,
                version: options.version,
                description: options.serviceDescription,
                contact: {
                    name: 'API Support',
                    email: 'support@ecommerce.com'
                },
                license: {
                    name: 'ISC',
                    url: 'https://opensource.org/licenses/ISC'
                }
            },
            servers: [
                {
                    url: `http://localhost:${options.port}`,
                    description: 'Development server'
                },
                {
                    url: `http://localhost/${options.apiPath}`,
                    description: 'Via API Gateway (Nginx)'
                }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Enter JWT token'
                    }
                },
                schemas: {
                    Error: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            error: { type: 'string' },
                            details: { type: 'array', items: { type: 'object' } }
                        }
                    },
                    HealthCheck: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            service: { type: 'string' },
                            status: { type: 'string', example: 'healthy' },
                            timestamp: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                responses: {
                    UnauthorizedError: {
                        description: 'Access token is missing or invalid',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    },
                    NotFoundError: {
                        description: 'Resource not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    },
                    ValidationError: {
                        description: 'Validation failed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            },
            security: [{ bearerAuth: [] }]
        },
        apis: ['./src/routes/*.ts', './src/swagger/*.yaml']
    };

    return swaggerJsdoc(swaggerOptions);
};

export const swaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #3b82f6 }
    `,
    customSiteTitle: 'E-Commerce API Documentation',
    customfavIcon: ''
};
