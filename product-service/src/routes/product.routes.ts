import express, { Router, Request, Response } from "express";
import Product from "../models/product.model";
import { validate } from "../middleware/validate.middleware";
import {
    createProductSchema,
    updateProductSchema,
    deductStockSchema,
    productIdSchema,
    CreateProductInput,
    UpdateProductInput,
    DeductStockInput
} from "../validators/product.validators";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth.middleware";
import {
    NotFoundError,
    BadRequestError
} from "../middleware/error.middleware";

const router: Router = express.Router();


/**
 * @route   GET /api/products/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({
        success: true,
        service: "product-service",
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   POST /api/products/create
 * @desc    Create a new product
 * @access  Private (Admin only ideally, but Authenticated for now)
 */
router.post(
    "/create",
    authenticate,
    validate(createProductSchema),
    asyncHandler(async (req: Request<{}, {}, CreateProductInput>, res: Response) => {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    })
);

/**
 * @route   GET /api/products
 * @desc    Get all products (with pagination)
 * @access  Public
 */
router.get(
    "/",
    asyncHandler(async (req: Request<any>, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments();

        res.json({
            success: true,
            count: products.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: products
        });
    })
);

/**
 * @route   GET /api/products/search
 * @desc    Search products by name or category
 * @access  Public
 */
router.get(
    "/search",
    asyncHandler(async (req: Request<any>, res: Response) => {
        const { query, category, minPrice, maxPrice } = req.query;

        const filter: any = {};

        if (query) {
            filter.$text = { $search: query as string };
        }

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(filter);

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    })
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
    "/:id",
    validate(productIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new NotFoundError("Product not found");
        }

        res.json(product);
    })
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private
 */
router.put(
    "/:id",
    authenticate,
    validate(productIdSchema, 'params'),
    validate(updateProductSchema),
    asyncHandler(async (req: Request<any, any, UpdateProductInput>, res: Response) => {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            throw new NotFoundError("Product not found");
        }

        res.json(product);
    })
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private
 */
router.delete(
    "/:id",
    authenticate,
    validate(productIdSchema, 'params'),
    asyncHandler(async (req: Request<any>, res: Response) => {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            throw new NotFoundError("Product not found");
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });
    })
);

/**
 * @route   PUT /api/products/:id/deduct
 * @desc    Deduct stock (for internal service calls)
 * @access  Private (should be restricted to other services)
 */
router.put(
    "/:id/deduct", // In real app, this should be an internal endpoint or protected by service-to-service auth
    validate(productIdSchema, 'params'),
    validate(deductStockSchema),
    asyncHandler(async (req: Request<any, any, DeductStockInput>, res: Response) => {
        const { quantity } = req.body;
        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            throw new BadRequestError("Invalid quantity");
        }

        // Atomic update: only decrement if stock >= quantity
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true }
        );

        if (!product) {
            // Check if product exists to give better error message
            const exists = await Product.exists({ _id: req.params.id });
            if (!exists) {
                throw new NotFoundError("Product not found");
            }
            // Product exists but insufficient stock
            const currentProduct = await Product.findById(req.params.id);
            throw new BadRequestError(`Insufficient stock. Available: ${currentProduct?.stock}`);
        }

        res.json(product);
    })
);


export default router;
