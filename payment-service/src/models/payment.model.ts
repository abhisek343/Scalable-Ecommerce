import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
    _id: Types.ObjectId;
    orderId: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
    paymentMethod: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema: Schema<IPayment> = new mongoose.Schema(
    {
        orderId: { type: String, required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'],
            default: 'pending'
        },
        paymentMethod: { type: String, required: true },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String }
    },
    { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", paymentSchema);

