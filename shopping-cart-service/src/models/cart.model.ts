import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem {
    productId: string;
    quantity: number;
}

export interface ICart extends Document {
    _id: Types.ObjectId;
    userId: string;
    items: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}

const cartItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}, { _id: false });

const cartSchema: Schema<ICart> = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        items: { type: [cartItemSchema], default: [] }
    },
    { timestamps: true }
);

export default mongoose.model<ICart>("Cart", cartSchema);
