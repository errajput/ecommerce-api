import { z } from "zod";

// For adding a product to cart
export const AddToCartSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive().default(1),
});

// For updating product quantity
export const UpdateQuantitySchema = z.object({
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

// Remove product (validate itemId param)
export const RemoveFromCartSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

// Get cart (no body, but still validate query if needed)
export const GetCartSchema = z.object({}); // empty, but placeholder

// Clear cart (no body)
export const ClearCartSchema = z.object({});
