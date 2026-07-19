# AEK E-Commerce Project Documentation

## 1. Project Overview

This repository contains a full-stack e-commerce application for AL-FANAR with:

- A customer-facing storefront built with Next.js
- A Node.js/Express backend API
- MongoDB as the database
- Redis for caching
- Cloudinary for image storage
- An admin dashboard for managing products, orders, users, FAQs, coupons, banners, and permissions

This project is designed to support:

- User registration and login
- Product browsing and categories
- Cart and wishlist behavior
- Checkout and order placement
- Admin moderation and management
- Order tracking and customer history
- Currency and payment configuration

---

## 2. Project Purpose

The application is built to provide a complete online shopping experience with an operational admin panel. The frontend handles customer-facing pages, while the backend handles data, authentication, business logic, and admin operations.

The system is not just a simple shop; it has:

- Multi-role access for admin and co-admin
- RBAC (Role-Based Access Control) permissions
- Product management with stock and pricing variants
- Order management with statuses and request handling
- Analytics and reporting
- Content management such as FAQs and banners

---

## 3. Technology Stack

### Frontend
- Next.js 16
- React 19
- Axios for API calls
- Bootstrap for styling support
- Zustand for state management
- React Toastify for notifications
- Recharts for analytics visuals
- i18next for localization support

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Redis for caching
- Cloudinary for image uploads
- Multer for file handling

### Infrastructure / Services
- MongoDB Atlas or local MongoDB
- Redis server
- Cloudinary account for media storage
- Local frontend on port 3000
- Local backend on port 5000

---

## 4. Repository Structure

```text
ecommerce-app/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── uploads/
│   ├── utils/
│   ├── package.json
│   ├── server.js
│   └── .env
│
├── nextjs/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── store/
│   │   └── styles/
│   ├── package.json
│   └── next.config.ts
│
├── PRODUCTLIST-CHANGES.md
├── ProductList-updates.txt
└── AEK-e-commerce.md
```

---

## 5. Main Application Flow

### Customer Flow
1. User visits the storefront.
2. Frontend loads products from the backend API.
3. User can browse categories, view product details, and add items to cart.
4. During checkout, order data is sent to the backend.
5. Backend creates an order in MongoDB.
6. Admin can later review and update the order.

### Admin Flow
1. Admin logs into the admin panel.
2. Admin dashboard loads stats from the backend.
3. Admin can manage products, orders, users, FAQs, coupons, and settings.
4. Sensitive actions are protected by JWT and permission checks.

---

## 6. Backend Architecture

The backend is powered by Express and is initialized from [backend/server.js](backend/server.js).

### What happens in server startup
- Loads environment variables
- Enables CORS for allowed frontend origins
- Configures Cloudinary for image upload
- Connects to MongoDB
- Initializes Redis
- Mounts all route modules
- Starts the HTTP server on port 5000

### Core responsibilities of the backend
- Authentication and authorization
- Product CRUD operations
- Order creation and management
- Admin and co-admin permissions
- Analytics and reporting
- Caching with Redis
- Media storage via Cloudinary

---

## 7. Backend Folder Explanation

### backend/server.js
This is the main entry file.

It handles:
- Express app creation
- Middleware setup
- CORS configuration
- Cloudinary upload configuration
- MongoDB connection
- Redis initialization
- Route mounting
- Health check endpoint

### backend/routes/
All API endpoints are organized here.

Important route files:

- [backend/routes/auth.js](backend/routes/auth.js)
  - User registration/login
  - Admin login
  - Profile retrieval
  - Password reset flow
  - Admin user listing

- [backend/routes/products.js](backend/routes/products.js)
  - Fetch products
  - Category listing
  - Single product view
  - Product update and admin change handling
  - Currency-aware price formatting
  - Caching logic

- [backend/routes/orders.js](backend/routes/orders.js)
  - Create and fetch user orders
  - Admin order listing
  - Order status updates
  - Return/replacement request handling
  - Admin analytics

- [backend/routes/payment.js](backend/routes/payment.js)
  - Payment route placeholders
  - Recently configured as disabled placeholders until Razorpay is fully wired

