# MiniLedger — Money Lending Tracker

MiniLedger is a simple full-stack mobile application for tracking money lent to friends. It lets users log in using a mock OTP, record loans, monitor due dates, and mark loans as repaid.

This project was built as an internship assignment using React Native, Expo, Node.js, TypeScript, Express, and PostgreSQL.

---

## Features

- **Phone number login**: Six-digit mock OTP printed in the backend terminal.
- **Add loans**: Record a friend's name, loan amount, and repayment due date.
- **Loan dashboard**: View all loan entries and their repayment status.
- **Portfolio summary**: See total lent, total repaid, outstanding amount, and overdue amount.
- **Overdue highlighting**: Identify unpaid loans whose due dates have passed.
- **Repayment tracking**: Mark an unpaid loan as repaid.
- **Calendar date picker**: Select the due date using a date picker.
- **Input validation**: Validate phone numbers, loan amounts, names, and dates.
- **Persistent storage**: Store users and loans in PostgreSQL.
- **Authentication**: Protect loan APIs using JWT authentication.

---

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- `pg` PostgreSQL client
- JWT authentication

### Testing
- Jest
- Supertest
- `pg-mem` for in-memory database tests

---

## Project Structure

```text
MiniLedger/
├── backend/
│   ├── scripts/
│   │   └── initDb.ts
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── schema.sql
│   ├── .env.example
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── screens/
│   │   └── theme/
│   ├── App.tsx
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

Install the following software before running the project:

- [Node.js](https://nodejs.org/) — LTS version recommended.
- [PostgreSQL](https://www.postgresql.org/download/windows/) — database server.
- [Git](https://git-scm.com/downloads) — for version control.
- [Expo Go](https://expo.dev/go) or Android Studio with an Android emulator, if running on Android.
- A desktop browser can be used to run the Expo web version.

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/MiniLedger.git
cd MiniLedger
```
Replace `YOUR_USERNAME` with the GitHub username of the repository owner.

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
Copy `backend/.env.example` to `backend/.env`.

On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

Configure the following variables using your local PostgreSQL credentials:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
```
Replace `YOUR_PASSWORD` with your PostgreSQL password. Use a private random secret for `JWT_SECRET`.

> **Important:** Never commit `backend/.env` to GitHub. The example file should contain placeholders only.

### 4. Create the PostgreSQL database
1. Start PostgreSQL and open pgAdmin 4.
2. Connect to your PostgreSQL server.
3. Right-click **Databases**.
4. Select **Create** → **Database**.
5. Name the database `miniledger`.
6. Save the database.

### 5. Initialize the database schema
From the `backend` directory, run:
```bash
npm run db:init
```
This command executes the project's `schema.sql` initialization script and creates the required database tables.

### 6. Start the backend server
From the `backend` directory:
```bash
npm run dev
```
The backend runs on port 5000 by default.

Verify the server by opening:
[http://localhost:5000/api/health](http://localhost:5000/api/health)

A successful response should indicate that the MiniLedger API is running.

Keep the backend terminal open while using the app.

### 7. Install mobile dependencies
Open a second terminal:
```powershell
cd D:\prachi\intershala_assignment\mobile
npm install
```
When setting up from a cloned repository, use the equivalent path to your local project directory.

### 8. Configure the mobile API URL
The mobile app must be able to reach the backend.

- For the web browser:
  `http://localhost:5000/api`
- For the standard Android emulator:
  `http://10.0.2.2:5000/api`
- For a physical Android phone using Expo Go:
  `http://YOUR_COMPUTER_IP:5000/api`

To find your computer's local IP address on Windows, run:
```powershell
ipconfig
```
Use the IPv4 address of the network adapter connected to the same Wi-Fi as your phone. Ensure Windows Firewall allows the backend connection.

Set the correct URL in the existing mobile API configuration file, `mobile/src/api/config.ts`. Do not expose credentials in the mobile app.

### 9. Start the mobile app
For the web browser:
```bash
npx expo start --web
```

For Expo Go or an Android emulator:
```bash
npx expo start
```
Scan the QR code with Expo Go, or press `a` to open the app in a configured Android emulator.

---

## How to Use MiniLedger

1. Enter a valid 10-digit Indian mobile number.
2. Select **Send OTP**.
3. Read the generated six-digit OTP in the backend terminal.
4. Enter the OTP and select **Verify OTP**.
5. View the portfolio summary and loan list.
6. Select **Add Loan**.
7. Enter the friend's name and amount, then select a due date using the calendar.
8. Save the loan and verify that it appears on the dashboard.
9. Select **Mark as Repaid** to update an unpaid loan.
10. Log out when finished.

> **Note:** The mock OTP is for development and demonstration only. No SMS is sent. Do not use this authentication flow in a production application without appropriate security measures.

---

## API Endpoints

All endpoints use the `/api` prefix.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check API health |
| `POST` | `/api/auth/send-otp` | Request a mock OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP and receive a JWT |
| `GET` | `/api/loans` | Retrieve the authenticated user's loans |
| `POST` | `/api/loans` | Create a loan entry |
| `PATCH` | `/api/loans/:id/repay` | Mark a loan as repaid |
| `GET` | `/api/summary` | Retrieve portfolio totals |

Loan and summary endpoints require a valid JWT bearer token.

### Example: Request an OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{ "phone": "9876543210" }
```
The OTP is printed in the backend terminal.

### Example: Create a loan
```http
POST /api/loans
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{ "friendName": "Rahul", "amount": 1500, "dueDate": "2026-11-06" }
```
Use the exact field names and request format implemented by the backend.

---

## Summary Fields

The summary endpoint returns the following metrics:
- `totalLent`: Sum of all recorded loan amounts.
- `totalRepaid`: Sum of loan amounts marked as repaid.
- `outstandingAmount`: Sum of unpaid loan amounts.
- `overdueAmount`: Sum of unpaid loans past their due dates.

---

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Build the backend TypeScript code:
```bash
npm run build
```

Check mobile TypeScript:
```bash
cd mobile
npx tsc --noEmit
```

Optional: verify the Expo web bundle:
```bash
npx expo export -p web
```

These commands check different parts of the project. A successful build does not replace testing the app against a running PostgreSQL database.

---

## Demo Recording Checklist

Before recording:
1. Start PostgreSQL.
2. Start the backend server.
3. Start the Expo app.
4. Log in with a test phone number.
5. Add a loan and show the updated summary.
6. Demonstrate an overdue entry if available.
7. Mark a loan as repaid and show the updated totals.
8. Show logout and the login screen.

Keep personal phone numbers, credentials, and database secrets out of the recording.

---

## Limitations

- OTP delivery is mocked; no SMS provider is integrated.
- The app requires a configured PostgreSQL database.
- The project is intended for development and internship demonstration, not production financial recordkeeping.

---

## Author

Developed as an internship assignment.  
GitHub: https://github.com/prachiraut711/MiniLedger
