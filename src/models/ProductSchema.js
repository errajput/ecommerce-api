import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "product is required"],
      trim: true,
      minLength: [3, "Minimum length must have 3 characters"],
      maxLength: [100, "Maximum length must have 100 Characters"],
      match: [
        /^[a-zA-Z0-9\s.()+]+$/,
        "Name must not contain some special characters",
      ],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1"],
      max: [1000000, "Price must be less than 1,000,000"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Description is required"],
      minLength: [10, "Description must be at least 10 characters long"],
      maxLength: [500, "Description must be less than 500 characters"],
    },
    brand: {
      type: String,
      trim: true,
      required: [true, "Brand is required"],
      enum: {
        values: [
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
      },
    },
    category: {
      type: String,
      trim: true,
      required: [true, "Category is required"],
      enum: {
        values: ["Laptop", "Mobile", "Tablet", "Accessory"],
        message:
          "Category must be either: Laptop, Mobile, Tablet, or Accessory",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "out_of_stock"],
        message: "Status must be either active, inactive, or out_of_stock",
      },
      default: "active",
    },
    stock: {
      type: Number,
      default: 0,
      required: false,
    },
    images: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
