# NexaERP — Mini ERP + CRM Operations Portal

A modern, full-stack Mini ERP and CRM Operations Portal built with React, Node.js, Express, TypeScript, and Tailwind CSS.

---

## 🛠 Tech Stack

### Frontend (`/client`)
- **Framework**: React 18+
- **Language**: TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS

### Backend (`/server`)
- **Platform**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM / Database**: Prisma + PostgreSQL (configured for future steps)

---

## 📁 Project Structure

```
nexa-erp-crm/
│
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # Layout wrappers (Sidebar, Navbar, etc.)
│   │   ├── pages/           # Page views
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client and backend services
│   │   ├── routes/          # Application routing setup
│   │   ├── types/           # Shared TypeScript interfaces & types
│   │   ├── utils/           # Helper functions and formatters
│   │   ├── App.tsx          # Main application component
│   │   ├── main.tsx         # React entry point
│   │   └── index.css        # Global CSS with Tailwind directives
│   ├── public/              # Static assets
│   ├── .env.example         # Client environment example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/          # Environment & app configuration
│   │   ├── controllers/     # Route controller logic
│   │   ├── middleware/      # Express middlewares (auth, error handling, etc.)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services
│   │   ├── validators/      # Request validation schemas
│   │   ├── types/           # Backend TypeScript types
│   │   ├── utils/           # Utility functions (logger, response helpers)
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server listener entry point
│   ├── prisma/
│   │   └── schema.prisma    # Prisma schema definition
│   ├── .env.example         # Server environment example
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                    # System architecture and documentation
├── postman/                 # API collections
├── .gitignore
├── .env.example
├── README.md
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** / **pnpm**

### 2. Environment Setup
Copy the environment template files:
```bash
# Root
cp .env.example .env

# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env
```

### 3. Installation

Install dependencies for both client and server:
```bash
# Install all at once
npm run install:all

# Or individually:
cd client && npm install
cd ../server && npm install
```

### 4. Running the Application

#### Start Backend Server:
```bash
# From workspace root
npm run dev:server

# Or from /server directory:
cd server
npm run dev
```
The server will start at `http://localhost:5000`. Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

#### Start Frontend Client:
```bash
# From workspace root
npm run dev:client

# Or from /client directory:
cd client
npm run dev
```
The client will start at `http://localhost:5173`.

---

## 📡 API Endpoints (Initial)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and status verification |

---

## 📄 License
ISC
