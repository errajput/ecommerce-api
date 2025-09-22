import { Router } from "express";
import jwt from "jsonwebtoken";

import User from "../models/UserSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { UpdateUserSchema } from "../validations/authvalidation.js";
import { ZodError } from "zod";

const router = Router();

// GET /user
router.get("/profile", verifyToken, async (req, res) => {
  try {
    // console.log("Decoded userId:", req.userId);
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    return res.send({
      message: "Successfully fetched.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address || "",
        isSeller: user.isSeller,
      },
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(403).send({ error: "Token expired please login again." });
      return;
    }
    console.log(`Error - ${req.method}:${req.path} - `, err);
    res.status(500).send({ errors: err.message });
  }
});

router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const { name, address } = UpdateUserSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { name, address } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Return user directly inside data
    res.json({
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address || "",
        isSeller: user.isSeller,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
