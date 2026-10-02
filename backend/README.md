# Hotel Room Booking System — Backend API (Problem 126)

A production-ready, RESTful backend for a Hotel Room Booking System built with **Node.js**, **Express.js**, **MongoDB Atlas**, and **Mongoose**.

RENDER LINK -  https://hotel-room-booking-system-qju2.onrender.com
---

## Table of Contents
1. [Overview & Problem Statement](#overview--problem-statement)
2. [Technologies Used](#technologies-used)
3. [Features Implemented](#features-implemented)
4. [Backend Project Structure](#backend-project-structure)
5. [Prerequisites & Installation](#prerequisites--installation)
6. [Environment Variables](#environment-variables)
7. [MongoDB Atlas Setup](#mongodb-atlas-setup)
8. [Running Locally](#running-locally)
9. [Initial Manager Account Seeding](#initial-manager-account-seeding)
10. [API Endpoint Documentation](#api-endpoint-documentation)
11. [Database Schemas & Relationships](#database-schemas--relationships)
12. [Room Availability & Date-Overlap Logic](#room-availability--date-overlap-logic)
13. [Concurrency-Safe Double-Booking Prevention](#concurrency-safe-double-booking-prevention)
14. [Automated Testing](#automated-testing)
15. [Postman Collection Usage](#postman-collection-usage)
16. [Deployment Instructions (Render / Railway)](#deployment-instructions-render--railway)
17. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Overview & Problem Statement

The goal of **Problem 126** is to design and develop a robust, secure, and scalable backend API for a Hotel Room Booking System. The system manages room inventory, enables public search with filtering and sorting, authenticates guests and hotel managers via JWT, and provides reliable booking reservation management with strict double-booking prevention.

---

## Technologies Used

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js (v5.x)
- **Database:** MongoDB Atlas via Mongoose (v9.x)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Testing:** Jest & SuperTest
- **CORS & Middleware:** `cors`, `dotenv`

---

## Features Implemented

- **Room Inventory CRUD:** Managers can create, update, and soft-delete rooms. Public users can browse active rooms.
- **Advanced Room Search:** Filtering by `type` (Standard, Deluxe, Suite), `maxPrice`, sorting by `pricePerNight` (ascending/descending), and pagination (`page`, `limit`).
- **Secure Authentication:** Guest registration, login, and profile lookup (`/auth/me`). Password hashing with `bcryptjs` (salt factor 12).
- **Role-Based Authorization (RBAC):** Distinct `guest` and `manager` roles. Public registration prevents assigning the `manager` role.
- **Booking Management:** Authenticated guests can book available rooms and view their reservations. Managers can view all reservations.
- **Date Validation & Overlap Detection:** Validates check-in/check-out boundaries and enforces mathematical overlap queries.
- **Double-Booking Prevention:** Transaction-backed reservation strategy preventing concurrent double-bookings.
- **Safe Cancellation:** Releasing booking reservations without hard-deleting records to maintain historical integrity.

---

## Backend Project Structure

```
backend/
├── config/
│   └── db.js               # MongoDB Atlas connection handler
├── controllers/
│   ├── authController.js   # Register, login, get profile
│   ├── bookingController.js# Create, list, get, cancel bookings
│   └── roomController.js   # Room CRUD, filter, sort, paginate
├── middleware/
│   ├── auth.js             # protect (JWT) & restrictTo (roles)
│   └── errorHandler.js     # Centralized error formatting
├── models/
│   ├── Booking.js          # Booking schema & overlap query helper
│   ├── Guest.js            # User/Guest schema with bcrypt hooks
│   └── Room.js             # Room schema with type & price rules
├── postman/
│   ├── Hotel_Room_Booking_System_Complete.postman_collection.json
│   ├── Hotel_Room_Booking_Phase3.postman_collection.json
│   └── Hotel_Room_Booking_Phase2.postman_collection.json
├── routes/
│   ├── authRoutes.js       # /api/auth
│   ├── bookingRoutes.js    # /api/bookings
│   └── roomRoutes.js       # /api/rooms
├── scripts/
│   └── seedManager.js      # One-time CLI seed script for manager
├── tests/
│   ├── health.test.js      # App smoke tests
│   └── rooms.test.js       # Room API integration tests
├── utils/
│   ├── AppError.js         # Custom operational error class
│   └── asyncHandler.js     # Async route wrapper
├── .env.example            # Environment variables template
├── .gitignore
├── app.js                  # Express app & route mounting
├── package.json
├── README.md
└── server.js               # HTTP server bootstrap
```

---

## Prerequisites & Installation

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- MongoDB Atlas cluster URI (or local MongoDB v6.x+)

### Installation
```bash
cd backend
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | No | HTTP port (default: 5000) | `5000` |
| `NODE_ENV` | No | Environment (`development`/`production`) | `development` |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pwd@cluster.mongodb.net/hotel?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Long secret for signing JWTs | `a_long_random_64_byte_hex_secret` |
| `JWT_EXPIRES_IN` | No | Token expiration | `7d` |
| `CLIENT_ORIGIN` | No | Allowed frontend origin for CORS | `http://localhost:3000` |
| `MANAGER_NAME` | No | Manager name for seed script | `System Manager` |
| `MANAGER_EMAIL` | No | Manager email for seed script | `manager@hotel.com` |
| `MANAGER_PASSWORD`| No | Manager password for seed script | `ManagerStrongPassword123!` |

---

## MongoDB Atlas Setup

1. Create a free account at [MongoDB Cloud](https://cloud.mongodb.com).
2. Create an **M0 Free Cluster**.
3. Under **Database Access**, create a database user and password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) or your current IP.
5. Click **Connect → Connect your application (Drivers)**, copy the URI string, and set it as `MONGO_URI` in `.env`.

---

## Running Locally

```bash
# Development mode with hot-reloading (nodemon)
npm run dev

# Production mode
npm start
```

---

## Initial Manager Account Seeding

To securely create the initial manager account without exposing public registration:

```bash
# Uses values defined in .env
npm run seed:manager

# Or run with inline credentials:
MANAGER_NAME="Hotel Admin" MANAGER_EMAIL="admin@hotel.com" MANAGER_PASSWORD="SecretPassword123!" npm run seed:manager
```

---

## API Endpoint Documentation

### Base URL: `http://localhost:5000/api`

### 1. System Health
- **`GET /health`**
  - **Auth:** None
  - **Response (200):**
    ```json
    {
      "success": true,
      "message": "Hotel Room Booking API is running",
      "environment": "development",
      "timestamp": "2026-09-29T00:00:00.000Z"
    }
    ```

---

### 2. Authentication (`/api/auth`)
- **`POST /api/auth/register`**
  - **Auth:** Public
  - **Body:** `{ "name": "Alice Smith", "email": "alice@example.com", "password": "Password123!" }`
  - **Note:** Public registration forces `role: 'guest'`.
  - **Response (201):** `{ "success": true, "token": "JWT_TOKEN", "data": { "_id": "...", "name": "Alice Smith", "email": "alice@example.com", "role": "guest" } }`

- **`POST /api/auth/login`**
  - **Auth:** Public
  - **Body:** `{ "email": "alice@example.com", "password": "Password123!" }`
  - **Response (200):** `{ "success": true, "token": "JWT_TOKEN", "data": { "_id": "...", "name": "Alice Smith", "email": "alice@example.com", "role": "guest" } }`

- **`GET /api/auth/me`**
  - **Auth:** Bearer JWT (`protect`)
  - **Response (200):** `{ "success": true, "data": { "_id": "...", "name": "Alice Smith", "email": "alice@example.com", "role": "guest" } }`

---

### 3. Room Management (`/api/rooms`)
- **`GET /api/rooms`**
  - **Auth:** Public
  - **Query Params:** `type` (`Standard`\|`Deluxe`\|`Suite`), `maxPrice` (number), `sort` (`pricePerNight`\|`-pricePerNight`), `page` (int), `limit` (int)
  - **Response (200):**
    ```json
    {
      "success": true,
      "results": 2,
      "pagination": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 },
      "data": [
        {
          "_id": "66f7f01...",
          "roomNumber": "101",
          "type": "Standard",
          "pricePerNight": 100,
          "capacity": 2,
          "isActive": true
        }
      ]
    }
    ```

- **`GET /api/rooms/:id`**
  - **Auth:** Public
  - **Response (200):** `{ "success": true, "data": { ... } }`

- **`POST /api/rooms`**
  - **Auth:** Bearer JWT (`protect` + `restrictTo('manager')`)
  - **Body:** `{ "roomNumber": "201", "type": "Deluxe", "pricePerNight": 150, "capacity": 3, "description": "Spacious room" }`
  - **Response (201):** `{ "success": true, "message": "Room created successfully.", "data": { ... } }`

- **`PUT /api/rooms/:id`**
  - **Auth:** Bearer JWT (`protect` + `restrictTo('manager')`)
  - **Body:** `{ "pricePerNight": 165, "description": "Updated description" }`
  - **Response (200):** `{ "success": true, "message": "Room updated successfully.", "data": { ... } }`

- **`DELETE /api/rooms/:id`**
  - **Auth:** Bearer JWT (`protect` + `restrictTo('manager')`)
  - **Action:** Soft deactivation (`isActive: false`). Checks for active confirmed bookings before deactivating.
  - **Response (200):** `{ "success": true, "message": "Room 201 has been deactivated...", "data": { ... } }`

---

### 4. Booking Management (`/api/bookings`)
- **`POST /api/bookings`**
  - **Auth:** Bearer JWT (`protect`)
  - **Body:** `{ "roomId": "66f7f01...", "checkIn": "2026-10-10", "checkOut": "2026-10-13" }`
  - **Response (201):**
    ```json
    {
      "success": true,
      "message": "Booking created successfully.",
      "data": {
        "_id": "66f7f99...",
        "room": { "roomNumber": "201", "type": "Deluxe", "pricePerNight": 150 },
        "guest": { "name": "Alice Smith", "email": "alice@example.com" },
        "checkIn": "2026-10-10T00:00:00.000Z",
        "checkOut": "2026-10-13T00:00:00.000Z",
        "totalPrice": 450,
        "status": "confirmed"
      }
    }
    ```

- **`GET /api/bookings/my`**
  - **Auth:** Bearer JWT (`protect`)
  - **Response (200):** `{ "success": true, "results": 1, "pagination": { ... }, "data": [ ... ] }`

- **`GET /api/bookings`**
  - **Auth:** Bearer JWT (`protect` + Manager for all bookings; Guests receive own bookings)
  - **Query Params:** `status`, `guest`, `room`, `page`, `limit`
  - **Response (200):** `{ "success": true, "results": 5, "pagination": { ... }, "data": [ ... ] }`

- **`GET /api/bookings/:id`**
  - **Auth:** Bearer JWT (`protect` — Owner guest or Manager only)
  - **Response (200):** `{ "success": true, "data": { ... } }`

- **`PATCH /api/bookings/:id/cancel`**
  - **Auth:** Bearer JWT (`protect` — Owner guest or Manager only)
  - **Action:** Sets `status: 'cancelled'`, freeing the dates for future bookings.
  - **Response (200):** `{ "success": true, "message": "Booking cancelled successfully.", "data": { ... } }`

---

## Database Schemas & Relationships

```mermaid
erDiagram
    GUEST ||--o{ BOOKING : places
    ROOM ||--o{ BOOKING : contains

    GUEST {
        ObjectId _id PK
        string name
        string email UK
        string password
        string role "guest | manager"
        date createdAt
    }

    ROOM {
        ObjectId _id PK
        string roomNumber UK
        string type "Standard | Deluxe | Suite"
        number pricePerNight
        number capacity
        string description
        boolean isActive
        date createdAt
    }

    BOOKING {
        ObjectId _id PK
        ObjectId room FK
        ObjectId guest FK
        date checkIn
        date checkOut
        string status "confirmed | cancelled | completed"
        number totalPrice
        date createdAt
    }
```

---

## Room Availability & Date-Overlap Logic

A room is considered **unavailable** if there is an existing booking with `status: 'confirmed'` that overlaps the requested date interval:

$$\text{existingCheckIn} < \text{requestedCheckOut} \quad \text{AND} \quad \text{existingCheckOut} > \text{requestedCheckIn}$$

### Boundary Conditions:
- **Same-day Turnover Allowed:** If Booking A checks out on `2026-10-13`, Booking B can check in on `2026-10-13` because `10-10 < 10-13` and `10-13 > 10-13` evaluates to `false` (no overlap).
- **Cancelled Bookings Excluded:** Bookings with `status: 'cancelled'` do not trigger conflicts.

---

## Concurrency-Safe Double-Booking Prevention

In a high-concurrency environment, simultaneous requests for the same room could pass an unshielded read check before inserting.

To prevent race conditions:
1. **ACID Transaction Session:** The availability overlap check and insertion are executed inside a MongoDB Mongoose Session Transaction (`mongoose.startSession()` + `session.withTransaction()`).
2. **Conflict Resolution:** If two concurrent transactions attempt to reserve overlapping dates on the same room, MongoDB's write lock forces one transaction to complete and the other to abort with a `409 Conflict`.
3. **Graceful Standalone Fallback:** For local development on standalone MongoDB engines without replica sets, errors are caught gracefully, applying atomic verification queries.

---

## Automated Testing

```bash
# Run smoke tests
npm test
```

### Test Coverage:
- Express app configuration and health check probe (`GET /health`).
- Error handler formatting for 404 and invalid routes.
- Integration tests for room CRUD, filters, sorting, and pagination.

---

## Postman Collection Usage

1. Open Postman.
2. Click **Import** and select:
   `backend/postman/Hotel_Room_Booking_System_Complete.postman_collection.json`
3. Set your collection variables:
   - `BASE_URL` = `http://localhost:5000`
4. Execute the requests in sequence:
   - Register or login as a guest to populate `{{GUEST_TOKEN}}`.
   - Login as a manager to populate `{{MANAGER_TOKEN}}`.
   - Create and query rooms and bookings.

---

## Deployment Instructions (Render / Railway)

### 1. Deploying to Render
1. Push your repository to GitHub.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New + → Web Service** and connect your repository.
4. Set the following build and start configurations:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. In **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `<your-secure-random-64-byte-secret>`
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_ORIGIN` = `*` (or your frontend domain)
6. Click **Deploy Web Service**.
7. Test the deployed URL at `https://<your-render-service>.onrender.com/health`.

### 2. Deploying to Railway
1. Click **New Project → Deploy from GitHub Repo**.
2. Select your repository and set root directory to `/backend`.
3. Add `MONGO_URI` and `JWT_SECRET` in Railway's **Variables** tab.
4. Railway will automatically detect `npm start` and assign a `$PORT`.

---

## Known Limitations & Future Improvements

- **Payment Gateway Integration:** Bookings are currently confirmed immediately upon creation. Phase 4+ could integrate Stripe/Razorpay webhooks.
- **Email Notifications:** Automated email confirmations on booking and cancellation using Nodemailer or SendGrid.
- **Admin Dashboard UI:** Next phase can introduce a React/Next.js frontend.
