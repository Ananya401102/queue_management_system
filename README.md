# Queue Management System

A full-stack web application designed to simplify queue handling and customer management. Managers can create queues, generate customer tokens, manage service order, and monitor queue activity through a dashboard.

## Features

- Manager registration and login
- Secure password hashing and JWT authentication
- Create and manage multiple queues
- Generate customer tokens
- View waiting tokens and their positions
- Move waiting tokens up or down
- Call the next customer for service
- Complete or cancel tokens
- Dashboard analytics:
  - Total tokens
  - Waiting, serving, completed and cancelled tokens
  - Current queue length
  - Average waiting time
  - Daily token creation trends
- Manager-specific queue access

## Tech Stack

**Frontend**
- React.js
- Vite
- HTML
- CSS
- JavaScript
- Recharts

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- SQLite
- better-sqlite3

**Authentication**
- JSON Web Tokens (JWT)
- bcryptjs

## Project Structure

```text
queue_management_system/
├── backend/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── .env
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/queue-management-system.git
cd queue-management-system
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
JWT_SECRET=your_secure_secret_key
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm install recharts
npm run dev
```

Open the frontend URL displayed in your terminal, usually:

`http://localhost:5173`

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register manager |
| POST | `/api/auth/login` | Manager login |
| GET | `/api/queues` | Get manager's queues |
| POST | `/api/queues` | Create a queue |
| GET | `/api/tokens/queue/:queueId` | Get queue tokens |
| POST | `/api/tokens/queue/:queueId` | Generate token |
| POST | `/api/tokens/queue/:queueId/call-next` | Call next customer |
| PATCH | `/api/tokens/:tokenId/move` | Change token position |
| PATCH | `/api/tokens/:tokenId/complete` | Complete token |
| PATCH | `/api/tokens/:tokenId/cancel` | Cancel token |
| GET | `/api/analytics/queue/:queueId` | Get queue analytics |

Protected endpoints require a valid JWT in the Authorization header:

`Authorization: Bearer YOUR_TOKEN`

## Security

- Passwords are hashed before storage.
- Protected API routes require JWT authentication.
- Managers can only access their own queues and tokens.
- Environment variables and database files are excluded from Git.

## Future Improvements

- Customer-facing token status page
- Live queue updates
- Email or SMS notifications
- More detailed analytics

## Author

Developed as a full-stack Queue Management System project.
