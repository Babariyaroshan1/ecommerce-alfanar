# Enterprise Admin Feature Setup Guide

This guide explains how to get the Admin Credits and Notifications features working in the current project.

> Note: The UI components for `Credits` and `Notifications` are already present, but the backend APIs and full feature wiring are not yet implemented.

## 1. What is already in place

- `nextjs/src/components/admin/Credits.jsx` exists
- `nextjs/src/components/admin/Notifications.jsx` exists
- `nextjs/src/components/admin/Dashboard.jsx` now includes sidebar links for `Credits` and `Notifications`
- Backend currently has Express, MongoDB, Cloudinary, Redis, Razorpay, and existing routes for auth, products, orders, settings, etc.

## 2. What is still missing

To make credits and notifications actually work, you must add the missing backend components and connect the frontend to them.

### Missing backend files and routes

- `backend/controllers/creditController.js`
- `backend/controllers/notificationController.js`
- `backend/routes/credits.js`
- `backend/routes/notifications.js`
- `backend/models/CreditBalance.js`
- `backend/models/CreditTransaction.js`
- `backend/models/NotificationTemplate.js`
- `backend/models/NotificationLog.js`
- `backend/models/NotificationSetting.js`
- `backend/models/OTP.js` (for OTP login)
- `backend/routes/otp.js`
- `backend/controllers/otpController.js`

### Missing functionality

- Real API endpoints for credits and notifications
- Secure provider API key storage and settings
- Actual `Add Credits`, `Buy Credits`, `Export` actions
- Notification send flow (`POST /api/notifications/send`)
- Logs and filters for notification delivery
- OTP generation and verification
- Real-time admin notification bell support
- Search, filter, and pagination behaviors

## 3. What you need to do next

### Step 1: Install dependencies

Open terminal in `ecommerce-alfanar-fresh/backend` and install backend dependencies if not already installed:

```bash
cd c:\Users\admin\OneDrive\Desktop\noor-ecommerce\ecommerce-alfanar-fresh\backend
npm install
```

If you need frontend dependencies as well, then run:

```bash
cd c:\Users\admin\OneDrive\Desktop\noor-ecommerce\ecommerce-alfanar-fresh\nextjs
npm install
```

### Step 2: Create a `.env` file for backend

In `ecommerce-alfanar-fresh/backend`, create a `.env` file with at least:

```env
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
CLOUDINARY_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=<your-jwt-secret>
```

Add provider keys when you implement each service:

```env
RESEND_API_KEY=<resend-api-key>
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
MSG91_API_KEY=<msg91-api-key>
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_CLIENT_EMAIL=<firebase-client-email>
FIREBASE_PRIVATE_KEY=<firebase-private-key>
META_WHATSAPP_TOKEN=<meta-whatsapp-token>
```

### Step 3: Create service provider accounts (optional now, required later)

These accounts are optional if you are building a proof of concept, but required for production send/send-credit functionality.

- Cloudinary: for image uploads, already configured in `backend/server.js`
- Resend: email provider
- Twilio or MSG91: SMS provider
- Firebase Cloud Messaging: push notifications
- Meta Cloud API: WhatsApp
- MongoDB Atlas: database hosting if you do not have local MongoDB
- Razorpay: payment provider if you want credit purchase and UPI support

### Step 4: Add backend models and controllers

Add the new backend files under `backend/models`, `backend/controllers`, and `backend/routes`.

#### Example backend files to add

- `backend/models/CreditBalance.js`
- `backend/models/CreditTransaction.js`
- `backend/models/NotificationTemplate.js`
- `backend/models/NotificationLog.js`
- `backend/models/NotificationSetting.js`
- `backend/controllers/creditController.js`
- `backend/controllers/notificationController.js`
- `backend/controllers/otpController.js`
- `backend/routes/credits.js`
- `backend/routes/notifications.js`
- `backend/routes/otp.js`

### Step 5: Register new routes in `backend/server.js`

After adding `credits.js`, `notifications.js`, and `otp.js`, add these routes to `server.js`:

```js
import creditRoutes from './routes/credits.js';
import notificationRoutes from './routes/notifications.js';
import otpRoutes from './routes/otp.js';

app.use('/api/credits', creditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes); // OTP routes can also live here if you prefer
```

### Step 6: Implement API endpoints

Add the following endpoints:

