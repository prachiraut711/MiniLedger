# MiniLedger 💰

MiniLedger is a simple, lightweight money tracking application for recording loans given to friends. Built as a clean full-stack mobile application, it helps you keep track of who owes you money, how much has been repaid, and what is currently overdue.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. PostgreSQL Database Setup](#2-postgresql-database-setup)
  - [3. Mobile App Setup](#3-mobile-app-setup)
- [Configuring the API URL](#-configuring-the-api-url)
  - [Android Emulator](#android-emulator)
  - [Physical Android Device (Expo Go)](#physical-android-device-expo-go)
  - [In-App URL Switcher](#in-app-url-switcher)
- [How to Use the Mock OTP Flow](#-how-to-use-the-mock-otp-flow)
- [API Documentation](#-api-documentation)
- [Running Tests](#-running-tests)
- [Demo Walkthrough Checklist](#-demo-walkthrough-checklist)
- [Troubleshooting Common Issues](#-troubleshooting-common-issues)

---

## ✨ Features

- **Phone Number Authentication with Mock OTP**:
  - Secure login using phone number and mock 6-digit one-time password (OTP).
  - OTP is printed directly in the backend terminal console.
  - JWT token generation stored locally in `AsyncStorage`.
- **Portfolio Summary**:
  - **Total Lent**: Sum of all loans given out.
  - **Total Repaid**: Sum of all loans marked as repaid.
  - **Outstanding Amount**: Total amount pending repayment.
  - **Overdue Amount**: Highlighted in red, representing unpaid loans whose due date is in the past.
- **Loan Records Management**:
  - View all loans ordered by repayment status and due date.
  - Overdue unpaid loans clearly highlighted with light red cards and red badges.
  - Repaid loans marked with green badges.
  - One-tap "Mark as Repaid" action button.
  - Pull-to-refresh on loans list.
- **Add Loan**:
  - Simple entry for friend's name, loan amount, and due date.
  - Quick-preset chips for due dates (*Tomorrow*, *In 1 Week*, *In 1 Month*, *In 3 Months*).
  - Client-side and server-side validation.
- **Data Isolation & Security**:
  - Every loan is strictly associated with the authenticated user ID.
  - Users cannot access, view, or modify loans belonging to other users.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+) & **TypeScript**
- **Express.js**: REST API server
- **PostgreSQL**: Relational database with SQL schema
- **pg**: PostgreSQL client library with parameterized queries
- **jsonwebtoken (JWT)**: Stateless token authentication
- **dotenv**: Environment variable management
- **Jest**, **ts-jest**, **Supertest**, **pg-mem**: Automated unit and integration testing

### Mobile App
- **React Native** & **Expo** (SDK 52)
- **TypeScript**
- **React Navigation** (Native Stack Navigator)
- **AsyncStorage**: Persistent local storage for JWT tokens and API endpoint settings
- Built-in React Native components & `StyleSheet`

---

## 📂 Project Structure

```text
intershala_assignment/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts             # PostgreSQL connection pool and query helpers
│   │   ├── controllers/
│   │   │   ├── authController.ts # Phone OTP generation & JWT verification
│   │   │   ├── loanController.ts # Loan CRUD & repayment logic
│   │   │   └── summaryController.ts # Portfolio aggregation queries
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts # JWT Bearer token authentication
│   │   ├── routes/
│   │   │   ├── authRoutes.ts     # /api/auth routes
│   │   │   ├── loanRoutes.ts     # /api/loans routes
│   │   │   └── summaryRoutes.ts  # /api/summary routes
│   │   ├── services/
│   │   │   └── otpStore.ts       # In-memory OTP store with TTL expiration
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── app.ts                # Express application setup & error handling
│   │   └── server.ts             # HTTP server entry point
│   ├── tests/                    # Automated Jest test suites
│   ├── scripts/
│   │   └── initDb.ts             # Database schema initialization script
│   ├── schema.sql                # PostgreSQL table definitions and indexes
│   ├── .env.example              # Sample environment configuration
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts         # API fetch wrapper with token injection
│   │   │   └── config.ts         # Dynamic API endpoint configuration
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # React Auth Context & session management
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx   # Phone & OTP verification screen
│   │   │   ├── MainScreen.tsx    # Dashboard with summary & loans list
│   │   │   └── AddLoanScreen.tsx # New loan entry form
│   │   ├── theme/
│   │   │   └── colors.ts         # Color palette & styling constants
│   │   └── types/
│   │       └── index.ts          # Mobile TypeScript definitions
│   ├── App.tsx                   # Root navigation container
│   ├── app.json                  # Expo app configuration
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js** (v18.0 or higher): [https://nodejs.org/](https://nodejs.org/)
2. **PostgreSQL** (v14 or higher): [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
3. **Expo Go** app on your physical Android phone (from Google Play Store), OR an **Android Studio Emulator**.

---

## 🚀 Step-by-Step Installation & Setup

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
npm install
```

Create your `.env` configuration file:

```bash
cp .env.example .env
```

Your `backend/.env` file should look like this:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/miniledger
JWT_SECRET=miniledger_dev_secret_key_12345
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=5
```

> **Note**: Update the username, password, host, and port in `DATABASE_URL` to match your local PostgreSQL configuration.

---

### 2. PostgreSQL Database Setup

1. Open your PostgreSQL terminal (`psql`) or a GUI tool like pgAdmin / DBeaver:

```sql
CREATE DATABASE miniledger;
```

2. Run the automated database initialization script from the `backend/` directory:

```bash
npm run db:init
```

This runs `backend/scripts/initDb.ts` which executes `backend/schema.sql` and creates:
- `users` table: stores user phone numbers and registration dates.
- `loans` table: stores loan amounts, friend names, due dates, repayment status, and foreign key to `users`.
- Indexes on `user_id`, `due_date`, and `is_repaid`.

3. Start the backend development server:

```bash
npm run dev
```

You will see:
```text
============================================================
🚀 MiniLedger Backend Server is running on port 5000
📡 Local API URL:    http://localhost:5000/api
📡 Emulator API URL: http://10.0.2.2:5000/api
============================================================
✅ PostgreSQL Database connected successfully!
```

---

### 3. Mobile App Setup

Open a second terminal window and navigate to the `mobile` folder:

```bash
cd mobile
npm install
```

Start the Expo development server:

```bash
npx expo start
```

---

## 📱 Configuring the API URL

Mobile devices cannot access your computer's backend via `localhost`. Use the appropriate host address:

### Android Emulator
- The Android Emulator routes network traffic to the host machine through `10.0.2.2`.
- MiniLedger defaults to `http://10.0.2.2:5000/api` on Android automatically!

### Physical Android Device (Expo Go)
- Ensure your phone and development computer are connected to the **same Wi-Fi network**.
- Find your computer's local IP address:
  - **Windows (PowerShell)**: `ipconfig` (look for *IPv4 Address* under Wi-Fi, e.g. `10.46.182.243`)
  - **macOS / Linux**: `ifconfig` or `ip a`
- Set the API URL to: `http://<YOUR_COMPUTER_IP>:5000/api` (e.g. `http://10.46.182.243:5000/api`).

### In-App URL Switcher
On the **Login Screen**, tap **"⚙️ API Base URL"** at the bottom to expand the configuration panel:
- Tap **"Use Wi-Fi IP"** to immediately switch to your computer's local network IP.
- Tap **"Emulator Default"** to reset to `10.0.2.2:5000/api`.
- Or type any custom URL and tap **"Save"**.

---

## 🔑 How to Use the Mock OTP Flow

MiniLedger uses an in-memory mock OTP flow designed for quick local evaluation without requiring third-party SMS providers:

1. On the mobile app Login screen, enter your phone number (e.g., `9876543210`) and press **"Send OTP"**.
2. Switch to your **backend terminal window**. You will see:
   ```text
   ============================================================
    [MiniLedger MOCK OTP SERVICE]
    Phone:    9876543210
    Mock OTP: 681429
    Expiry:   5 minutes
    Enter this 6-digit code in the mobile app.
   ============================================================
   ```
3. Enter the 6-digit code (`681429`) in the mobile app and tap **"Verify & Continue"**.
4. You are authenticated and navigated directly to your MiniLedger dashboard!

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api`

### 1. Authentication

#### Send Mock OTP
- **Endpoint**: `POST /api/auth/send-otp`
- **Body**:
  ```json
  { "phone": "9876543210" }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Mock OTP sent successfully. Please check your backend terminal console for the OTP code.",
    "phone": "9876543210"
  }
  ```

#### Verify OTP & Login
- **Endpoint**: `POST /api/auth/verify-otp`
- **Body**:
  ```json
  { "phone": "9876543210", "otp": "681429" }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "user": {
      "id": 1,
      "phone": "9876543210",
      "createdAt": "2026-10-23T05:00:00.000Z"
    }
  }
  ```

---

### 2. Portfolio Summary

- **Endpoint**: `GET /api/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "totalLent": 4500,
    "totalRepaid": 1500,
    "overdueAmount": 1000,
    "outstandingAmount": 3000
  }
  ```

---

### 3. Loan Entries

#### Create Loan
- **Endpoint**: `POST /api/loans`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "friendName": "Rohan Sharma",
    "amount": 2500,
    "dueDate": "2026-11-15"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "loan": {
      "id": 1,
      "userId": 1,
      "friendName": "Rohan Sharma",
      "amount": 2500,
      "dueDate": "2026-11-15",
      "isRepaid": false,
      "createdAt": "2026-10-23T05:05:00.000Z"
    }
  }
  ```

#### List User's Loans
- **Endpoint**: `GET /api/loans`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "loans": [
      {
        "id": 1,
        "userId": 1,
        "friendName": "Rohan Sharma",
        "amount": 2500,
        "dueDate": "2026-11-15",
        "isRepaid": false,
        "createdAt": "2026-10-23T05:05:00.000Z"
      }
    ]
  }
  ```

#### Mark Loan as Repaid
- **Endpoint**: `PATCH /api/loans/:id/repay`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Loan successfully marked as repaid",
    "loan": {
      "id": 1,
      "userId": 1,
      "friendName": "Rohan Sharma",
      "amount": 2500,
      "dueDate": "2026-11-15",
      "isRepaid": true,
      "createdAt": "2026-10-23T05:05:00.000Z"
    }
  }
  ```

---

## 🧪 Running Tests

The backend includes automated unit and integration tests powered by Jest and `pg-mem` (an in-memory PostgreSQL emulator) so tests run without depending on external services.

Run the test suite from the `backend/` directory:

```bash
cd backend
npm test
```

Test coverage includes:
- **Authentication**: Input validation, mock OTP generation, verification, and replay protection.
- **Loan CRUD**: Validation (positive amounts, required fields), creation, list retrieval.
- **User Isolation**: Verifies User A cannot access or modify User B's loans.
- **Summary Calculations**: Verifies correct mathematical aggregations for Total Lent, Total Repaid, Outstanding, and Overdue amounts.
- **Database Availability**: Verifies that when PostgreSQL is unreachable, the API returns a friendly `503 Service Unavailable` response.

---

## 🎥 Demo Walkthrough Checklist

Use this checklist when recording a demo video:

1. **Backend Startup**:
   - Start backend terminal: `npm run dev`
   - Notice the server running on port 5000.
2. **Mobile Startup**:
   - Start Expo terminal: `npx expo start`
   - Open Expo Go on your phone or Android Emulator.
3. **Authentication**:
   - Enter your phone number (e.g. `9876543210`) and press **Send OTP**.
   - Show the 6-digit OTP printed in the backend terminal.
   - Enter the OTP in the app and press **Verify & Continue**.
4. **Empty State & Dashboard**:
   - Show empty portfolio summary card (`₹0` across all metrics).
   - Show the friendly empty state message.
5. **Add Loans**:
   - Tap **"+ Add Loan"**.
   - Add Loan 1: Friend: `Aman`, Amount: `2000`, Due Date: Select **In 1 Week**.
   - Tap **"+ Add Loan"** again.
   - Add Loan 2 (Overdue): Friend: `Kunal`, Amount: `1500`, Due Date: Enter past date (e.g. `2026-01-01`).
6. **Inspect Dashboard Highlights**:
   - Note the **Overdue Amount** card is highlighted in red with Kunal's overdue loan.
   - Note Kunal's card has a red **⚠️ Overdue** badge.
   - Note Aman's card has an amber **⏳ Pending** badge.
7. **Repay a Loan**:
   - Tap **"Mark as Repaid"** on Kunal's loan and confirm.
   - Notice Kunal's status changes to green **✓ Repaid**.
   - Notice the **Total Repaid** updates and **Overdue Amount** drops to `₹0`.
8. **Log Out**:
   - Tap **"Log Out"** in the top bar to return to the sign-in screen.

---

## 🔧 Troubleshooting Common Issues

### 1. "Unable to reach backend at http://..."
- **Android Emulator**: Verify that the API URL is set to `http://10.0.2.2:5000/api` (not `localhost`).
- **Physical Phone**: Verify that both your phone and PC are on the same Wi-Fi network, and that Windows Defender / Firewall allows incoming connections on port 5000.
- Use the in-app API URL config on the Login Screen to test and verify the IP address.

### 2. "Database is unavailable" (HTTP 503)
- Ensure PostgreSQL is installed and running on your system (`psql -U postgres`).
- Verify that the database `miniledger` exists (`CREATE DATABASE miniledger;`).
- Check that `DATABASE_URL` in `backend/.env` contains the correct username and password.
- Run `npm run db:init` in `backend/` to ensure tables are created.

### 3. "Invalid or expired OTP"
- The mock OTP expires after 5 minutes.
- Check the backend terminal for the latest OTP code.
- If needed, tap "← Change Phone Number" to request a fresh OTP.
