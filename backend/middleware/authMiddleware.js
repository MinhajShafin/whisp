import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import TokenBlacklist from "../models/tokenBlacklistModel.js";

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // get token

      // Check if token is blacklisted
      const isBlacklisted = await TokenBlacklist.findOne({ token });
      if (isBlacklisted) {
        return res.status(401).json({ message: "Token is invalid" });
      }

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user to request, excluding password
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      req.user = user;

      return next(); // continue to the next middleware or route
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
