import { z } from "zod";
export const productAddSchema = z.object(
  {
    name: z
      .string()
      .min(5, "Name must be at least 5 characters")
      .max(100, "Name must be less than 100 characters"),

    price: z.number().min(1, "Price must be greater than or equal to 1"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be less than 500 characters"),

    category: z.enum(["Laptop", "Mobile", "Tablet", "Accessory"], {
      errorMap: () => ({ message: "Invalid category" }),
    }),
    brand: z.enum(
      [
        "Apple",
        "Samsung",
        "Dell",
        "HP",
        "Google",
        "OnePlus",
        "Sony",
        "Lenovo",
        "Microsoft",
        "Huawei",
        "Xiaomi",
        "Amazon",
        "Vivo",
      ],
      {
        errorMap: () => ({
          message: "Brand must be Apple, Samsung, Dell, or HP",
        }),
      }
    ),

    status: z.enum(["active", "inactive", "out_of_stock"]).default("active"),

    images: z.array(z.string()).optional(),
    stock: z.number().positive("Price must be greater than 0"),

    createdBy: z.string(),
  },
  {
    error: "Invalid data in body.",
  }
);
export const productBulkSchema = z.array(productAddSchema);

// Validation schema for Edit (PATCH) → all fields optional
export const productUpdateSchema = productAddSchema
  .partial()
  .refine((data) => data.name || data.price || data.stock, {
    message: "You must update at least one of: name, price, or stock",
  });

export const productQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "category"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  filterBy: z.enum(["category", "brand"]).optional(),
  filterValue: z.string().optional(),
  pageNo: z.string().transform(Number).optional().default("1"),
  pageSize: z.string().transform(Number).optional().default(10),
});
export const objectIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
});
