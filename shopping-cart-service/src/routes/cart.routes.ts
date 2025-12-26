import express, { Router, Request, Response } from "express";
import Cart from "../models/cart.model";
import axios from "axios";
import { validate } from "../middleware/validate.middleware";
import { addToCartSchema, updateQuantitySchema, userIdSchema, productIdSchema, AddToCartInput, UpdateQuantityInput } from "../validators/cart.validators";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth.middleware";
import { NotFoundError, BadRequestError } from "../middleware/error.middleware";

const router: Router = express.Router();
const PRODUCT_SERVICE_URI = process.env.PRODUCT_SERVICE_URI || "http://localhost:5001";


/**
 * @route   GET /api/cart/health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({ success: true, service: "cart-service", status: "healthy", timestamp: new Date().toISOString() });
});

/**
 * @route   POST /api/cart/:userId/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
    "/:userId/add",
    authenticate,
    validate(userIdSchema, 'params'),
    validate(addToCartSchema),
    asyncHandler(async (req: Request<any, any, AddToCartInput>, res: Response) => {
        const { userId } = req.params;
        const { productId, quantity } = req.body;

        // Validate product exists
        try {
            await axios.get(`${PRODUCT_SERVICE_URI}/api/products/${productId}`);
        } catch {
            throw new BadRequestError("Product not found");
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, quantity }] });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
        }

        await cart.save();
        res.json({ success: true, data: cart });
    })
);

/**
 * @route   GET /api/cart/:userId
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
    "/:userId",
    authenticate,
    validate(userIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) throw new NotFoundError("Cart not found");
        res.json({ success: true, data: cart });
    })
);

/**
 * @route   DELETE /api/cart/:userId/remove/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
    "/:userId/remove/:productId",
    authenticate,
    asyncHandler(async (req: Request<any>, res: Response) => {
        const { userId, productId } = req.params;
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new NotFoundError("Cart not found");

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId !== productId);

        if (cart.items.length === initialLength) {
            throw new NotFoundError("Product not in cart");
        }

        await cart.save();
        res.json({ success: true, data: cart });
    })
);

/**
 * @route   PUT /api/cart/:userId/update/:productId
 * @desc    Update item quantity
 * @access  Private
 */
router.put(
    "/:userId/update/:productId",
    authenticate,
    validate(updateQuantitySchema),
    asyncHandler(async (req: Request<any, any, UpdateQuantityInput>, res: Response) => {
        const { userId, productId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new NotFoundError("Cart not found");

        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) throw new NotFoundError("Product not in cart");

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        res.json({ success: true, data: cart });
    })
);

/**
 * @route   DELETE /api/cart/:userId/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete(
    "/:userId/clear",
    authenticate,
    validate(userIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) throw new NotFoundError("Cart not found");

        cart.items = [];
        await cart.save();
        res.json({ success: true, message: "Cart cleared", data: cart });
    })
);


export default router;
