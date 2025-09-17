import jwt from "jsonwebtoken";
import { verifyJwt } from "../shared/utils.js";
import User from "../models/UserSchema.js";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Token format => "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = verifyJwt(token);

    req.userId = decoded.id; // Store userId in request
    next();
  } catch (err) {
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.JsonWebTokenError
    ) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const verifyTokenWithOutError = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return next();
    }

    // Token format => "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    const decoded = verifyJwt(token);

    req.userId = decoded.id; // Store userId in request
    next();
  } catch (err) {
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.JsonWebTokenError
    ) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const isSeller = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const user = await User.findById(req.userId).select("isSeller");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isSeller) {
      return res.status(403).json({ message: "Access denied: Sellers only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("isSeller middleware error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
