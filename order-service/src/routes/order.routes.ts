import express, { Router, Request, Response } from "express";
import Order from "../models/order.model";
import axios from "axios";
import { validate } from "../middleware/validate.middleware";
import { createOrderSchema, updateOrderStatusSchema, orderIdSchema, userIdSchema, CreateOrderInput, UpdateOrderStatusInput } from "../validators/order.validators";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { NotFoundError, BadRequestError } from "../middleware/error.middleware";

const router: Router = express.Router();
const PRODUCT_SERVICE_URI = process.env.PRODUCT_SERVICE_URI || "http://localhost:5001";


/**
 * @route   GET /api/orders/health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({ success: true, service: "order-service", status: "healthy", timestamp: new Date().toISOString() });
});

/**
 * @route   POST /api/orders/:userId
 * @desc    Place a new order
 * @access  Private
 */
router.post(
    "/:userId",
    authenticate,
    validate(userIdSchema, 'params'),
    validate(createOrderSchema),
    asyncHandler(async (req: Request<any, any, CreateOrderInput>, res: Response) => {
        const { userId } = req.params;
        const { items, totalAmount } = req.body;

        const { publishToQueue } = await import('@ecommerce/shared');

        // Fire and Forget: Push to Queue
        const ORDER_QUEUE = 'order_processing_queue';
        const success = await publishToQueue(ORDER_QUEUE, {
            userId,
            items,
            totalAmount,
            timestamp: new Date()
        });

        if (!success) {
            throw new Error("Failed to queue order");
        }

        res.status(202).json({
            success: true,
            message: "Order placed successfully! You will be notified once processed.",
            status: "Queued"
        });
    })
);

/**
 * @route   GET /api/orders/:userId
 * @desc    Get all orders for a user
 * @access  Private
 */
router.get(
    "/:userId",
    authenticate,
    validate(userIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, data: orders });
    })
);

/**
 * @route   GET /api/orders/:userId/:orderId
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
    "/:userId/:orderId",
    authenticate,
    asyncHandler(async (req: Request<any>, res: Response) => {
        const order = await Order.findOne({ userId: req.params.userId, _id: req.params.orderId });
        if (!order) throw new NotFoundError("Order not found");
        res.json({ success: true, data: order });
    })
);

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Private
 */
router.put(
    "/:orderId/status",
    authenticate,
    validate(orderIdSchema, 'params'),
    validate(updateOrderStatusSchema),
    asyncHandler(async (req: Request<any, any, UpdateOrderStatusInput>, res: Response) => {
        const order = await Order.findById(req.params.orderId);
        if (!order) throw new NotFoundError("Order not found");

        order.status = req.body.status;
        await order.save();

        res.json({ success: true, data: order });
    })
);


export default router;
