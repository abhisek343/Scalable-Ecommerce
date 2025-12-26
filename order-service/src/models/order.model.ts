import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem {
    productId: string;
    quantity: number;
    price?: number;
}

export interface IOrder extends Document {
    _id: Types.ObjectId;
    userId: string;
    items: IOrderItem[];
    totalAmount: number;
    status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number }
}, { _id: false });

const orderSchema: Schema<IOrder> = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        items: { type: [orderItemSchema], required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
            default: 'Pending'
        }
    },
    { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>("Order", orderSchema);
