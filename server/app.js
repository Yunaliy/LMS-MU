import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import courseRoute from './routes/course.js';
import userRoute from './routes/user.js';
import paymentRoute from './routes/payment.js';
import certificateRoute from './routes/certificateRoutes.js';
import { ErrorMiddleware } from './middlewares/Error.js';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import lectureRoute from "./routes/lecture.js";

config();

const app = express();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(cookieParser());

// Serve static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/public', express.static(join(__dirname, 'public')));

// Routes
app.use('/api', courseRoute);
app.use('/api', userRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/certificate', certificateRoute);
app.use('/api', lectureRoute);

app.get('/', (req, res) => {
  res.send('Server is working');
});

// Error handling
app.use(ErrorMiddleware);

export default app; 