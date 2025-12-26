import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/user";

const PORT: string | number = process.env.PORT || 5000;

dotenv.config();
const app: Application = express();

// middleware
app.use(express.json());

// routes
app.use("/api/users", userRoutes);

const mongoURI: string = process.env.MONGO_URI || "";

if (!mongoURI) {
  console.error("🚫 MONGO_URI is not defined in environment variables for User Service.");
  process.exit(1); // Exit if MONGO_URI is not set
}

mongoose
  .connect(mongoURI, {
    // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
  })
  .then(() => {
    console.log("✅ User Service is Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err: any) => { // Added type for err
    console.error("🚫 Failed to connect to Database -> User Service", err);
  });
