# Email Verification Setup Guide

## Overview

Email verification has been added to the Whisp app. Users must verify their email before they can log in.

## Backend Setup

### 1. Environment Variables

Add these to your `/backend/.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

### 2. Getting Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Create a new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Use this password in `EMAIL_PASS` (NOT your regular Gmail password)

## How It Works

### Registration Flow

1. User fills out registration form
2. Backend creates user with `isEmailVerified: false`
3. Generates a verification token (valid for 24 hours)
4. Sends HTML email with verification link
5. Shows success message: "Check your email to verify your account"

### Email Verification Link

Format: `http://localhost:5173/verify-email/<token>`

When clicked:

- Frontend calls: `GET /api/auth/verify-email/:token`
- Backend validates token and expiration
- Sets `isEmailVerified: true`
- Redirects to login page

### Login Flow

1. User tries to log in
2. If email not verified:
   - Returns 403 error with `requiresVerification: true`
   - Shows message: "Please verify your email before logging in"
   - Offers "Resend verification email" button
3. If verified: Normal login proceeds

### Resend Verification

If user didn't receive email or it expired:

1. Click "Resend verification email" on login page
2. Backend generates new token
3. Sends new email with updated link

## API Endpoints

### Verify Email

```
GET /api/auth/verify-email/:token
```

### Resend Verification

```
POST /api/auth/resend-verification
Body: { "email": "user@example.com" }
```

## Frontend Pages

- `/register` - Shows email sent confirmation after registration
- `/verify-email/:token` - Handles token verification, shows success/error
- `/login` - Shows verification reminder, allows resending email

## Testing

1. **Start backend** (make sure EMAIL_USER and EMAIL_PASS are set):

   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Register with real email**:

   - Go to http://localhost:5173/register
   - Use a real email address you can access
   - Submit registration

4. **Check email**:

   - Look for email from your configured Gmail
   - Subject: "Verify Your Whisp Account"
   - Click verification link

5. **Verify and login**:
   - Click link → redirects to verification page
   - Shows success message
   - Click "Go to Login"
   - Login with verified account

## Troubleshooting

### Emails not sending?

- Check EMAIL_USER and EMAIL_PASS in .env
- Make sure you're using an App Password, not your regular password
- Verify 2FA is enabled on your Google account
- Check server logs for errors

### Token expired?

- Tokens expire after 24 hours
- User can request new verification email from login page
- Click "Resend verification email"

### Already verified but still can't login?

- Check database: `isEmailVerified` should be `true`
- Clear browser localStorage and try again
- Check backend logs for authentication errors

## Database Schema Changes

### User Model

New fields added:

```javascript
{
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date
}
```

## Files Modified

### Backend

- `models/userModel.js` - Added verification fields
- `services/emailService.js` - Created email service
- `controllers/authController.js` - Added verify/resend endpoints
- `routes/authRoutes.js` - Added new routes
- `.env.example` - Added EMAIL_USER and EMAIL_PASS

### Frontend

- `pages/auth/Register.jsx` - Shows email sent confirmation
- `pages/auth/Login.jsx` - Handles verification errors, resend
- `pages/auth/VerifyEmail.jsx` - New verification page
- `router.jsx` - Added /verify-email/:token route

## Security Notes

- Tokens are 32-byte random hex strings (64 characters)
- Tokens expire after 24 hours
- Verification checks both token match AND expiration
- Failed login attempts still respect rate limiting
- Verification tokens are cleared after successful verification
