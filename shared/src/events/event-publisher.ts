import {
    initRabbitMQ,
    publishToQueue,
    createQueue,
    QUEUES
} from '../messaging/rabbitmq.client';

export interface OrderCreatedEvent {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    totalAmount: number;
    status: string;
    createdAt: Date;
}

export interface OrderUpdatedEvent {
    orderId: string;
    userId: string;
    status: string;
    previousStatus: string;
    updatedAt: Date;
}

export interface PaymentProcessedEvent {
    paymentId: string;
    orderId: string;
    amount: number;
    status: 'succeeded' | 'failed' | 'pending';
    paymentMethod: string;
    processedAt: Date;
}

export interface NotificationEvent {
    type: 'email' | 'sms';
    to: string;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
}

/**
 * Initialize event publishing
 */
export const initEventPublishing = async (): Promise<void> => {
    try {
        await initRabbitMQ();


        await createQueue({ queue: QUEUES.ORDER_CREATED, durable: true });
        await createQueue({ queue: QUEUES.ORDER_UPDATED, durable: true });
        await createQueue({ queue: QUEUES.PAYMENT_PROCESSED, durable: true });
        await createQueue({ queue: QUEUES.PAYMENT_FAILED, durable: true });
        await createQueue({ queue: QUEUES.NOTIFICATION_EMAIL, durable: true });
        await createQueue({ queue: QUEUES.NOTIFICATION_SMS, durable: true });
        await createQueue({ queue: QUEUES.STOCK_UPDATED, durable: true });

        console.log('✅ Event queues initialized');
    } catch (error) {
        console.warn('⚠️ Event publishing not available:', error);
    }
};

/**
 * Publish order created event
 */
export const publishOrderCreated = async (event: OrderCreatedEvent): Promise<boolean> => {
    return publishToQueue(QUEUES.ORDER_CREATED, {
        ...event,
        eventType: 'ORDER_CREATED',
        timestamp: new Date().toISOString()
    });
};

/**
 * Publish order updated event
 */
export const publishOrderUpdated = async (event: OrderUpdatedEvent): Promise<boolean> => {
    return publishToQueue(QUEUES.ORDER_UPDATED, {
        ...event,
        eventType: 'ORDER_UPDATED',
        timestamp: new Date().toISOString()
    });
};

/**
 * Publish payment processed event
 */
export const publishPaymentProcessed = async (event: PaymentProcessedEvent): Promise<boolean> => {
    const queue = event.status === 'succeeded' ? QUEUES.PAYMENT_PROCESSED : QUEUES.PAYMENT_FAILED;
    return publishToQueue(queue, {
        ...event,
        eventType: event.status === 'succeeded' ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED',
        timestamp: new Date().toISOString()
    });
};

/**
 * Publish email notification request
 */
export const publishEmailNotification = async (
    to: string,
    subject: string,
    message: string,
    metadata?: Record<string, any>
): Promise<boolean> => {
    const event: NotificationEvent = {
        type: 'email',
        to,
        subject,
        message,
        metadata
    };
    return publishToQueue(QUEUES.NOTIFICATION_EMAIL, {
        ...event,
        eventType: 'NOTIFICATION_EMAIL',
        timestamp: new Date().toISOString()
    });
};

/**
 * Publish SMS notification request
 */
export const publishSmsNotification = async (
    to: string,
    message: string,
    metadata?: Record<string, any>
): Promise<boolean> => {
    const event: NotificationEvent = {
        type: 'sms',
        to,
        message,
        metadata
    };
    return publishToQueue(QUEUES.NOTIFICATION_SMS, {
        ...event,
        eventType: 'NOTIFICATION_SMS',
        timestamp: new Date().toISOString()
    });
};

/**
 * Publish stock update event
 */
export const publishStockUpdated = async (
    productId: string,
    previousStock: number,
    newStock: number,
    reason: 'order' | 'restock' | 'adjustment'
): Promise<boolean> => {
    return publishToQueue(QUEUES.STOCK_UPDATED, {
        productId,
        previousStock,
        newStock,
        change: newStock - previousStock,
        reason,
        eventType: 'STOCK_UPDATED',
        timestamp: new Date().toISOString()
    });
};
