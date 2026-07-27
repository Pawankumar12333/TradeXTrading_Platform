const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP email
const sendOTPEmail = async (to, otp, name, type = 'register') => {
  try {
    const subject = type === 'register' 
      ? 'Welcome to Trading Game - Your OTP Verification'
      : 'Reset Your Password - Trading Game OTP';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
          .logo { font-size: 48px; }
          h2 { color: #333; margin: 20px 0; }
          .otp-box { background: #f0f0f0; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
          .warning { color: #ff9800; font-size: 12px; text-align: center; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📈🎮</div>
            <h2>Trading Game</h2>
          </div>
          
          <p>Hello <strong>${name}</strong>,</p>
          
          <p>${type === 'register' 
            ? 'Thank you for registering with Trading Game! Please use the following OTP to verify your email address.' 
            : 'We received a request to reset your password. Use the OTP below to continue.'}</p>
          
          <div class="otp-box">
            ${otp}
          </div>
          
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          
          <div class="warning">
            ⚠️ Never share this OTP with anyone. Our support team will never ask for your OTP.
          </div>
          
          <div class="footer">
            <p>Trading Game - Predict &amp; Earn</p>
            <p>&copy; ${new Date().getFullYear()} Trading Game. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"Trading Game" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}`);
    return true;
    
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    
    // For development, log OTP to console
    console.log(`\n========== 🔐 OTP FOR ${to} ==========`);
    console.log(`OTP: ${otp}`);
    console.log(`Name: ${name}`);
    console.log(`Type: ${type}`);
    console.log(`==================================\n`);
    
    return false;
  }
};

module.exports = { sendOTPEmail };