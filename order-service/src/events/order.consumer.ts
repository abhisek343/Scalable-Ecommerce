import { Channel, ConsumeMessage } from 'amqplib';
import { getChannel, consumeWithRetry, getRetryCount } from '@ecommerce/shared';
import Order from '../models/order.model';
import axios from 'axios';

const ORDER_QUEUE = 'order_processing_queue';
const PRODUCT_SERVICE_URI = process.env.PRODUCT_SERVICE_URI || 'http://product-service:5001';

export const startOrderConsumer = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error('❌ Order Consumer: Channel not available');
        return;
    }


    await channel.assertQueue(ORDER_QUEUE, { durable: true });

    console.log(`🚀 Order Consumer starting on queue: ${ORDER_QUEUE}`);

    // Use consumeWithRetry for automatic retry handling with DLQ
    await consumeWithRetry(
        ORDER_QUEUE,
        async (orderData, msg) => {
            const retryCount = getRetryCount(msg);
            const { userId, items } = orderData;

            if (retryCount > 0) {
                console.log(`🔄 Processing order for user ${userId} (retry attempt ${retryCount})`);
            }

            // 1. Calculate Real Total & Verify Stock
            let calculatedTotal = 0;
            const itemsToProcess = [];

            for (const item of items) {
                const productRes = await axios.get(`${PRODUCT_SERVICE_URI}/api/products/${item.productId}`);
                const product = productRes.data;

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                calculatedTotal += product.price * item.quantity;
                itemsToProcess.push({
                    ...item,
                    price: product.price // Store historical price
                });
            }

            // 2. Deduct Stock (Atomic Check-and-Set)
            const successfulDeductions = [];
            let stockError = false;

            for (const item of itemsToProcess) {
                try {
                    await axios.put(`${PRODUCT_SERVICE_URI}/api/products/${item.productId}/deduct`, {
                        quantity: item.quantity
                    });
                    successfulDeductions.push(item);
                } catch (err: any) {
                    console.warn(`Stock deduction failed for ${item.productId}:`, err.response?.data || err.message);
                    stockError = true;
                    break;
                }
            }

            if (stockError) {
                // Out of stock is a business logic error, not a system error

                console.log(`❌ Order failed: Out of stock for user ${userId}`);
                channel.ack(msg);
                return;
            }

            // 3. Create Order (Now safe to create)
            const order = new Order({
                userId,
                items: itemsToProcess,
                totalAmount: calculatedTotal,
                status: "Confirmed"
            });
            await order.save();

            console.log(`✅ Order processed: ${order._id} (Total: $${calculatedTotal})`);

            // Acknowledge successful processing
            channel.ack(msg);
        },
        { maxRetries: 3, dlqName: 'order_processing_queue.dlq' }
    );
};

