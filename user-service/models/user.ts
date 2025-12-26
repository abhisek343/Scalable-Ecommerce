import mongoose, { Schema, Document } from "mongoose";
import argon2 from "argon2";

// Interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Password might not always be present in query results
  // You can also add instance methods here if you define them on the schema
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // UNIQUE_CHANGE_FOR_COMMIT_43
});

userSchema.pre<IUser>("save", async function (this: IUser, next: (err?: Error) => void) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    this.password = await argon2.hash(this.password);
    next();
  } catch (error: any) { // Catching error as any
    // It's good practice to pass the error to next for Mongoose to handle
    return next(error as Error);
  }
});

// Method to compare password (optional, but good practice)
// userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
//   if (!this.password) return false;
//   return argon2.verify(this.password, candidatePassword);
// };

export default mongoose.model<IUser>("User", userSchema);
