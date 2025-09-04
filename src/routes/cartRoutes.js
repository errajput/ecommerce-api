import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import cartModel from "../models/cartModel.js";
import {
  AddToCartSchema,
  ClearCartSchema,
  GetCartSchema,
  RemoveFromCartSchema,
  UpdateQuantitySchema,
} from "../validations/cartValidation.js";
import { ZodError } from "zod";

const router = Router();

// 1. Add product to cart
router.post("/items", verifyToken, async (req, res) => {
  try {
    const validatedData = AddToCartSchema.parse(req.body);
    let cart = await cartModel.findOne({ user: req.userId });

    if (!cart) {
      cart = new cartModel({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === validatedData.product
    );
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push(validatedData);
    }

    await cart.save();
    res.status(201).json({ message: "Product added in cart", cart });
  } catch (error) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", errors: error.issues });
    }
    console.log(`Error - ${req.method}:${req.path} - `, error);
    return res.status(500).json({ error: error.message });
  }
});
// 2. Get cart products
router.get("/", verifyToken, async (req, res) => {
  try {
    GetCartSchema.parse(req.query);
    const cart = await cartModel
      .findOne({ user: req.userId })
      .populate("items.product");

    if (!cart) return res.json({ items: [] });

    res.json({ message: "Get cart products", cart });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Quantity of product
router.patch("/items/:itemId", verifyToken, async (req, res) => {
  try {
    const validatedData = UpdateQuantitySchema.parse(req.body);
    const { itemId } = RemoveFromCartSchema.parse(req.params);

    const cart = await cartModel.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = validatedData.quantity;

    await cart.save();
    res.json({ message: "Updated product quantity", cart });
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", issues: err.issues });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(403)
        .json({ error: "Token expired. Please login again." });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ message: err.message });
  }
});

// 4. remove product from cart
router.delete("/items/:itemId", verifyToken, async (req, res) => {
  try {
    const { itemId } = RemoveFromCartSchema.parse(req.params);
    const cart = await cartModel.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.save();
    res.json({ message: "Deleted product.", cart });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Clear cart
router.delete("/items", verifyToken, async (req, res) => {
  try {
    ClearCartSchema.parse(req.body);
    const cart = await cartModel.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.json({ message: "Cart cleared", cart });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
