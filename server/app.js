import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import courseRoutes from "./routes/course.js";

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000", // Your React app's URL
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", courseRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 