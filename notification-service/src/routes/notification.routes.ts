import express, { Router, Request, Response } from "express";
import { sendEmail } from "../services/email.service";
import { sendSMS } from "../services/sms.service";
import { validate } from "../middleware/validate.middleware";
import { sendEmailSchema, sendSmsSchema, SendEmailInput, SendSmsInput } from "../validators/notification.validators";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth.middleware";

const router: Router = express.Router();

/**
 * @route   POST /api/notifications/email
 * @desc    Send email notification
 * @access  Private
 */
router.post(
    "/email",
    authenticate,
    validate(sendEmailSchema),
    asyncHandler(async (req: Request<any, any, SendEmailInput>, res: Response) => {
        const { to, subject, text } = req.body;
        await sendEmail(to, subject, text);
        res.json({ success: true, message: "Email sent successfully" });
    })
);

/**
 * @route   POST /api/notifications/sms
 * @desc    Send SMS notification
 * @access  Private
 */
router.post(
    "/sms",
    authenticate,
    validate(sendSmsSchema),
    asyncHandler(async (req: Request<any, any, SendSmsInput>, res: Response) => {
        const { to, message } = req.body;
        await sendSMS(to, message);
        res.json({ success: true, message: "SMS sent successfully" });
    })
);

/**
 * @route   GET /api/notifications/health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({ success: true, service: "notification-service", status: "healthy", timestamp: new Date().toISOString() });
});

export default router;
