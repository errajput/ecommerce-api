import express from "express";
import bcrypt from "bcrypt";
import User from "../models/UserSchema.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// NOTE: For register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NOTE: For login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //NOTE: Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    //NOTE: Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    //NOTE: Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email }, // payload
      process.env.JWT_SECRET, // secret key
      { expiresIn: "1h" } // token expiry
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.log("getting error", err);

    res.status(500).json({ message: err.message });
  }
});

export default router;
