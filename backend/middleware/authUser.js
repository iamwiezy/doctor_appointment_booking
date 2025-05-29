import jwt from "jsonwebtoken";

// User authentication middleware
const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized, Login again",
      });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure req.body is defined
    if (!req.body) {
      req.body = {};
    }

    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
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
};

export default authUser;
