import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * Product Document Interface
 */
export interface IProduct extends Document {
    _id: Types.ObjectId;
    name: string;
    price: number;
    description: string;
    category: string;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema: Schema<IProduct> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price must be positive'],
            max: [1000000, 'Price cannot exceed 1,000,000']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [10, 'Description must be at least 10 characters'],
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            index: true
        },
        stock: {
            type: Number,
            default: 0,
            min: [0, 'Stock cannot be negative']
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (_doc, ret) {
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });

export default mongoose.model<IProduct>("Product", productSchema);