- [backend/routes/settings.js](backend/routes/settings.js)
  - Currency settings
  - Banner settings
  - Payment methods
  - Co-admin permissions and management

- [backend/routes/faqs.js](backend/routes/faqs.js)
  - FAQ listing and management

- [backend/routes/productFaqs.js](backend/routes/productFaqs.js)
  - Product-specific FAQ management

- [backend/routes/reviews.js](backend/routes/reviews.js)
  - Review management

- [backend/routes/coupons.js](backend/routes/coupons.js)
  - Coupon creation and management

### backend/controllers/
Controllers contain the business logic for each route module.

Examples:
- [backend/controllers/authController.js](backend/controllers/authController.js)
  - Registration
  - Login
  - Admin login
  - Password reset logic
  - Profile update

- [backend/controllers/orderController.js](backend/controllers/orderController.js)
  - Order creation logic
  - Analytics computation
  - Revenue and order summary calculations

- [backend/controllers/productController.js](backend/controllers/productController.js)
  - Product-related logic

- [backend/controllers/settingsController.js](backend/controllers/settingsController.js)
  - Settings and permissions business logic

### backend/models/
These files define the MongoDB schemas.

Important models:
- [backend/models/User.js](backend/models/User.js)
  - Stores user details, password hash, role, permissions, address, and profile information

- [backend/models/Product.js](backend/models/Product.js)
  - Stores product details, images, colors, sizes, pricing, stock, and flags like isFeatured and isNewArrival

- [backend/models/Order.js](backend/models/Order.js)
  - Stores order information, items, shipping address, payment details, payment status, order status, and tracking data

- [backend/models/FAQ.js](backend/models/FAQ.js)
  - Stores FAQ content

- [backend/models/Coupon.js](backend/models/Coupon.js)
  - Stores coupon codes and discounts

- [backend/models/Settings.js](backend/models/Settings.js)
  - Stores system settings

### backend/middleware/
- [backend/middleware/auth.js](backend/middleware/auth.js)
  - JWT validation
  - Admin/co-admin detection
  - Permission-based authorization

### backend/utils/
Helper modules used across the app:
- [backend/utils/permissions.js](backend/utils/permissions.js)
  - Central source of all permission keys and metadata

- [backend/utils/cacheService.js](backend/utils/cacheService.js)
  - Redis-based caching helpers for products, settings, FAQs, users, and orders

- [backend/utils/redisClient.js](backend/utils/redisClient.js)
  - Redis connection and cache utilities

- [backend/utils/currency.js](backend/utils/currency.js)
  - Currency conversion and display logic

- [backend/utils/historyService.js](backend/utils/historyService.js)
  - Admin change history logging

---

## 8. Authentication and Authorization Logic

### JWT-based authentication
The backend uses JWT for login sessions.

A user/admin logs in, receives a token, and sends it in the Authorization header for protected routes.

### Role handling
The middleware checks whether the logged-in user is:
- a normal user
- an admin
- a co-admin

### Permission model
The project uses a permission-based RBAC structure.

Examples of permissions:
- manage_products
- manage_orders
- manage_users
- view_analytics
- manage_faqs
- manage_coupons
- manage_settings

Admins automatically bypass permission restrictions. Co-admins can access only permissions assigned to them.

---

## 9. Product Management Logic

Products are stored in MongoDB using the Product model.

### What product data includes
- name
- description
- price and original price
- multiple currencies via prices map
- images
- colors
- sizes
- stock per variant
- category
- flags such as new arrival, featured, kids product

### How products are served
The backend route fetches products and applies currency conversion based on settings.

This means a product may be displayed in the correct currency based on the current store settings, not just a fixed hardcoded currency.

### Product caching
Product data is cached with Redis to reduce DB load and speed up repeated requests.

---

## 10. Order Flow Logic

Orders are an important part of the app.

### Order creation flow
1. User adds items to cart.
2. Checkout begins.
3. Frontend sends order data to the backend.
4. Backend creates an Order document with:
   - userId
   - items
   - shipping address
   - payment method
   - total amount
   - order status
   - payment status

### Order statuses
The order model supports statuses such as:
- pending
- confirmed
- processing
- shipped
- out-for-delivery
- delivered
- cancelled
- returned
- refunded

