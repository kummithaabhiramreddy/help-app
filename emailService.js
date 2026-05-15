import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a premium registration confirmation email
 * @param {Object} donor - Donor details
 */
export async function sendRegistrationEmail(donor) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials missing in .env. Skipping registration email.');
    return;
  }

  const mailOptions = {
    from: `"UDBHAV Registry" <${process.env.EMAIL_USER}>`,
    to: donor.email,
    subject: 'Welcome to UDBHAV - Your Life-Saving Journey Begins',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ff4d4d, #e60000); padding: 40px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 30px; background: #ffffff; }
          .hero-text { font-size: 18px; font-weight: 600; color: #ff4d4d; margin-bottom: 20px; }
          .donor-card { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ff4d4d; }
          .donor-id { font-family: monospace; font-size: 20px; color: #e60000; font-weight: bold; }
          .detail-row { margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
          .detail-label { color: #888; font-size: 13px; }
          .detail-value { font-weight: 600; }
          .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #777; }
          .btn { display: inline-block; padding: 12px 25px; background: #ff4d4d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
          .tag { background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 11px; vertical-align: middle; margin-left: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>UDBHAV REGISTRY</h1>
            <p>Human Emergency Life Provider</p>
          </div>
          <div class="content">
            <p class="hero-text">Thank you for choosing to be a hero, ${donor.name.split(' ')[0]}!</p>
            <p>Your registration in the UDBHAV Organ and Blood Donor Registry has been successfully verified and stored in our secure PostgreSQL database.</p>
            
            <div class="donor-card">
              <div style="margin-bottom: 15px;">
                <span class="detail-label">OFFICIAL DONOR ID</span><br/>
                <span class="donor-id">${donor.donorId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Donation Type</span>
                <span class="detail-value">${donor.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Blood Group</span>
                <span class="detail-value">${donor.bloodgroup || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">City</span>
                <span class="detail-value">${donor.city}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Date</span>
                <span class="detail-value">${donor.registeredOn}</span>
              </div>
            </div>

            <p>Being a part of this registry means you are ready to provide life-saving support in case of emergencies. We have logged your details and you are now visible to hospitals and certified medical responders in your area.</p>
            
            <p style="font-size: 14px; font-style: italic; color: #666;">"The measure of life is not its duration, but its donation."</p>
            
            <a href="http://localhost:3000/home.html" class="btn">Access Portal</a>
          </div>
          <div class="footer">
            <p>&copy; 2026 UDBHAV Registry System • Bhimavaram, Andhra Pradesh</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Registration email sent to ${donor.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send registration email to ${donor.email}:`, error);
    throw error;
  }
}

/**
 * Send an OTP code for password reset
 * @param {string} email 
 * @param {string} code 
 */
export async function sendOTPEmail(email, code) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials missing. OTP will be logged only.');
    return { simulated: true };
  }

  const mailOptions = {
    from: `"HELP Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${code} is your HELP password reset code`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 30px;">
        <h2 style="color: #f04e7a; margin-top: 0;">Password Reset</h2>
        <p>We received a request to reset your HELP account password.</p>
        <p>Use the following code to proceed:</p>
        <div style="background: #fdf2f5; border: 1px dashed #f04e7a; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #f04e7a; margin: 20px 0; border-radius: 8px;">
          ${code}
        </div>
        <p style="font-size: 13px; color: #666;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999; text-align: center;">&copy; 2026 HELP Emergency Network</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { simulated: false };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error);
    throw error;
  }
}
