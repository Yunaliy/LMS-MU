import { createTransport } from "nodemailer";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendMail = async (email, subject, data) => {
  try {
    console.log("Email configuration:", {
      user: process.env.Gmail ? "Email set" : "Email missing",
      pass: process.env.password ? "Password set" : "Password missing"
    });

    const transport = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.Gmail,
        pass: process.env.password,
      },
      debug: true
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: red;
        }
        p {
            margin-bottom: 20px;
            color: #666;
        }
        .otp {
            font-size: 36px;
            color: #7b68ee; /* Purple text */
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OTP Verification</h1>
        <p>Hello ${data.name} your (One-Time Password) for your account verification is.</p>
        <p class="otp">${data.otp}</p> 
    </div>
</body>
</html>
`;

    console.log("Attempting to send email to:", email);
    const info = await transport.sendMail({
      from: process.env.Gmail,
      to: email,
      subject,
      html,
    });
    
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export default sendMail;

export const sendForgotMail = async (subject, data) => {
  try {
    console.log("Forgot password email configuration:", {
      user: process.env.Gmail ? "Email set" : "Email missing",
      pass: process.env.password ? "Password set" : "Password missing"
    });
    
    const transport = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.Gmail,
        pass: process.env.password,
      },
      debug: true
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3f3f3;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      padding: 20px;
      margin: 20px auto;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-width: 600px;
    }
    h1 {
      color:#d97706; ;
    }
    p {
      color: #666666;
    }
    .button {
      display: inline-block;
      padding: 15px 25px;
      margin: 20px 0;
      background-color: #d97706;;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 16px;
    }
    .footer {
      margin-top: 20px;
      color: #999999;
      text-align: center;
    }
    .footer a {
      color: #5a2d82;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>
    <p>Hello ${data.name},</p>
    <p>You have requested to reset your password. Please click the button below to reset your password.</p>
    <a href="${process.env.FRONTEND_URL}/reset-password/${data.token}" class="button">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
    <p>This link will expire in 5 minutes.</p>
    <div class="footer">
      <p>Thank you,<br>Medinetul Uloom Team</p>
    </div>
  </div>
</body>
</html>
`;

    console.log("Attempting to send forgot password email to:", data.email);
    const info = await transport.sendMail({
      from: process.env.Gmail,
      to: data.email,
      subject,
      html,
    });
    
    console.log("Forgot password email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending forgot password email:", error);
    throw error;
  }
};

