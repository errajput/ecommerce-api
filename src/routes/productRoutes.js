import { Router } from "express";
import jwt from "jsonwebtoken";
import z, { ZodError } from "zod";

import Product from "../models/ProductSchema.js";
import formidable from "formidable";
import fs from "fs";
import path from "path";

import {
  productUpdateSchema,
  productAddSchema,
  productQuerySchema,
  objectIdSchema,
  productBulkSchema,
} from "../validations/productValidation.js";
import {
  isSeller,
  verifyToken,
  verifyTokenWithOutError,
} from "../middleware/verifyToken.js";
import User from "../models/UserSchema.js";
import cartModel from "../models/cartModel.js";

const router = Router();

// NOTE: Get All products

router.get("/", verifyTokenWithOutError, async (req, res) => {
  try {
    const validatedQuery = productQuerySchema.parse(req.query);
    const {
      search,
      sortBy,
      sortOrder,
      filterBy,
      filterValue,
      pageNo,
      pageSize,
    } = validatedQuery;

    const page = parseInt(pageNo) || 1;
    const limit = parseInt(pageSize) || 10;

    const filterQuery = {
      isDeleted: false,
      ...(search ? { name: new RegExp(search, "i") } : {}),
      ...(filterBy && filterValue ? { [filterBy]: filterValue } : {}),
    };

    const totalRecords = await Product.countDocuments(filterQuery);
    const products = await Product.find(filterQuery)
      .sort(
        sortBy ? { [sortBy]: sortOrder === "desc" ? -1 : 1 } : { createdAt: -1 }
      )
      .skip(limit * (page - 1))
      .limit(limit);

    //  Attach isInCart if user is logged in
    let userCart = null;
    if (req.userId) {
      userCart = await cartModel.findOne({ user: req.userId });
    }

    const updatedProducts = products.map((p) => {
      const isInCart = userCart
        ? userCart.items.some((i) => i.product.toString() === p._id.toString())
        : false;
      return { ...p.toObject(), isInCart };
    });

    res.json({
      message: "Successfully get.",
      products: updatedProducts,
      totalRecords,
      recordsReturned: updatedProducts.length,
      query: {
        search,
        sortBy,
        sortOrder,
        filterBy,
        filterValue,
        pageNo: page,
        pageSize: limit,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).send({ error: "error.", errors: err.issues });
      return;
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ message: err.message });
  }
});

// NOTE: Get Product by id
router.get("/:id", verifyTokenWithOutError, async (req, res) => {
  try {
    const { id } = objectIdSchema.parse(req.params);
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const userId = req.userId;
    let isInCart = false;
    if (userId) {
      const userCart = await cartModel.findOne({ user: userId });
      isInCart = userCart.items.some((i) => i.product.toString() === id);
    }
    res.json({
      message: "Product found",
      data: { ...product.toObject(), isInCart },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ message: err.message });
  }
});

// NOTE: Add new Product
const form = formidable({
  multiples: true,
  uploadDir: "uploads",
  keepExtensions: true,
});

router.post("/", verifyToken, isSeller, async (req, res) => {
  if (req.headers["content-type"] === "application/json") {
    try {
      const validatedData = productAddSchema.parse(req.body);
      const userId = req.userId;

      const insertProduct = await Product.insertOne({
        ...validatedData,
        createdBy: userId,
      });
      res.status(201).send({ message: "Products Inserted", insertProduct });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", issues: error.issues });
      }
      console.log(`Error - ${req.method}:${req.path} - `, error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Image upload failed" });

      try {
        let images = [];
        if (files.images) {
          const fileArray = Array.isArray(files.images)
            ? files.images
            : [files.images];
          images = fileArray.map((file) => `/uploads/${file.newFilename}`);
        }
        const data = {
          name: fields.name?.[0],
          price: Number(fields.price?.[0] || 0),
          description: fields.description?.[0],
          brand: fields.brand?.[0],
          category: fields.category?.[0],
          status: fields.status?.[0] || "active",
          stock: Number(fields.stock?.[0] || 0),
        };

        const validatedData = productUpdateSchema.parse(data);

        const newProduct = new Product({
          ...validatedData,
          createdBy: req.userId,
          images,
        });

        await newProduct.save();
        res.status(201).json({
          message: "Product created successfully",
          product: newProduct,
        });
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).send({ error: "error.", issues: error.issues });
          return;
        }
        console.log(`Error - ${req.method}:${req.path} - `, error);
        res.status(500).send({ error: error.message });
      }
    });
  }
});

