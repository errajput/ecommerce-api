import { Router } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import Product from "../models/ProductSchema.js";
import formidable from "formidable";

import { zodSchema } from "../validations/ZobProductSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// NOTE: Get All products

router.get("/", verifyToken, async (req, res) => {
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

    const filterQuery = {
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
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
    console.log("POST Save Body", req.body);
    req.body = zodSchema.parse(req.body);

    const insertProduct = await Product.insertOne(req.body);
    res.send({ message: "Products Inserted", insertProduct });
    res.send(req.body);
  } else {
    // const [] = form.parse(req)
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

        const validatedData = zodSchema.parse(data);

        const newProduct = new Product({
          ...validatedData,
          images,
        });

        await newProduct.save();
        res.status(201).json(newProduct);
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

    const insertedProducts = await Product.insertMany(products);
    res.send({ message: "Products Inserted", insertedProducts });
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
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Image upload failed" });

    try {
      const product = await Product.findById(req.params.id);
      // console.log("PATCH product ID:", req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      // Handle new images if uploaded
      let newImages = product.images;
      if (files.images) {
        let fileArray = [];

        if (Array.isArray(files.images)) {
          fileArray = files.images;
        } else if (typeof files.images === "object") {
          fileArray = [files.images];
        }
        newImages = fileArray.map((file) => `/uploads/${file.newFilename}`);
        // Update fields (if provided)

        product.name = fields.name?.[0] || product.name;
        product.price = fields.price?.[0]
          ? Number(fields.price[0])
          : product.price;
        product.description = fields.description?.[0] || product.description;
        product.brand = fields.brand?.[0] || product.brand;
        product.category = fields.category?.[0] || product.category;
        product.status = fields.status?.[0] || product.status;
        product.stock = fields.stock?.[0]
          ? Number(fields.stock[0])
          : product.stock;
        product.images = newImages;

        await product.save();
        res.json(product);
      }
    } catch (err) {
      console.log("err message", err);

      res.status(400).json({ message: err.message });
    }
  });
});

// NOTE: Delete The product
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
