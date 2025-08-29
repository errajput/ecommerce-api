import express from "express";

import User from "../models/UserSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/user
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.log("getting", err);

    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