// NOTE: For bulk Products
router.post("/bulk", verifyToken, isSeller, async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Invalid data entered." });
    }
    if (products.length === 0) {
      return res.status(400).json({ message: "Invalid data." });
    }

    const validatedProducts = productBulkSchema.parse(
      products.map((product) => ({
        ...product,
        createdBy: req.userId,
      }))
    );

    const insertedProducts = await Product.insertMany(validatedProducts);
    res
      .status(201)
      .send({ message: "Products Inserted", data: insertedProducts });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).send({ error: "error.", errors: err.issues });
      return;
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(403)
        .json({ error: "Token expired. Please login again." });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).send({ error: err.message });
  }
});

// NOTE: Update the product
router.patch("/:id", verifyToken, isSeller, async (req, res) => {
  if (req.headers["content-type"]?.includes("application/json")) {
    try {
      const userId = req.userId;
      const { id } = objectIdSchema.parse(req.params);
      const validatedData = productUpdateSchema.parse(req.body);
      const product = await Product.findOneAndUpdate(
        { _id: id, createdBy: userId },
        { $set: validatedData },
        { new: true }
      );
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product updated successfully", data: product });
    } catch (err) {
      if (err instanceof z.ZodError) {
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
  } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Image upload failed" });
      try {
        const userId = req.userId;
        const product = await Product.findOne({
          _id: req.params.id,
          createdBy: userId,
        });
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        let newImages = product.images;
        if (files.images) {
          const fileArray = Array.isArray(files.images)
            ? files.images
            : [files.images];
          newImages = fileArray.map((file) => `/uploads/${file.newFilename}`);
        }

        const userData = {
          name: fields.name?.[0],
          price: Number(fields.price?.[0] || 0),
          description: fields.description?.[0],
          brand: fields.brand?.[0],
          category: fields.category?.[0],
          status: fields.status?.[0],
          stock: Number(fields.stock?.[0] || 0),
          images: newImages,
        };
        const validatedData = productUpdateSchema.parse(userData);

        Object.assign(product, validatedData);

        await product.save();

        res.json({ message: "Product updated successfully", data: product });
      } catch (err) {
        if (err instanceof z.ZodError) {
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
  } else {
    return res.status(400).json({
      error:
        "Validation failed, Invalid Content-Type -- JSON or FormData Accepted",
    });
  }
});

// NOTE: restore product
router.patch("/restore/:id", verifyToken, isSeller, async (req, res) => {
  try {
    const { id } = objectIdSchema.parse(req.params);

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or not deleted" });
    }

    res.json({ message: "Product restored successfully", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NOTE: Delete The product
router.delete("/:id", verifyToken, isSeller, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findOne({ _id: userId });
    if (!user.isSeller) {
      throw new Error("You are not authorized for this action.");
    }
    const { id } = objectIdSchema.parse(req.params);

    const product = await Product.findOneAndUpdate(
      { _id: id, createdBy: userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from uploads folder (if any)
    if (product.images && product.images.length > 0) {
      product.images.forEach((imgPath) => {
        // Ensure correct file path (uploads inside /public or root)
        const filePath = path.join(
          process.cwd(),
          // "public",
          imgPath.replace(/^\//, "")
        );
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file: ${filePath}`, err.message);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      });
    }

    // const deleted = await Product.findByIdAndDelete({
    //   _id: id,
    //   createdBy: userId,
    // });
    // if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted", data: product });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", issues: err.issues });
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ message: err.message });
  }
});
export default router;
