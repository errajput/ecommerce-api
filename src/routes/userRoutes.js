import { Router } from "express";
import jwt from "jsonwebtoken";

import User from "../models/UserSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// GET /api/user
router.get("/", verifyToken, async (req, res) => {
  try {
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

export default router;
