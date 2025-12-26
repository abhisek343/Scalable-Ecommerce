import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';

let connection: any = null;
let channel: Channel | null = null;

export interface QueueConfig {
    queue: string;
    durable?: boolean;
    prefetch?: number;
}

export interface ExchangeConfig {
    exchange: string;
    type: 'direct' | 'fanout' | 'topic' | 'headers';
    durable?: boolean;
}

/**
 * Initialize RabbitMQ connection
 */
export const initRabbitMQ = async (): Promise<Channel> => {
    if (channel) {
        return channel;
    }

    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://ecommerce:ecommerce123@localhost:5672';

    try {
        connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        console.log('✅ RabbitMQ: Connected');

        connection.on('error', (err: any) => {
            console.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
            channel = null;
            connection = null;
        });

        if (!channel) throw new Error("Failed to create channel");
        return channel;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

/**
 * Get RabbitMQ channel
 */
export const getChannel = (): Channel | null => {
    return channel;
};

/**
 * Create a queue
 */
export const createQueue = async (config: QueueConfig): Promise<void> => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized');
    }

    await channel.assertQueue(config.queue, {
        durable: config.durable ?? true
    });

    if (config.prefetch) {
        await channel.prefetch(config.prefetch);
    }
};

/**
 * Create an exchange
 */
export const createExchange = async (config: ExchangeConfig): Promise<void> => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized');
    }

    await channel.assertExchange(config.exchange, config.type, {
        durable: config.durable ?? true
    });
};

/**
 * Publish a message to a queue
 */
export const publishToQueue = async (
    queue: string,
    message: object,
    options?: amqp.Options.Publish
): Promise<boolean> => {
    if (!channel) {
        console.warn('RabbitMQ channel not available, message not published');
        return false;
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    return channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        ...options
    });
};

/**
 * Publish a message to an exchange with routing key
 */
export const publishToExchange = async (
    exchange: string,
    routingKey: string,
    message: object,
    options?: amqp.Options.Publish
): Promise<boolean> => {
    if (!channel) {
        console.warn('RabbitMQ channel not available, message not published');
        return false;
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    return channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        ...options
    });
};

/**
 * Get retry count from message headers
 */
export const getRetryCount = (msg: ConsumeMessage): number => {
    const headers = msg.properties.headers || {};
    return headers['x-retry-count'] || 0;
};

/**
 * Consume messages from a queue
 */
export const consumeQueue = async (
    queue: string,
    handler: (message: any, msg: ConsumeMessage) => Promise<void>,
    options?: amqp.Options.Consume
): Promise<void> => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized');
    }

    await channel.consume(
        queue,
        async (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content, msg);
                    // Handler MUST ack/nack manually.
                    // If handler throws error, we nack without requeue to prevent infinite loops.

                } catch (error) {
                    console.error(`Error processing message from ${queue}:`, error);
                    // FIXED: Do NOT requeue to prevent infinite loops
                    // Failed messages should be handled via dead-letter queue or logged
                    channel?.nack(msg, false, false);
                }
            }
        },
        { noAck: false, ...options }
    );

    console.log(`✅ Consuming from queue: ${queue}`);
};

/**
 * Maximum retry attempts before moving to dead-letter queue
 */
const MAX_RETRIES = 3;

/**
 * Consume messages with automatic retry support
 * Failed messages are retried up to MAX_RETRIES times before being discarded/sent to DLQ
 */
export const consumeWithRetry = async (
    queue: string,
    handler: (message: any, msg: ConsumeMessage) => Promise<void>,
    options?: amqp.Options.Consume & { maxRetries?: number; dlqName?: string }
): Promise<void> => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized');
    }

    const maxRetries = options?.maxRetries ?? MAX_RETRIES;
    const dlqName = options?.dlqName ?? `${queue}.dlq`;

    // Assert dead-letter queue exists
    await channel.assertQueue(dlqName, { durable: true });

    await channel.consume(
        queue,
        async (msg) => {
            if (msg) {
                const retryCount = getRetryCount(msg);

                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content, msg);
                    // Handler should ack on success

                } catch (error) {
                    console.error(`Error processing message from ${queue} (attempt ${retryCount + 1}/${maxRetries}):`, error);

                    if (retryCount < maxRetries - 1) {
                        // Retry: republish with incremented retry count
                        const messageBuffer = msg.content;
                        const newHeaders = {
                            ...(msg.properties.headers || {}),
                            'x-retry-count': retryCount + 1,
                            'x-original-queue': queue
                        };

                        channel?.sendToQueue(queue, messageBuffer, {
                            persistent: true,
                            headers: newHeaders
                        });
                        channel?.ack(msg);
                        console.log(`🔄 Retrying message (attempt ${retryCount + 2}/${maxRetries})`);
                    } else {
                        // Max retries exceeded, send to DLQ
                        const messageBuffer = msg.content;
                        const dlqHeaders = {
                            ...(msg.properties.headers || {}),
                            'x-failed-reason': error instanceof Error ? error.message : 'Unknown error',
                            'x-original-queue': queue,
                            'x-failed-at': new Date().toISOString()
                        };

                        channel?.sendToQueue(dlqName, messageBuffer, {
                            persistent: true,
                            headers: dlqHeaders
                        });
                        channel?.ack(msg);
                        console.log(`💀 Message moved to DLQ: ${dlqName} after ${maxRetries} attempts`);
                    }
                }
            }
        },
        { noAck: false, ...options }
    );

    console.log(`✅ Consuming from queue: ${queue} (with retry support, max ${maxRetries} attempts)`);
};

/**
 * Close RabbitMQ connection
 */
export const closeRabbitMQ = async (): Promise<void> => {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('RabbitMQ: Connection closed');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
};

// Common queue names for the e-commerce system
export const QUEUES = {
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ORDER_CANCELLED: 'order.cancelled',
    PAYMENT_PROCESSED: 'payment.processed',
    PAYMENT_FAILED: 'payment.failed',
    NOTIFICATION_EMAIL: 'notification.email',
    NOTIFICATION_SMS: 'notification.sms',
    STOCK_UPDATED: 'stock.updated'
};

// Common exchange names
export const EXCHANGES = {
    ORDERS: 'orders',
    PAYMENTS: 'payments',
    NOTIFICATIONS: 'notifications',
    INVENTORY: 'inventory'
};
