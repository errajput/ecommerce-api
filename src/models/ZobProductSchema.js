import { z } from "zod";
export const zodSchema = z.object({
  name: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(100, "Name must be less than 100 characters"),

  price: z.number().positive("Price must be greater than 0"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),

  category: z.enum(["Laptop", "Mobile", "Tablet", "Accessory"], {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  brand: z.enum(["Apple", "Samsung", "Dell", "HP"], {
    errorMap: () => ({ message: "Brand must be Apple, Samsung, Dell, or HP" }),
  }),

  status: z.enum(["active", "inactive", "out_of_stock"]).default("active"),

  images: z.array(z.string()).optional(),
  stock: z.number().positive("Price must be greater than 0"),
});
export const zodsSchema = z.array(zodSchema);

// Validation schema for Edit (PATCH) → all fields optional
export const productUpdateSchema = zodSchema.partial();
