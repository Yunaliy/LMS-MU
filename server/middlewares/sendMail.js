import { createTransport } from "nodemailer";

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
      color: #5a2d82;
    }
    p {
      color: #666666;
    }
    .button {
      display: inline-block;
      padding: 15px 25px;
      margin: 20px 0;
      background-color: #5a2d82;
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
      <p>Thank you,<br>E-Learning Team</p>
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
