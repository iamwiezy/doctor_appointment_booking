import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";

// App config
const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
connectCloudinary();

//middleware
app.use(express.json());
app.use(cookieParser()); // Add this for cookie parsing

// Updated CORS configuration for httpOnly cookies
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:5173",
    ], // Add your frontend URLs
    credentials: true, // This is crucial for cookies to work
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false, // Handle preflight requests
    allowedHeaders: ["Content-Type", "Authorization", "atoken"], // include your custom headers here
  })
);

// API endpoint
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
