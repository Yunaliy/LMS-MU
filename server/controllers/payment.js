import { Payment } from "../models/Payment.js";
import TryCatch from "../middlewares/TryCatch.js";
import { User } from "../models/User.js";
import { Courses } from "../models/Courses.js";
import { Progress } from "../models/Progress.js";
import { createNotification } from "./Notification.js";

export const initializePayment = TryCatch(async (req, res) => {
  try {
    const { amount, email, courseId, userId, courseTitle, return_url, tx_ref } = req.body;

    if (!amount || !email || !courseId || !userId || !courseTitle) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Verify user and course exist
    const user = await User.findById(userId);
    const course = await Courses.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        message: "User or course not found"
      });
    }

    // Check if user already has the course
    if (user.subscription.includes(courseId)) {
      return res.status(400).json({
        success: false,
        message: "You already have this course"
      });
    }

    // Initialize Chapa payment
    const payload = {
      amount,
      currency: 'ETB',
      email: email,
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ').slice(1).join(' ') || 'N/A',
      tx_ref,
      callback_url: return_url,
      return_url,
      customization: {
        title: `Payment for ${courseTitle}`,
        description: `Course enrollment payment for ${courseTitle}`
      }
    };

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.status || data.status !== 'success') {
      throw new Error(data.message || 'Failed to initialize payment');
    }

    // Create payment record
    await Payment.create({
      chapa_transaction_id: data.data.transaction_id,
      chapa_reference_id: tx_ref,
      amount,
      currency: 'ETB',
      status: 'created',
      customer_info: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email
      },
      metadata: {
        courseId,
        userId
      }
    });

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      checkoutUrl: data.data.checkout_url
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment initialization failed'
    });
  }
});

export const verifyEnrollment = TryCatch(async (req, res) => {
  try {
    const { tx_ref } = req.body;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        message: "Transaction reference is required"
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ chapa_reference_id: tx_ref });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // Verify with Chapa
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'success') {
      // Update payment status
      payment.status = 'success';
      payment.payment_method = data.data.payment_method;
      await payment.save();

      // Get user and course
      const user = await User.findById(payment.metadata.userId);
      const course = await Courses.findById(payment.metadata.courseId);

      if (!user || !course) {
        throw new Error('User or course not found');
      }

      // Add course to user's subscription if not already added
      if (!user.subscription.includes(course._id)) {
        user.subscription.push(course._id);
        await user.save();

        // Create progress record
        await Progress.create({
          course: course._id,
          completedLectures: [],
          user: user._id
        });

        // Create notification
        await createNotification(
          user._id,
          'course',
          'Course Enrollment Successful',
          `You have successfully enrolled in ${course.title}`,
          course._id
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Course enrollment successful'
      });
    } else {
      // Update payment as failed
      payment.status = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
}); 