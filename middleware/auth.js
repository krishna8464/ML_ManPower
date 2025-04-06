const jwt = require("jsonwebtoken");
const { Tocken } = require("../models/tokenmodel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "ML_ManPower";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted or deactivated
    const existingToken = await Tocken.findOne({ token, is_active: true });

    if (!existingToken) {
      return res.status(403).json({ message: "Token is not active or has been logged out. Please login again." });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userid,
      role: decoded.role || "admin" // default role as admin
    };
    // Optionally attach token info
    req.tokenInfo = existingToken;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token", error: err.message });
  }
};

module.exports = { authMiddleware };
