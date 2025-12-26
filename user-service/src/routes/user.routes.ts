import express, { Router, Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema, RegisterInput, LoginInput } from "../validators/user.validators";
import { asyncHandler } from "../utils/asyncHandler";
import { createStrictRateLimiter } from "../middleware/rateLimit.middleware";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { ConflictError, BadRequestError } from "../middleware/error.middleware";

const router: Router = express.Router();

const JWT_SECRET: string = process.env.JWT_SECRET || "your-default-secret";
if (process.env.NODE_ENV !== 'test' && JWT_SECRET === "your-default-secret") {
    console.warn("⚠️  Warning: JWT_SECRET is using a default value. Set a strong secret in production.");
}

// Strict rate limiter for auth endpoints (5 attempts per 15 minutes)
const authRateLimiter = createStrictRateLimiter(15 * 60 * 1000, 5);

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    "/register",
    authRateLimiter,
    validate(registerSchema),
    asyncHandler(async (req: Request<{}, {}, RegisterInput>, res: Response) => {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ConflictError("User with this email already exists");
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id.toString() },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    })
);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
    "/login",
    authRateLimiter,
    validate(loginSchema),
    asyncHandler(async (req: Request<{}, {}, LoginInput>, res: Response) => {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select("+password");
        if (!user || !user.password) {
            throw new BadRequestError("Invalid email or password");
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new BadRequestError("Invalid email or password");
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id.toString() },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    })
);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
    "/me",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const user = await User.findById(req.user?.userId);

        if (!user) {
            throw new BadRequestError("User not found");
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    })
);

/**
 * @route   GET /api/users/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({
        success: true,
        service: "user-service",
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});

export default router;
