import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./database/db.js";
import cors from "cors";
import axios from "axios";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'], // Add 'Authorization' here
  credentials: true
}));

// Add explicit OPTIONS handling for preflight requests
app.options('*', cors());

const port = process.env.PORT || 5000;

// Chapa Configuration
const CHAPA_AUTH_KEY = process.env.CHAPA_AUTH_KEY;
const CHAPA_BASE_URL = "https://api.chapa.co/v1/transaction";

// Verify Chapa configuration on startup
if (!CHAPA_AUTH_KEY) {
  console.error("FATAL ERROR: CHAPA_AUTH_KEY is not defined");
  process.exit(1);
}

// Basic route
app.get("/", (req, res) => {
  res.send("Server is working");
});

// Static files with proper CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Accept-Ranges', 'bytes');
  
  // Set content type based on file extension and path
  const ext = path.extname(req.path).toLowerCase();
  const filePath = req.path.toLowerCase();
  
  if (filePath.includes('/lectures/') && ext === '.mp4') {
    res.setHeader('Content-Type', 'video/mp4');
  } else if (filePath.includes('/profiles/')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
  } else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {  // Add audio content types
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4'
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'audio/mpeg');
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Payment Initialization Endpoint
app.post("/api/payment/initialize", async (req, res) => {
  try {
    // 1. Validate token header
    const token = req.headers.token;
    console.log("Received headers:", {
      ...req.headers,
      token: token ? "Present" : "Missing"
    });

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required",
        code: "MISSING_TOKEN"
      });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        ignoreExpiration: false
      });
      console.log("Token decoded successfully:", {
        userId: decoded._id,
        iat: new Date(decoded.iat * 1000).toISOString(),
        exp: new Date(decoded.exp * 1000).toISOString()
      });
    } catch (jwtError) {
      console.error("JWT verification error:", {
        name: jwtError.name,
        message: jwtError.message,
        expiredAt: jwtError.expiredAt,
        stack: jwtError.stack
      });
      return res.status(401).json({
        success: false,
        message: jwtError.message,
        code: jwtError.name === 'TokenExpiredError' ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
      });
    }

    const {       
      amount, 
      email, 
      courseId,
      userId,
      courseTitle 
    } = req.body;

    // Validate required fields
    if (!amount || !email || !courseId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields"
      });
    }

    // Generate unique transaction reference
    const tx_ref = `course-${courseId}-${Date.now()}`;
    
    // Prepare payment data
    const paymentData = {
      amount: String(Math.round(amount)),
      currency: "ETB",
      email,
      first_name: "Customer",
      tx_ref,
      callback_url: `${process.env.FRONTEND_URL}/payment-success?tx_ref=${tx_ref}`,
      return_url: `${process.env.FRONTEND_URL}/payment-success?tx_ref=${tx_ref}`,
      customization: {
        title: courseTitle ? courseTitle.substring(0, 16) : "Course Payment",
        description: "Course Enrollment"
      }
    };

    console.log("Payment initialization data:", {
      ...paymentData,
      callback_url: paymentData.callback_url
    });

    const headers = {
      Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
      "Content-Type": "application/json"
    };

    // Initialize payment with Chapa
    const response = await axios.post(
      `${CHAPA_BASE_URL}/initialize`,
      paymentData,
      { headers, timeout: 10000 }
    );

    console.log("Chapa response:", response.data);

    res.status(200).json({
      success: true,
      checkoutUrl: response.data.data.checkout_url,
      tx_ref,
      message: "Payment initialized successfully"
    });

  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Payment initialization failed",
      details: error.response?.data?.message || error.message
    });
  }
});

//Payment Verification and Enrollment Endpoint
app.post("/api/payment/verify-enroll", async (req, res) => {
  try {
    // 1. Validate token header
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required",
        code: "MISSING_TOKEN"
      });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        ignoreExpiration: false
      });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({
        success: false,
        message: jwtError.message,
        code: jwtError.name === 'TokenExpiredError' ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
      });
    }

    // 3. Validate request body
    const { tx_ref } = req.body;
    if (!tx_ref || typeof tx_ref !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Valid transaction reference required",
        code: "INVALID_TX_REF"
      });
    }

    console.log("Verifying transaction:", tx_ref);
    console.log("Using Chapa API Key:", CHAPA_AUTH_KEY ? "Present" : "Missing");

    // 4. Verify with Chapa API
    const chapaResponse = await axios.get(
      `${CHAPA_BASE_URL}/verify/${tx_ref}`,
      {
        headers: {
          "Authorization": `Bearer ${CHAPA_AUTH_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    console.log("Chapa verification response:", chapaResponse.data);

    // Check if the transaction exists and is successful
    if (!chapaResponse.data || !chapaResponse.data.data) {
      return res.status(402).json({
        success: false,
        message: "Transaction not found",
        code: "TRANSACTION_NOT_FOUND",
        details: chapaResponse.data
      });
    }

    const transaction = chapaResponse.data.data;
    if (transaction.status !== 'success') {
      return res.status(402).json({
        success: false,
        message: "Transaction was not successful",
        code: "TRANSACTION_FAILED",
        details: transaction
      });
    }

    // 5. Process enrollment
    const courseId = tx_ref.split('-')[1];
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course reference",
        code: "INVALID_COURSE_ID"
      });
    }

    const user = await User.findByIdAndUpdate(
      decoded._id,
      { $addToSet: { subscription: courseId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enrollment successful",
      courseId,
      chapaResponse: chapaResponse.data
    });

  } catch (error) {
    console.error("Verification error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    const status = error.response?.status || 500;
    const code = status === 401 ? "AUTH_ERROR" : 
                status === 402 ? "PAYMENT_VERIFICATION_FAILED" : 
                "SERVER_ERROR";

    return res.status(status).json({
      success: false,
      message: error.message,
      code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

app.post("/api/payment/webhook", 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    try {
      const payload = JSON.parse(req.body.toString());
      const signature = req.headers['x-chapa-signature'];

      // Log webhook data for debugging
      console.log("Webhook received:", {
        signature: signature ? "Present" : "Missing",
        payload: payload
      });

      // For now, we'll trust the webhook since Chapa's signature verification
      // implementation details are not provided
      const { tx_ref, status } = payload;

      if (status === "success") {
        const courseId = tx_ref.split('-')[1];
        
        // Find the user who made the payment
        const user = await User.findOne({ 
          'subscription': { $in: [courseId] }
        });

        if (user) {
          console.log(`Webhook: Payment successful for ${tx_ref}, user: ${user._id}`);
          return res.status(200).send("Webhook processed successfully");
        } else {
          console.log(`Webhook: User not found for transaction ${tx_ref}`);
          return res.status(404).send("User not found");
        }
      }

      console.log(`Webhook: Payment not successful for ${tx_ref}`);
      res.status(400).send("Payment not successful");

    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

// Import other routes
import userRoutes from "./routes/user.js";
import courseRoutes from "./routes/course.js";
import adminRoutes from "./routes/admin.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import notificationRoutes from "./routes/notification.js";

// Use other routes
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", adminRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Chapa API Key: ${CHAPA_AUTH_KEY ? 'Loaded' : 'Missing!'}`);
  connectDb();
});