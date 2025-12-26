import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import productRoutes from "./routes/product";

const PORT: string | number = process.env.PORT || 5001;

const app: Application = express();
dotenv.config();

app.use(express.json());

// Routes
app.use("/api/products", productRoutes);

const mongoURI: string = process.env.MONGO_URI || "";

if (!mongoURI) {
  console.error("🚫 MONGO_URI is not defined in environment variables for Product Service.");
  process.exit(1); // Exit if MONGO_URI is not set
}

mongoose
  .connect(mongoURI, {
    // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
  })
  .then(() => {
    console.log("✅ Product Service is Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Product service is running on port ${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error("🚫 Error connecting to MongoDB -> Product Service", err);
  });
