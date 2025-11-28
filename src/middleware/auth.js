const jwt = require("jsonwebtoken");
const Account = require("../model/account");

const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const decoded = jwt.verify(token, secret);

    // Check if user still exists (JWT payload has 'sub' which is account._id)
    const user = await Account.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Token is not valid" });
    }
    return res.status(401).json({ message: "Token is not valid" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { authMiddleware, isAdmin };
