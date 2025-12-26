import express, { Router, Request, Response } from "express";
import User, { IUser } from "../models/user";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const router: Router = express.Router();

const JWT_SECRET: string = process.env.JWT_SECRET || "your-default-secret"; // Fallback for local dev if not set
if (process.env.NODE_ENV !== 'test' && JWT_SECRET === "your-default-secret") {
  console.warn("Warning: JWT_SECRET is using a default value. Set a strong secret in your environment variables for production.");
}


interface UserAuthRequestBody {
  name?: string; // Optional for login
  email: string;
  password?: string; // Optional for scenarios where password isn't sent (e.g. OAuth)
}

interface JwtPayload {
  userId: string; // Or mongoose.Types.ObjectId if you prefer
}

// Register a new user
// UNIQUE_CHANGE_FOR_COMMIT_35
router.post("/register", async (req: Request<{}, {}, UserAuthRequestBody>, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
    }

    let user: IUser | null = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = new User({ name, email, password });
    await user.save();


    const userIdForToken: string = (user as any)._id.toString(); // Casting to any if _id type is problematic

    const token = jwt.sign({ userId: userIdForToken }, JWT_SECRET, {
      expiresIn: "1h", // Or use a config value
    });
    res.status(201).json({ token }); // 201 for successful creation
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Server error during registration" });
  }
});

// Login a user
router.post("/login", async (req: Request<{}, {}, UserAuthRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    // Explicitly select password field as it might be excluded by default in the schema
    const user: IUser | null = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ error: "No user with this email was found" });
    }

    // user.password should be present due to .select('+password')
    if (!user.password) {
        return res.status(400).json({ error: "Password not found for user, login aborted."});
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    
    const userIdForToken: string = (user as any)._id.toString();

    const token = jwt.sign({ userId: userIdForToken }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Server error during login" });
  }
});

export default router;
