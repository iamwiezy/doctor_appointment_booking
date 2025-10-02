import jwt from "jsonwebtoken";

// Doctor authentication middleware - Updated for httpOnly cookies
const authDoctor = async (req, res, next) => {
  try {
    // Read token from httpOnly cookie instead of Authorization header
    const token = req.cookies.doctorToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized, Login again",
      });
    }

    // Verify token
    let token_decode;
    try {
      token_decode = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired, please login again",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token, please login again",
      });
    }

    // Initialize req.body if it doesn't exist
    if (!req.body) req.body = {};

    // Add doctor ID to request body for downstream controllers
    req.body.userId = token_decode.id;

    next();
  } catch (error) {
    console.error("Doctor auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication error occurred",
    });
  }
};

export default authDoctor;