### Payment statuses
The app uses payment statuses such as:
- pending
- paid

### Admin order management
Admin can view all orders and update statuses. The request handling also supports return/replacement workflows.

---

## 11. Frontend Architecture

The frontend is powered by Next.js and is located in [nextjs](nextjs).

### Main app structure
The root app router is in [nextjs/src/app](nextjs/src/app).

Important route groups:
- /login
- /register
- /products
- /product/[id]
- /cart
- /checkout
- /orders
- /profile
- /wishlist
- /admin

### Main frontend entry points
- [nextjs/src/app/layout.tsx](nextjs/src/app/layout.tsx)
  - Global app layout
  - Loads global fonts and global CSS
  - Wraps app with ClientWrapper

- [nextjs/src/app/page.tsx](nextjs/src/app/page.tsx)
  - Home page entry

- [nextjs/src/app/admin/page.tsx](nextjs/src/app/admin/page.tsx)
  - Admin page entry
  - Checks if adminToken exists
  - Shows Login or Dashboard

### Main frontend component folders
- [nextjs/src/components](nextjs/src/components)
  - Reusable UI component files for the storefront and admin panel

- [nextjs/src/components/admin](nextjs/src/components/admin)
  - All admin components such as Dashboard, OrderList, ProductList, UserList, Analytics, FAQManagement, Coupon management, etc.

### Frontend state management
State is handled with Zustand in [nextjs/src/store](nextjs/src/store).

Important stores:
- [nextjs/src/store/productStore.js](nextjs/src/store/productStore.js)
- [nextjs/src/store/cartStore.js](nextjs/src/store/cartStore.js)
- [nextjs/src/store/authStore.js](nextjs/src/store/authStore.js)
- [nextjs/src/store/favoritesStore.js](nextjs/src/store/favoritesStore.js)

These stores help manage app-wide data like products, cart, favorites, and auth state.

---

## 12. Admin Panel Architecture

The admin panel is a major part of the project and is controlled by [nextjs/src/components/admin/Dashboard.jsx](nextjs/src/components/admin/Dashboard.jsx).

### Admin dashboard features
- Sidebar navigation with role-based sections
- Dashboard stats
- Orders management
- Product management
- User management
- Analytics
- FAQ management
- Reviews management
- Banner and currency configuration
- Coupon management
- Permission management
- Co-admin management

### Permission-based menu rendering
The dashboard checks the logged-in role and assigned permissions before showing specific menu items.

This is controlled in the dashboard component and the backend permission middleware.

### Admin UI modules
- [nextjs/src/components/admin/OrderList.jsx](nextjs/src/components/admin/OrderList.jsx)
  - Displays all orders and allows status changes

- [nextjs/src/components/admin/ProductList.jsx](nextjs/src/components/admin/ProductList.jsx)
  - Displays products and allows modifications

- [nextjs/src/components/admin/AddProduct.jsx](nextjs/src/components/admin/AddProduct.jsx)
  - Handles new product creation

- [nextjs/src/components/admin/UserList.jsx](nextjs/src/components/admin/UserList.jsx)
  - Lists users and shows derived information like total orders and location

- [nextjs/src/components/admin/UserOrderHistory.jsx](nextjs/src/components/admin/UserOrderHistory.jsx)
  - Shows a customer’s order history and order details

- [nextjs/src/components/admin/Analytics.jsx](nextjs/src/components/admin/Analytics.jsx)
  - Shows analytics and sales information

- [nextjs/src/components/admin/FAQManagement.jsx](nextjs/src/components/admin/FAQManagement.jsx)
  - Manages help/FAQ content

- [nextjs/src/components/admin/Coupons.jsx](nextjs/src/components/admin/Coupons.jsx)
  - Coupon creation and management

---

## 13. Important Frontend Logic Details

### Admin token storage
The admin panel uses localStorage to store the admin token.

Example:
- adminToken is saved after login
- It is read on page load to decide whether to show the dashboard or login page

### API base URL
The frontend uses:
- NEXT_PUBLIC_API_URL

This points to the backend API and is essential for communication between Next.js and Express.