// Separate function to generate PDF
const generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Course Enrollment Receipt',
          Author: 'Medinetul Uloom',
          Subject: 'Course Enrollment Confirmation'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add decorative header with gradient
      doc
        .rect(30, 30, 535, 120)
        .fillAndStroke('#f8f9fa', '#b4690e');

      // Add logo to PDF with proper error handling
      try {
        const logoPath = path.join(__dirname, '../../client/public/logo3.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 50, { width: 80 })
             .moveDown(1);
        } else {
          console.warn('Logo file not found at:', logoPath);
        }
      } catch (logoError) {
        console.error('Error adding logo to PDF:', logoError);
      }

      // Add main title
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#b4690e')
        .text('MEDINETUL ULOOM', { align: 'center' })
        .moveDown(0.5)
        .fontSize(20)
        .text('ENROLLMENT RECEIPT', { align: 'center' })
        .moveDown(1);

      // Add student name with decorative underline
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text(`Student: ${data.userName}`, { align: 'center' })
        .moveDown(0.5)
        .rect(150, doc.y, 300, 1)
        .fill('#b4690e')
        .moveDown(1);

      // Add receipt details in a beautiful box
      const startX = 50;
      const startY = doc.y;
      const boxWidth = 500;
      const boxHeight = 300;

      // Draw main receipt box with gradient
      doc
        .rect(startX, startY, boxWidth, boxHeight)
        .fillAndStroke('#ffffff', '#b4690e');

      // Add receipt content with better spacing and styling
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#b4690e')
        .text('Receipt Details:', startX + 20, startY + 30)
        .moveDown(1);

      // Helper function for detail rows
      const addDetailRow = (label, value, y) => {
        doc
          .font('Helvetica-Bold')
          .fillColor('#666')
          .text(label, startX + 30, y)
          .font('Helvetica')
          .fillColor('#333')
          .text(value, startX + 200, y);
      };

      // Add receipt details with better formatting
      let currentY = startY + 60;
      const lineHeight = 25;

      addDetailRow('Transaction ID:', data.transactionId, currentY);
      currentY += lineHeight;
      addDetailRow('Date:', new Date(data.createdAt).toLocaleDateString(), currentY);
      currentY += lineHeight;
      addDetailRow('Course Title:', data.course.title, currentY);
      currentY += lineHeight;
      addDetailRow('Amount Paid:', `ETB ${data.amount}`, currentY);
      currentY += lineHeight;
      addDetailRow('Payment Method:', data.paymentMethod, currentY);
      currentY += lineHeight;
      addDetailRow('Status:', data.status, currentY);
      currentY += lineHeight;
      addDetailRow('Course ID:', data.course._id, currentY);

      // Add decorative footer
      doc
        .moveDown(2)
        .fontSize(10)
        .fillColor('#666')
        .text('This is an official receipt for your course enrollment', { align: 'center' })
        .text('Please keep this receipt for your records', { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
        .moveDown(1)
        .text('Thank you for choosing our platform!', { align: 'center' });

      // Add page border with gradient
      doc
        .rect(30, 30, 535, 755)
        .stroke('#b4690e');

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const sendReceiptMail = async (email, data) => {
  try {
    const transport = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.Gmail,
        pass: process.env.password,
      },
      debug: true
    });

    // Generate PDF only once
    const pdfBuffer = await generatePDF(data);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Enrollment Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #b4690e;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 15px;
        }
        .content {
            padding: 20px 0;
        }
        .confirmation-box {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .details {
            margin: 20px 0;
        }
        .detail-row {
            margin-bottom: 10px;
        }
        .label {
            font-weight: bold;
            color: #666;
        }
        .cta-button {
            display: inline-block;
            background-color: #b4690e;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
        .pdf-notice {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="cid:logo" alt="Logo" class="logo">
            <h1 style="color: #b4690e; margin: 0;">Enrollment Confirmed</h1>
        </div>

        <div class="content">
            <div class="confirmation-box">
                <p>Thank you for enrolling in <strong>${data.course.title}</strong>!</p>
                <p>We have emailed you a confirmation message and receipt to your email. Further communication will be through your email.</p>
            </div>
            <div class="details">
                <div class="detail-row"><span class="label">Transaction ID:</span> ${data.transactionId}</div>
                <div class="detail-row"><span class="label">Date:</span> ${new Date(data.createdAt).toLocaleDateString()}</div>
                <div class="detail-row"><span class="label">Course Title:</span> ${data.course.title}</div>
                <div class="detail-row"><span class="label">Course ID:</span> ${data.course._id}</div>
                <div class="detail-row"><span class="label">Amount Paid:</span> ETB ${data.amount}</div>
                <div class="detail-row"><span class="label">Payment Method:</span> ${data.paymentMethod}</div>
                <div class="detail-row"><span class="label">Status:</span> ${data.status}</div>
            </div>
            <a href="${process.env.FRONTEND_URL}/course/${data.course._id}" class="cta-button">Start Learning</a>
            <p>A PDF copy of your enrollment receipt has been attached to this email for your records.</p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Medinetul Uloom. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const info = await transport.sendMail({
      from: process.env.Gmail,
      to: email,
      subject: "Course Enrollment Confirmation",
      html,
      attachments: [
        {
          filename: `receipt-${data.transactionId}.pdf`,
          content: pdfBuffer
        },
        {
          filename: 'logo.jpg',
          path: path.join(__dirname, '../../client/public/logo.jpg'),
          cid: 'logo'
        }
      ]
    });
    
    console.log("Receipt email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error;
  }
};
