import { Router } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import Product from "../models/ProductSchema.js";
import formidable from "formidable";

import { productUpdateSchema } from "../validations/ZobProductSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();
app.use(verifyToken);
// NOTE: Get All products

router.get("/", async (req, res) => {
  try {
    const {
      search,
      sortBy,
      sortOrder,
      filterBy,
      filterValue,
      pageNo,
      pageSize,
    } = req.query;

    const page = parseInt(pageNo) || 1;
    const limit = parseInt(pageSize) || 10;

    const userId = req.userId;

    const filterQuery = {
      createdBy: userId,
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
    res.json({
      message: "Success fetched.",
      products,
      totalRecords,
      recordsReturned: products.length,
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
    if (err instanceof jwt.TokenExpiredError) {
      res.status(403).send({ error: "Token expired please login again." });
      return;
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ message: err.message });
  }
});

// NOTE: Get Product by id
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const product = await Product.findById({
      _id: req.params.id,
      createdBy: userId,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
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

router.post("/", async (req, res) => {
  if (req.headers["content-type"] === "application/json") {
    try {
      const validatedData = productUpdateSchema.parse(req.body);
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
          res.status(403).send({ error: "error.", errors: error.issues });
          return;
        }
        console.log(`Error - ${req.method}:${req.path} - `, error);
        res.status(500).send({ error: error.message });
      }
    });
  }
});

// NOTE: For bulk Products
router.post("/bulk", async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Invalid data entered." });
    }
    if (products.length === 0) {
      return res.status(400).json({ message: "Invalid data." });
    }

    const validatedProducts = products.map((product) => {
      return productUpdateSchema.parse({
        ...product,
        createdBy: req.userId,
      });
    });

    const insertedProducts = await Product.insertMany(validatedProducts);
    res.status(201).send({ message: "Products Inserted", insertedProducts });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(403).send({ error: "error.", errors: err.issues });
      return;
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).send({ error: err.message });
  }
});

// NOTE: Update the product
router.patch("/:id", async (req, res) => {
  if (req.headers["content-type"]?.includes("application/json")) {
    try {
      const userId = req.userId;
      const validatedData = productUpdateSchema.parse(req.body);
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, createdBy: userId },
        { $set: validatedData },
        { new: true }
      );
      if (!product) {
        return res.status(404).json({ message: "Product not found " });
      }

      res.json({ message: "Product updated successfully", data: product });
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
  } else {
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Image upload failed" });
      try {
        const userId = req.userId;
        const product = await Product.findOne({
          _id: req.params.id,
          createdBy: userId,
        });
        let newImages = product.images;
        if (files.images) {
          const fileArray = Array.isArray(files.images)
            ? files.images
            : [files.images];
          newImages = fileArray.map((file) => `/uploads/${file.newFilename}`);
        }
        const Data = {
          name: fields.name?.[0] ?? product.name,
          price: fields.price?.[0] ? Number(fields.price[0]) : product.price,
          description: fields.description?.[0] ?? product.description,
          brand: fields.brand?.[0] ?? product.brand,
          category: fields.category?.[0] ?? product.category,
          status: fields.status?.[0] ?? product.status,
          stock: fields.stock?.[0] ? Number(fields.stock[0]) : product.stock,
          images: newImages,
        };
        const validatedData = productUpdateSchema.parse(Data);

        Object.assign(product, validatedData);

        await product.save();

        res.json({ message: "Product updated successfully", data: product });
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
  }
});

// NOTE: Delete The product
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const deleted = await Product.findByIdAndDelete({
      _id: req.params.id,
      createdBy: userId,
    });
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted", data: deleted });
  } catch (err) {
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).json({ message: err.message });
  }
});
export default router;
