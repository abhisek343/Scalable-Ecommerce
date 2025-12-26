import express, { Router, Request, Response } from "express";
import Payment from "../models/payment.model";
import Razorpay from "razorpay";
import crypto from "crypto";
import { validate } from "../middleware/validate.middleware";
import { createPaymentSchema, paymentIdSchema, orderIdSchema, CreatePaymentInput } from "../validators/payment.validators";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth.middleware";
import { NotFoundError } from "../middleware/error.middleware";

const router: Router = express.Router();

// Initialize Razorpay
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

const razorpay = razorpayKeyId && razorpayKeySecret
    ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
    : null;

/**
 * @route   GET /api/payments/health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({
        success: true,
        service: "payment-service",
        status: "healthy",
        razorpayConfigured: !!razorpay,
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   POST /api/payments/:orderId/create
 * @desc    Create Razorpay order for payment
 * @access  Private
 */
router.post(
    "/:orderId/create",
    authenticate,
    validate(orderIdSchema, 'params'),
    validate(createPaymentSchema),
    asyncHandler(async (req: Request<any, any, CreatePaymentInput>, res: Response) => {
        const { orderId } = req.params;
        const { amount } = req.body;

        if (!razorpay) {
            // Mock mode for demo without Razorpay credentials
            const mockPayment = new Payment({
                orderId,
                amount,
                status: 'succeeded',
                paymentMethod: "mock",
                razorpayOrderId: `mock_order_${Date.now()}`
            });
            await mockPayment.save();

            res.status(201).json({
                success: true,
                mode: 'mock',
                message: 'Mock payment created (no Razorpay credentials configured)',
                data: mockPayment
            });
            return;
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: orderId,
            notes: { orderId }
        });

        // Save pending payment
        const payment = new Payment({
            orderId,
            amount,
            status: 'pending',
            paymentMethod: "razorpay",
            razorpayOrderId: razorpayOrder.id
        });
        await payment.save();

        res.status(201).json({
            success: true,
            data: {
                payment,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key_id: razorpayKeyId // Safe to expose public key
                }
            }
        });
    })
);

/**
 * @route   POST /api/payments/:orderId/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private
 */
router.post(
    "/:orderId/verify",
    authenticate,
    validate(orderIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const { orderId } = req.params;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const payment = await Payment.findOne({ orderId, razorpayOrderId: razorpay_order_id });
        if (!payment) throw new NotFoundError("Payment not found");

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', razorpayKeySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            payment.status = 'succeeded';
            payment.razorpayPaymentId = razorpay_payment_id;
            await payment.save();
            res.json({ success: true, message: 'Payment verified successfully', data: payment });
        } else {
            payment.status = 'failed';
            await payment.save();
            res.status(400).json({ success: false, error: 'Payment verification failed' });
        }
    })
);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment by ID
 * @access  Private
 */
router.get(
    "/:paymentId",
    authenticate,
    validate(paymentIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) throw new NotFoundError("Payment not found");
        res.json({ success: true, data: payment });
    })
);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payments for an order
 * @access  Private
 */
router.get(
    "/order/:orderId",
    authenticate,
    validate(orderIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const payments = await Payment.find({ orderId: req.params.orderId });
        res.json({ success: true, count: payments.length, data: payments });
    })
);

export default router;

