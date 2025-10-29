# Whisp Backend API

A RESTful API backend for Whisp, a cozy microblogging platform built with Node.js, Express, and MongoDB.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Express Rate Limiter
- **Password Hashing**: bcryptjs

## 📋 Features

- User authentication (register, login, logout with token blacklisting)
- Email verification (verify link + resend)
- Password change that forces re-login on all devices
- Post whispers (short updates, max 280 characters)
- Like/dislike system with Reddit-style scoring (points = likes - dislikes)
- Comments and nested replies
- Friend system with blocking functionality
- Personalized timeline feed
- Pagination support for whispers and timeline
- Rate limiting for API protection
- Protected routes with JWT middleware

## 🛠️ Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. **Navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/whisp
PORT=5000
JWT_SECRET=your_secret_key_here
```

4. **Start the server:**

```bash
# Production
npm start

# Development
npm run dev
```

The server will run on **http://localhost:5000** (or the PORT specified in `.env`).

⚠️ **Important**: Make sure your API client (Postman, frontend) uses port **5000**, not 3000.

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected routes require an `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Auth Routes

### Register

```http
POST /api/auth/register
```

**Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "_id": "user_id",
  "username": "john_doe",
  "email": "john@example.com",
  "isEmailVerified": false,
  "message": "Registration successful! Please check your email to verify your account.",
  "token": "jwt_token_here"
}
```

### Login

```http
POST /api/auth/login
```

**Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "_id": "user_id",
  "username": "john_doe",
  "email": "john@example.com",
  "isEmailVerified": true,
  "token": "jwt_token_here"
}
```

If the email is not verified:

```json
{
  "message": "Please verify your email before logging in. Check your inbox for the verification link.",
  "requiresVerification": true
}
```

### Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

### Verify Email

```http
GET /api/auth/verify-email/:token
```

**URL Parameters:**

- `token` - Email verification token sent to user's email

**Response (Success):**

```json
{
  "message": "Email verified successfully! You can now log in.",
  "verified": true
}
```

**Response (Error):**

```json
{
  "message": "Invalid or expired verification token. Please request a new verification email."
}
```

### Resend Verification Email

```http
POST /api/auth/resend-verification
```

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Verification email resent successfully. Please check your inbox."
}
```

---

## 👤 User Routes

### Get User Profile

```http
GET /api/users/:id
```

**Response:**

```json
{
  "_id": "user_id",
  "username": "john_doe",
  "bio": "",
  "avatar": "",
  "friendCount": 0,
  "whisperCount": 0,
  "mutualFriendsWithRequester": 0,
  "createdAt": "2025-10-28T12:00:00.000Z",
  "relationship": {
    "isSelf": false,
    "isFriend": false,
    "hasSentRequest": false,
    "hasIncomingRequest": false,
    "isBlocked": false
  }
}
```

### Update User Profile

```http
PUT /api/users/me
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "username": "new_username",
  "bio": "updated bio",
  "avatar": "https://..."
}
```

### Change Password

```http
PUT /api/users/me/password
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "currentPassword": "oldPass123",
  "newPassword": "newPass456"
}
```

**Response:**

```json
{ "message": "Password changed successfully", "requireReauth": true }
```

After success, all existing tokens are invalidated and the client should log in again.

### Delete Account

```http
DELETE /api/users/me
```

Deletes the user, removes friendships/requests/blocks referencing the user, and deletes the user's whispers and messages.

### Search User by Username

```http
GET /api/users/search/:username
```

**Response:**

```json
{ "_id": "user_id", "username": "John_Doe" }
```

### Block / Unblock Users

```http
POST /api/users/block/:userId
POST /api/users/unblock/:userId
GET  /api/users/blocked
```

---

## 💬 Whisper Routes

### Get All Whispers (Public)

```http
GET /api/whispers
```

**Optional Query Params:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)

**Response (without pagination):**

```json
[
  {
    "_id": "whisper_id",
    "user": { "_id": "user_id", "username": "john_doe" },
    "content": "Hello World!",
    "likes": [],
    "dislikes": [],
    "comments": [],
    "createdAt": "2025-10-28T12:00:00.000Z",
    "points": 0
  }
]
```

**Response (with pagination):**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalDocs": 50,
    "totalPages": 5,
    "hasPrev": false,
    "hasNext": true
  }
}
```

