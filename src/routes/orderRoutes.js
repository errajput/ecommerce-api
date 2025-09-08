import { Router } from "express";
import Order from "../models/orderModel.js";
import cartModel from "../models/cartModel.js";
import { verifyToken } from "../middleware/verifyToken.js";

import { ZodError } from "zod";
import {
  OrderIdSchema,
  UpdateOrderStatusSchema,
} from "../validations/ordersValidation.js";

const router = Router();

router.use(verifyToken);

// 1. Place Order
router.post("/place", async (req, res) => {
  try {
    const cart = await cartModel
      .findOne({ user: req.userId })
      .populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const newOrder = new Order({
      user: req.userId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalPrice,
    });

    await newOrder.save();
    cart.items = [];
    await cart.save();

    res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all orders of logged-in user
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).populate(
      "items.product"
    );
    res.json({ orders });
  } catch (err) {
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Update order status (Admin feature)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = OrderIdSchema.parse(req.params);
    const { status } = UpdateOrderStatusSchema.parse(req.body);

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order status updated", order });
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", issues: err.issues });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
