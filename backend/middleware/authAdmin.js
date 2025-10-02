  import jwt from "jsonwebtoken";

  // Admin authentication middleware
  const authAdmin = async (req, res, next) => {
    try {
      // Read token from httpOnly cookie instead of headers
      const token = req.cookies.adminToken;

      if (!token) {
        return res.json({
          success: false,
          message: "Not Authorized, Login again",
        });
      }

      // Verify token with better error handling
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        // Handle specific JWT errors
        if (jwtError.name === "TokenExpiredError") {
          return res.json({
            success: false,
            message: "Session expired, please login again",
          });
        } else if (jwtError.name === "JsonWebTokenError") {
          return res.json({
            success: false,
            message: "Invalid token, please login again",
          });
        } else {
          return res.json({
            success: false,
            message: "Authentication failed, please login again",
          });
        }
      }

      // If using the old token format (email + password), keep this check
      // But if using the new format, check for admin role
      if (typeof decoded === "string") {
        // Old format compatibility
        if (decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
          return res.json({
            success: false,
            message: "Not Authorized, Login again",
          });
        }
      } else {
        // New format - check for admin role
        if (!decoded.isAdmin || decoded.email !== process.env.ADMIN_EMAIL) {
          return res.json({
            success: false,
            message: "Not Authorized, Login again",
          });
        }
      }

      // Add user info to request for use in routes
      req.user = decoded;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.json({
        success: false,
        message: "Authentication error occurred",
      });
    }
  };

  export default authAdmin;