### Get Timeline (Protected)

```http
GET /api/whispers/timeline
```

**Headers:** `Authorization: Bearer <token>`

**Optional Query Params:** Same as Get All Whispers

Returns whispers from user and their friends, with enriched data including:

- `likeCount`, `dislikeCount`, `points` for whispers, comments, and replies
- Comments and replies sorted by newest first

### Create Whisper

```http
POST /api/whispers
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "content": "This is my whisper! 🌿"
}
```

### Like a Whisper

```http
POST /api/whispers/:id/like
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Liked",
  "likeCount": 3,
  "dislikeCount": 1,
  "points": 2
}
```

### Dislike a Whisper

```http
POST /api/whispers/:id/dislike
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Disliked",
  "likeCount": 2,
  "dislikeCount": 2,
  "points": 0
}
```

---

## 💬 Comment Routes

### Add Comment

```http
POST /api/whispers/:id/comment
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "text": "Great whisper!"
}
```

### Like a Comment

```http
POST /api/whispers/:id/comment/:commentId/like
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Liked",
  "comment": { ... },
  "likeCount": 5,
  "dislikeCount": 0,
  "points": 5
}
```

### Dislike a Comment

```http
POST /api/whispers/:id/comment/:commentId/dislike
```

**Headers:** `Authorization: Bearer <token>`

### Edit Comment

```http
PUT /api/whispers/:id/comment/:commentId
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "text": "Updated comment text"
}
```

### Delete Comment

```http
DELETE /api/whispers/:id/comment/:commentId
```

**Headers:** `Authorization: Bearer <token>`

---

## 💭 Reply Routes

### Add Reply to Comment

```http
POST /api/whispers/:id/comment/:commentId/reply
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "text": "Reply text here"
}
```

### Like a Reply

```http
POST /api/whispers/:id/comment/:commentId/reply/:replyId/like
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Liked",
  "reply": { ... },
  "likeCount": 2,
  "dislikeCount": 0,
  "points": 2
}
```

### Dislike a Reply

```http
POST /api/whispers/:id/comment/:commentId/reply/:replyId/dislike
```

**Headers:** `Authorization: Bearer <token>`

### Edit Reply

```http
PUT /api/whispers/:id/comment/:commentId/reply/:replyId
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "text": "Updated reply text"
}
```

### Delete Reply

```http
DELETE /api/whispers/:id/comment/:commentId/reply/:replyId
```

**Headers:** `Authorization: Bearer <token>`

---

## 👥 Friend Routes

### Endpoints

All require `Authorization: Bearer <token>`.

- Send request: `POST /api/friends/request` — Body `{ "receiverId": "<userId>" }`
- Accept request: `POST /api/friends/accept` — Body `{ "senderId": "<userId>" }`
- Reject request: `POST /api/friends/reject` — Body `{ "senderId": "<userId>" }`
- Cancel sent request: `POST /api/friends/cancel` — Body `{ "receiverId": "<userId>" }`
- List friends: `GET /api/friends/friends`
- Incoming requests: `GET /api/friends/requests`
- Outgoing (sent) requests: `GET /api/friends/outgoing`
- Mutual friends with someone: `GET /api/friends/mutual/:friendId`
- Remove friend: `DELETE /api/friends/:friendId`

---

## 💌 Message Routes

### Send Message

```http
POST /api/messages
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "receiverId": "recipient_user_id",
  "content": "Hello!"
}
```

### Get Conversation

```http
GET /api/messages/:userId
```

**Headers:** `Authorization: Bearer <token>`

Returns all messages between the authenticated user and the specified user.

---

## 🔒 Security Features

### Rate Limiting

**Global API Limiter:**

- 100 requests per 15 minutes per IP

**Auth Endpoints Limiter:**

