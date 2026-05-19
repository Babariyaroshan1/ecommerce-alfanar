# Noor E-Commerce Platform

A complete e-commerce solution with frontend, backend API, and admin panel.

## Project Structure

```
ecommerce-app/
├── frontend/          # React frontend application
├── backend/           # Node.js Express backend API
└── admin-panel/       # React admin dashboard
```

## Frontend

The customer-facing e-commerce application built with React.

### Features
- Product browsing and search
- Shopping cart management
- Checkout and payment
- Order tracking
- User authentication
- Profile management

### Installation

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Key Components
- **Navbar** - Navigation component
- **ProductCard** - Product display component
- **Cart** - Shopping cart management
- **Checkout** - Payment and order placement
- **OrderTracking** - Track order status
- **Profile** - User profile management
- **Login** - Authentication component
- **PrivacyPolicy** - Privacy policy page

## Backend

RESTful API built with Express.js and MongoDB.

### Features
- User authentication and authorization
- Product management
- Order processing
- Payment handling
- User profile management

### Installation

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:5000`

### Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

#### Payment
- `POST /api/payment/process` - Process payment
- `POST /api/payment/validate` - Validate payment
- `GET /api/payment/status/:transactionId` - Get payment status

## Admin Panel

Administrative dashboard for managing products, orders, and users.

### Features
- Dashboard with statistics
- Order management
- Product management
- Add new products
- Inventory tracking

### Installation

```bash
cd admin-panel
npm install
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### Pages
- **Dashboard** - Overview of key metrics and recent orders
- **Orders** - Manage and track customer orders
- **Products** - View and manage product catalog
- **Add Product** - Add new products to inventory

## Database Models

### User
- name
- email
- password
- phone
- address
- avatar
- timestamps

### Product
- name
- description
- price
- category
- image
- stock
- rating
- reviews

### Order
- userId
- items
- shippingAddress
- totalAmount
- status
- paymentMethod
- paymentStatus
- timestamps

## Environment Variables

Create a `.env` file in the backend directory:

```
MONGODB_URI=mongodb://localhost:27017/ecommerce
PORT=5000
JWT_SECRET=your-secret-key
```

## Technologies Used

### Frontend
- React
- Vite
- React Router
- CSS3

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

### Admin Panel
- React
- Vite
- CSS3

## Getting Started

1. Clone the repository
2. Install dependencies for each folder (frontend, backend, admin-panel)
3. Configure environment variables
4. Start the backend server
5. Start the frontend development server
6. Start the admin panel development server

## License

MIT







 DEPLOYMENT GUIDE
Step 1: Setup MongoDB
Go to https://www.mongodb.com/cloud/atlas
Create free cluster
Copy connection string to .env
Step 2: Setup Razorpay
Go to https://razorpay.com
Create account
Get API keys from dashboard
Add to .env
Step 3: Deploy Backend
bash

Copy code
# Option 1: Render.com
git push heroku main

# Option 2: Railway.app
npm install -g railway
railway login
railway up

Step 4: Deploy Frontend
bash

Copy code
cd frontend
npm run build
# Deploy to Vercel

Step 5: Set API environment variables
Use `nextjs/.env.local` for local development and set `NEXT_PUBLIC_API_URL` in Vercel environment variables for production. Do not edit API URLs directly inside frontend files.

✅ QUICK START
bash

Copy code
# Backend
cd backend
npm install
node server.js

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Admin Panel (new terminal)
cd admin-panel
npm install
npm run dev

📝 Test Products
javascript
Run Code

Copy code
{
  "name": "Laptop",
  "description": "High performance laptop",
  "price": 45000,
  "originalPrice": 60000,
  "discount": 25,
  "image": "https://via.placeholder.com/300",
  "category": "Electronics",
  "stock": 10
}


🔐 Admin Login
Default admin email: admin@example.com
Create admin via MongoDB direct update: isAdmin: true