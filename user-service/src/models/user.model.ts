import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User Document Interface
 */
export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
        toJSON: {
            transform: function (_doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Index for faster lookups
userSchema.index({ email: 1 });

/**
 * Pre-save hook to hash password
 */
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        return next(error as Error);
    }
});

/**
 * Instance method to compare passwords
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