- 10 requests per 15 minutes per IP
- Applies to `/api/auth/login` and `/api/auth/register`

### Token Blacklisting

When a user logs out, their JWT token is added to a blacklist that automatically expires based on the token's expiration time.

### Protected Routes

All routes requiring authentication check:

1. Valid JWT token
2. Token not blacklisted
3. User exists in database

### Password Change Forces Re-Authentication

When a user changes their password:

- `passwordChangedAt` is recorded on the user.
- The auth middleware rejects any JWT where `iat < passwordChangedAt`.
- The currently used token is added to a blacklist, invalidating it immediately.

---

## 📊 Data Models

### User

- `username` (unique, required)
- `email` (unique, required)
- `password` (hashed)
- `avatar` (optional)
- `friends` (array of user IDs)
- `blocked` (array of user IDs)
- `bio` (optional)
- `isEmailVerified` (boolean)
- `emailVerificationToken` (string)
- `emailVerificationExpires` (date)
- `passwordChangedAt` (date)

### Whisper

- `user` (ref to User)
- `content` (max 280 chars)
- `likes` (array of user IDs)
- `dislikes` (array of user IDs)
- `comments` (embedded array)
- `createdAt` (timestamp)
- `points` (virtual: likes - dislikes)

### Comment (embedded in Whisper)

- `user` (ref to User)
- `text` (required)
- `likes` (array of user IDs)
- `dislikes` (array of user IDs)
- `replies` (embedded array)
- `createdAt` (timestamp)

### Reply (embedded in Comment)

- `user` (ref to User)
- `text` (required)
- `likes` (array of user IDs)
- `dislikes` (array of user IDs)
- `createdAt` (timestamp)

---

## 🐛 Common Issues

### Port Conflict

If you see `EADDRINUSE`, another process is using port 5000:

```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Error

- Verify your `MONGO_URI` in `.env`
- Check network access in MongoDB Atlas
- Ensure your IP is whitelisted

### Token Errors

- Make sure you're sending the token in the format: `Bearer <token>`
- Check that the token hasn't expired (default: 30 days)
- After logout, the token is blacklisted and cannot be reused

### 401 After Changing Password

Expected: password change invalidates existing tokens. Log in again to get a new token.

---

## 🧪 Testing with Postman

1. **Register/Login** to get a JWT token
2. **Copy the token** from the response
3. **Set Authorization header** in subsequent requests:
   - Type: Bearer Token
   - Token: `<paste_your_token>`
4. Test protected endpoints

### Example Workflow:

1. POST `/api/auth/register` → Get token
2. POST `/api/whispers` → Create a whisper
3. POST `/api/whispers/:id/like` → Like your whisper
4. GET `/api/whispers/timeline` → See your feed
5. PUT `/api/users/me/password` → Change password (observe 401 on old tokens)
6. POST `/api/auth/logout` → Invalidate token

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js   # Auth logic
│   ├── friendController.js # Friend management
│   ├── messageController.js# Messaging
│   ├── userController.js   # User profiles
│   └── whisperController.js# Whisper CRUD + interactions
├── middleware/
│   └── authMiddleware.js   # JWT verification
├── models/
│   ├── messageModel.js     # Message schema
│   ├── tokenBlacklistModel.js # Blacklisted tokens
│   ├── userModel.js        # User schema
│   └── whisperModel.js     # Whisper schema
├── routes/
│   ├── authRoutes.js
│   ├── friendRoutes.js
│   ├── messageRoutes.js
│   ├── userRoutes.js
│   └── whisperRoutes.js
├── .env                    # Environment variables (gitignored)
├── .env.example            # Template for .env
├── package.json
└── server.js               # Entry point
```

---

## 🚧 Future Enhancements

- [ ] Real-time messaging with Socket.io
- [ ] Image/media upload support
- [ ] Hashtag and mention system
- [ ] Trending whispers algorithm
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)
- [ ] User profile avatars with cloud storage
- [ ] Separate Comment collection for better scalability

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

_Made with ☕ and 🌿_