- `GET /api/credits`
- `POST /api/credits/add`
- `GET /api/credits/history`
- `GET /api/notifications`
- `GET /api/notifications/logs`
- `POST /api/notifications/send`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`

### Step 7: Connect the frontend UI to the new APIs

In `nextjs/src/components/admin/Credits.jsx` and `nextjs/src/components/admin/Notifications.jsx`:

- Load data from the backend endpoints using `axios`
- Send credit-add requests to `POST /api/credits/add`
- Send notifications via `POST /api/notifications/send`
- Render the result data from `GET /api/credits` and `GET /api/notifications/logs`
- Add loading states, error messages, and success messages

## 4. Do you need any external service accounts?

Yes, for production features you will need provider accounts.

### Required if you want live messaging

- Resend account for email
- Twilio or MSG91 account for SMS
- Firebase account for push notifications
- Meta Cloud account for WhatsApp
- Cloudinary account for media storage
- Razorpay account if you want online credit purchase and UPI payments

### Required for database

- MongoDB Atlas or local MongoDB installation

### Required for backend real-time notifications

- Socket.IO can run locally without an account
- But browser push and WhatsApp need provider credentials

## 5. Do you need to pay for these services?

- Resend: paid service, generally metered by email volume
- Twilio: paid, charges by SMS message
- MSG91: paid for SMS messages
- Firebase Cloud Messaging: free for basic push notifications
- Meta WhatsApp API: paid/usage-based
- Cloudinary: free tier exists, paid for production usage
- Razorpay: payment gateway fees apply if you accept UPI or cards

If you only test locally, you can build without paying by using mock data and fake API calls.

## 6. Is UPI supported?

Yes, UPI is supported through Razorpay if you implement Razorpay checkout or server-side order creation. The repo already includes `razorpay` dependency in both backend and frontend packages.

However, the current admin credit module does not yet include a Razorpay credit purchase flow.

## 7. How to add or purchase credits

This repo does not yet have a working `Buy Credits` integration.

To enable it, follow these steps:

1. Add a `CreditTransaction` model and `creditController.addCredits` endpoint.
2. Add a frontend button in `Credits.jsx` that calls the backend endpoint.
3. If you want purchase flow, create a Razorpay order in backend and return the order details.
4. Use Razorpay checkout in the frontend to complete payment.

## 8. How to check available balance

- Add `GET /api/credits` on the backend to return current totals
- In `Credits.jsx`, fetch that endpoint and display:
  - `Current Balance`
  - `Email Credits`
  - `SMS Credits`
  - `Push Credits`
  - `WhatsApp Credits`
  - `Monthly Usage`

## 9. Required configuration before the feature becomes active

### Add environment variables

For local dev, add these to `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yourdb
JWT_SECRET=secret123
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
MSG91_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
META_WHATSAPP_TOKEN=...
```

### Install provider SDKs if needed

If you add these features, install the appropriate SDKs in the backend:

```bash
npm install resend twilio firebase-admin @google-cloud/firestore socket.io
```

You may also want `zod` for validation:

```bash
npm install zod
```

## 10. How to verify setup

### Backend verification

1. Start the backend:

```bash
cd ecommerce-alfanar-fresh/backend
npm run dev
```

2. Confirm the server starts and connects to MongoDB.
3. Verify health check:

```bash
curl http://localhost:5000/api/health
```

### Frontend verification

1. Start the frontend:

```bash
cd ecommerce-alfanar-fresh/nextjs
npm run dev
```

2. Open `http://localhost:3000`
3. Navigate to the admin dashboard and check that the `Credits` and `Notifications` menu items appear.

### API verification after implementation

Use a tool like Postman or browser `curl`:

- `GET http://localhost:5000/api/credits`
- `POST http://localhost:5000/api/credits/add`
- `GET http://localhost:5000/api/credits/history`
- `GET http://localhost:5000/api/notifications`
- `GET http://localhost:5000/api/notifications/logs`
- `POST http://localhost:5000/api/notifications/send`

If these endpoints return valid JSON and the frontend can fetch them, the feature is wired correctly.

## 11. Helpful checklist

- [ ] Install backend and frontend dependencies
- [ ] Create `backend/.env` with MongoDB, Cloudinary, JWT, and provider keys
- [ ] Create credit and notification backend models/controllers/routes
- [ ] Register new backend routes in `backend/server.js`
- [ ] Connect `Credits.jsx` to credit API endpoints
- [ ] Connect `Notifications.jsx` to notification API endpoints
- [ ] Add provider account credentials when live sending is needed
- [ ] Test frontend pages and API responses locally

## 12. If you want a simple first milestone

Start with this minimal implementation:

1. Add a `CreditBalance` model in the backend
2. Add `GET /api/credits`
3. Fetch and display credit balances in `Credits.jsx`

That will prove the feature infrastructure is working before building the full send/receive flows.

---

## Summary

The current repo has the admin UI placeholders, but you still need to implement backend APIs, wire frontend actions, and add service provider keys.

If you want, I can next generate the exact backend and frontend code files required for `Credits` and `Notifications` from scratch.







all file me jaga jaaha skeleton lage hue he woh dark mode me  white arahe he jo nahi ane chiye na skeleton me sare page me dark mode me chages kar ke do 

profile page me ## My Profile
Update your personal information and select your profile avatar. You can change your avatar anytime! 
ye text dark arahe he 

![Profile 2](https://www.alfanar.store/profile.jpg)

### Babariya Roshan
babariyaroshan123@gmail.com

+918799484056

Profile: Profile 2

Change Avatar

### Privacy & Support
Manage your account settings and access helpful resources.

[Privacy Policy](https://www.alfanar.store/privacy-policy)[Help & Support](https://www.alfanar.store/profile#)

### Personal Information
Full Name
Phone
House Number
Street Address
City
Pincode

Update Profilecard jitne bane hue he sab me bg white araha he 
orders
me bhii card ka bg white arehe 
footer me upper ki side border top 1pxsolid kar ke do wite taki footer mix na ho 