import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(MONGODB_URI, { dbName: "ecommerce-products" });
mongoose.connection.on("connected", () => console.log("MongoDB Connected"));

app.get("/", (req, res) => res.send("Ok"));

app.use("/user", userRoutes);
app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Not Found -- Wild Card Routes
app.use((req, res) => {
  console.log("Not Found", req.path, req.method);
  // throw Error("My Error");
  res.status(404).send({ message: "Page Not Found" });
});

// Express Error Handling
app.use((err, req, res, next) => {
  res.status(500).send({ message: "My Error" });
});

app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
