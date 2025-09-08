import { z } from "zod";

// For updating order status (admin only)
export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]),
});

// For order ID param
export const OrderIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID format"),
});