### Client-side rendering
The admin page uses dynamic imports to avoid SSR issues and to load the admin-only UI safely in the browser.

---

## 14. Caching Strategy

The backend uses Redis for caching common data.

### Cached data includes
- Product lists
- Single product details
- User orders
- Settings
- FAQs
- User profiles

### Why caching is used
Caching reduces repeated database queries and improves performance for frequently requested content.

### Cache behavior
If cached data exists, the API can return it quickly without hitting MongoDB every time.

---

## 15. Image and Media Handling

The backend uses Cloudinary for uploaded images.

### How it works
- Frontend uploads an image file
- Backend processes it with multer + cloudinary storage
- Cloudinary stores it in the cloud
- Backend returns a public URL
- The frontend uses that URL for product images or banners

This is implemented in [backend/server.js](backend/server.js).

---

## 16. Environment Variables

### Backend environment variables
The backend expects values such as:
- PORT
- MONGODB_URI
- API_URL
- FRONTEND_URL
- JWT_SECRET
- ALLOWED_ORIGINS
- REDIS_URL or Redis host/port values
- Cloudinary credentials

A sample template is available at [backend/.env.example](backend/.env.example).

### Frontend environment variables
The frontend expects:
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_FRONTEND_URL

A local example is available at [nextjs/.env.local](nextjs/.env.local).

---

## 17. Local Development Setup

### 1. Backend setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend setup
```bash
cd nextjs
npm install
npm run dev
```

### 3. Make sure services are running
- MongoDB should be reachable
- Redis should be reachable
- Cloudinary credentials should be configured

---

## 18. How the App Works in Simple Terms

### Frontend
The frontend shows pages and sends requests to the backend.

### Backend
The backend receives requests, validates them, talks to MongoDB, and returns JSON responses.

### Admin panel
The admin panel uses the same backend API but with extra permission checks and management UI.

### Database
MongoDB stores all core business data like users, products, orders, settings, FAQs, coupons, and reviews.

### Cache
Redis speeds up repeated reads and reduces load on the database.

### Media storage
Cloudinary stores images and returns URLs for use in the storefront and admin panel.

---

## 19. Key Implementation Notes

- The project uses a clean separation between backend routes, controllers, models, and utilities.
- Admin features are modular and component-based.
- Permissions are handled through middleware and stored on the user record for co-admins.
- Product pricing is currency-aware and not hardcoded to one currency.
- Orders and users are closely connected, and the admin user history page relies on existing order data from the API.
- The project uses a mix of server-side logic and frontend rendering for a modern e-commerce experience.

---

## 20. Important Files to Know

### Backend
- [backend/server.js](backend/server.js)
- [backend/routes/auth.js](backend/routes/auth.js)
- [backend/routes/products.js](backend/routes/products.js)
- [backend/routes/orders.js](backend/routes/orders.js)
- [backend/routes/settings.js](backend/routes/settings.js)
- [backend/middleware/auth.js](backend/middleware/auth.js)
- [backend/models/User.js](backend/models/User.js)
- [backend/models/Product.js](backend/models/Product.js)
- [backend/models/Order.js](backend/models/Order.js)

### Frontend
- [nextjs/src/app/layout.tsx](nextjs/src/app/layout.tsx)
- [nextjs/src/app/admin/page.tsx](nextjs/src/app/admin/page.tsx)
- [nextjs/src/components/admin/Dashboard.jsx](nextjs/src/components/admin/Dashboard.jsx)
- [nextjs/src/components/admin/UserList.jsx](nextjs/src/components/admin/UserList.jsx)
- [nextjs/src/components/admin/UserOrderHistory.jsx](nextjs/src/components/admin/UserOrderHistory.jsx)
- [nextjs/src/store/productStore.js](nextjs/src/store/productStore.js)

---

## 21. Summary

This repository is a complete e-commerce web application with:

- Frontend customer experience
- Backend API services
- MongoDB data storage
- Redis-based caching
- Cloudinary image management
- Admin dashboard and management tools
- Role-based permissions for admin/co-admin users

In short, the project is structured like a professional full-stack e-commerce platform where the frontend, backend, database, and admin tools all work together to deliver a complete shopping and management experience.
