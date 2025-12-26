import { consumeWithRetry, getChannel, QUEUES } from '../messaging/rabbitmq.client';

export interface EventHandler<T> {
    (event: T): Promise<void>;
}

/**
 * Start consuming order created events
 */
export const consumeOrderCreatedEvents = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.ORDER_CREATED, async (message, msg) => {
        console.log('📬 Received ORDER_CREATED event:', message.orderId);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start consuming order updated events
 */
export const consumeOrderUpdatedEvents = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.ORDER_UPDATED, async (message, msg) => {
        console.log('📬 Received ORDER_UPDATED event:', message.orderId);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start consuming payment processed events
 */
export const consumePaymentProcessedEvents = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.PAYMENT_PROCESSED, async (message, msg) => {
        console.log('📬 Received PAYMENT_PROCESSED event:', message.paymentId);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start consuming payment failed events
 */
export const consumePaymentFailedEvents = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.PAYMENT_FAILED, async (message, msg) => {
        console.log('📬 Received PAYMENT_FAILED event:', message.paymentId);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start consuming email notification requests
 */
export const consumeEmailNotifications = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.NOTIFICATION_EMAIL, async (message, msg) => {
        console.log('📬 Received EMAIL notification request:', message.to);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start consuming SMS notification requests
 */
export const consumeSmsNotifications = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.NOTIFICATION_SMS, async (message, msg) => {
        console.log('📬 Received SMS notification request:', message.to);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start consuming stock update events
 */
export const consumeStockUpdatedEvents = async (
    handler: EventHandler<any>
): Promise<void> => {
    await consumeWithRetry(QUEUES.STOCK_UPDATED, async (message, msg) => {
        console.log('📬 Received STOCK_UPDATED event:', message.productId);
        await handler(message);
        getChannel()?.ack(msg);
    });
};

/**
 * Start all notification consumers
 */
export const startNotificationConsumers = async (
    emailHandler: EventHandler<any>,
    smsHandler: EventHandler<any>
): Promise<void> => {
    await consumeEmailNotifications(emailHandler);
    await consumeSmsNotifications(smsHandler);
    console.log('✅ Notification consumers started');
};

