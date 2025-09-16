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
    const user = await User.findById(req.userId).select("-password"); // exclude password
    return res.send({ message: "Successfully fetched.", data: { user } });
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
    const { name } = UpdateUserSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      req.userId, // comes from verifyToken
      { $set: { name } },
      { new: true }
    ).select("-password"); // don’t send password in response

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", data: { user } });
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", issues: err.issues });
    }
    console.error(`Error - ${req.method}:${req.path}`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
