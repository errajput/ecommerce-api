import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/user", userRoutes);
app.use("/products", productRoutes);
app.use("/auth", authRoutes);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

mongoose
  .connect(process.env.MONGODB_URI, { dbName: "ecommerce-products" })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`App sever is listen on PORT ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Server not connected", err);
  });
