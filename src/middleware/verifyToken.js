import jwt from "jsonwebtoken";
import { verifyJwt } from "../shared/utils.js";

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
