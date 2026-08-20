# Study Group Finder

A full-stack MERN (MongoDB + Express + React + Node.js) application that helps students discover, create, and manage study groups. The app features an elegant purple/blue pastel UI, real MongoDB Atlas persistence, JWT authentication, and atomic operations for preventing duplicate group memberships.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Key Features](#key-features)
4. [Project Structure](#project-structure)
5. [Environment Variables](#environment-variables)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [Build for Production](#build-for-production)
9. [API Endpoints](#api-endpoints)
10. [Database Models](#database-models)
11. [Duplicate & Race-Condition Prevention](#duplicate--race-condition-prevention)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

Study Group Finder enables students to:

- Sign up / log in with email & password (JWT based auth, bcrypt password hashing)
- Browse and search all available study groups by **name, subject, or description** (real MongoDB regex queries)
- Create new study groups with schedule, max members, location, and description
- Edit / delete groups you created
- Join / leave groups (atomic protection against duplicate joins and full-group overflows)
- View a real-time dashboard with stats computed from MongoDB (groups created, groups joined, available, upcoming)
- Manage profile, update personal details, view activity
- Responsive, modern UI with loading states, success/error toasts, and proper empty states

All data (groups, users, memberships, stats) is persisted in **MongoDB Atlas** — there is no mock, hardcoded, sample, or localStorage-cached application data. LocalStorage is used only for the JWT token and basic authenticated user info.

---

## Tech Stack

| Layer        | Technology                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| **Frontend** | React 18, React Router v6, Vite 5, Tailwind CSS, Axios, lucide-react icons |
| **Backend**  | Node.js, Express 4, Mongoose 8, JWT (jsonwebtoken), bcryptjs, CORS        |
| **Database** | MongoDB Atlas (cloud-hosted replica-set cluster)                           |

---

## Key Features

### Authentication
- Signup with unique email validation (409 Conflict if duplicate)
- Login returns a signed JWT token
- Protected routes on both frontend (`ProtectedRoute`) and backend (`authMiddleware`)
- Passwords hashed with bcryptjs (10 rounds)

### Study Groups
- Full CRUD (Create / Read / Update / Delete) via REST API
- Filter & sort (newest, oldest, popular, upcoming) on Explore page
- Debounced search (350 ms) across `groupName`, `subject`, `description`
- Max members limit enforced on both backend (atomic) and UI

### Memberships
- Atomic join (MongoDB `findOneAndUpdate` with compound filter + `$addToSet`) — prevents duplicate joins even on double-click
- Creator cannot leave their own group
- Max-members check inside the atomic query (no race-condition window)

### Stats (Real, Not Hardcoded)
- Dashboard: Groups Created, Groups Joined, Available Groups, Upcoming Sessions
- Home page stats strip: Active Students, Study Groups, Universities, Success Rate (from real counts)
- All numbers computed from MongoDB on every request

### UI / UX
- Beautiful purple / indigo / soft pastel theme
- Responsive (mobile, tablet, desktop)
- Loading spinners on all API calls
- Per-button loading / disabled state during processing
- `react-hot-toast` success & error notifications
- Proper empty states: "No study groups available yet.", "You haven't joined any groups yet.", etc.

---

## Project Structure

```
group/
├── backend/                       # Node.js / Express API
│   ├── config/
│   │   └── db.js                  # Mongoose connection to MongoDB Atlas
│   ├── controllers/
│   │   ├── authController.js      # signup / login
│   │   ├── groupController.js     # group CRUD + join/leave + stats
│   │   └── userController.js      # profile update, get user by id
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification (protect middleware)
│   ├── models/
│   │   ├── User.js                # User schema (unique email, bcrypt hash)
│   │   └── StudyGroup.js          # Group schema + members array + indexing
│   ├── routes/
│   │   ├── authRoutes.js          # /api/signup, /api/login
│   │   ├── groupRoutes.js         # /api/groups/*  (including /public-stats, /dashboard-stats)
│   │   └── userRoutes.js          # /api/users/*
│   ├── scripts/
│   │   └── seed.js                # Optional: seed database (npm run seed)
│   ├── .env                       # MongoDB URI + JWT secret + PORT
│   ├── package.json
│   └── server.js                  # Express entrypoint (port 5000)
│
├── src/                           # React frontend
│   ├── components/                # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── DashboardTopbar.jsx
│   │   ├── GroupCard.jsx
│   │   ├── StatCard.jsx
│   │   ├── EmptyState.jsx
│   │   ├── SearchBar.jsx
│   │   ├── InputField.jsx
│   │   ├── Button.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx        # JWT token + user state (signup/login/logout/updateUser)
│   ├── pages/
│   │   ├── Home.jsx               # Landing page (hero, features, stats, testimonials)
│   │   ├── Signup.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx          # User dashboard + real DB stats
│   │   ├── ExploreGroups.jsx      # Search / browse / join groups
│   │   ├── MyGroups.jsx           # Manage created & joined groups
│   │   ├── GroupDetails.jsx       # Single group view / edit / members
│   │   ├── CreateGroup.jsx
│   │   ├── EditGroup.jsx
│   │   └── Profile.jsx
│   ├── services/
│   │   └── api.js                 # Axios instance + auth/user/group API wrappers
│   ├── App.jsx                    # React Router routes
│   ├── main.jsx
│   └── index.css                  # Tailwind directives + global CSS
│
├── index.html                     # Vite HTML entry
├── vite.config.js                 # Vite dev server (port 3000) + /api → localhost:5000 proxy
├── tailwind.config.js             # Custom theme (purple/blue pastel palette)
├── postcss.config.js
└── package.json
```

---

## Environment Variables

The backend requires a `backend/.env` file with the following variables. The project is pre-configured with real MongoDB Atlas credentials — if you need to change them, edit `backend/.env`.

```
# Backend (backend/.env)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.qesbnze.mongodb.net/?appName=Cluster0
JWT_SECRET=study_group_finder_secret_key_2024
PORT=5000
NODE_ENV=development
```

- **MONGODB_URI** — MongoDB Atlas connection string (database name is set in `config/db.js` → `study_group_finder`)
- **JWT_SECRET** — Secret used to sign/verify JWT tokens
- **PORT** — Backend server port (default 5000)

The frontend (Vite) uses `/api/*` requests which are **proxied** to `http://localhost:5000` by Vite — no separate `.env` is required for the frontend.

---

## Installation & Setup

### Prerequisites
- Node.js ≥ 18 (with npm)
- A MongoDB Atlas account (or use the included connection string which is already set up)
- Internet connection (to reach MongoDB Atlas cloud cluster)

### 1. Install Backend Dependencies

```powershell
cd backend
npm.cmd install
```

### 2. Install Frontend Dependencies

```powershell
cd ..
npm.cmd install
```

You need to run `npm install` in **both** directories (`group/` and `group/backend/`).

### 3. (Optional) Seed Sample Data

To populate the database with demo groups and a demo user:

```powershell
cd backend
npm.cmd run seed
```

The seed script is in `backend/scripts/seed.js`. Run this only if you want sample data pre-loaded; the app works perfectly with an empty database and will show proper empty states.

---

## Running the Application

The application requires **two terminals** (one for backend, one for frontend).

### Option A — Step by Step (Recommended for Development)

**Terminal 1 — Start the Backend (Port 5000):**
```powershell
cd backend
npm.cmd run dev
```

You should see:
```
Server running in development mode on port 5000
API health check: http://localhost:5000/api/health
MongoDB connected: <your-atlas-host>
Database: study_group_finder
```

Verify backend health by visiting `http://localhost:5000/api/health` in a browser.

**Terminal 2 — Start the Frontend (Port 3000):**
```powershell
cd ..
npm.cmd run dev
```

Vite will print the local URL. Open `http://localhost:3000` in your browser.

### Option B — Quick PowerShell Commands (Windows)

```powershell
# Start backend in background (first terminal)
cd "c:\Users\SRUTHI\Documents\trae_projects\group\backend"
npm.cmd run dev

# Start frontend in background (second terminal)
cd "c:\Users\SRUTHI\Documents\trae_projects\group"
npm.cmd run dev
```

### NPM Scripts Reference

**Frontend (root `package.json`):**
| Script            | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start Vite dev server on **port 3000** (hot reload)  |
| `npm run build`   | Production build to `dist/` folder                   |
| `npm run preview` | Preview production build locally                     |
| `npm run lint`    | Run ESLint                                           |

**Backend (`backend/package.json`):**
| Script            | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Start server with **nodemon** on **port 5000** (watch mode) |
| `npm start`       | Start production server with plain `node server.js`         |
| `npm run seed`    | (Optional) Insert sample data into MongoDB Atlas            |

---

## Build for Production

### Frontend Production Build

```powershell
cd <project-root>
npm.cmd run build
```

The build outputs go into the `dist/` directory. You can serve the static files from any static host (Vercel, Netlify, Nginx, S3, etc.).

Preview the production build locally:

```powershell
npm.cmd run preview
```

### Backend Production Run

```powershell
cd backend
set NODE_ENV=production
npm start
```

---

## API Endpoints

All API routes live under `http://localhost:5000/api`. The frontend Vite dev server proxies `/api/*` → `http://localhost:5000/api`.

### Authentication (Public)

| Method | Endpoint        | Body (`JSON`)                       | Description              |
| ------ | --------------- | ----------------------------------- | ------------------------ |
| POST   | `/signup`       | `{ fullName, email, password }`     | Create a new user (409 if email exists) |
| POST   | `/login`        | `{ email, password }`               | Returns `{ token, user }` |

### Users (Protected — Bearer token required)

| Method | Endpoint          | Description                       |
| ------ | ----------------- | --------------------------------- |
| GET    | `/users/me`       | Fetch current user profile        |
| PUT    | `/users/me`       | Update profile (`fullName`, `email`, `bio`, `university`, `major`, `year`, `avatar`) |
| GET    | `/users/:id`      | Get another user's public profile |

### Study Groups

| Method | Endpoint                        | Auth   | Description                                                          |
| ------ | ------------------------------- | ------ | -------------------------------------------------------------------- |
| GET    | `/groups/public-stats`          | Public | `{ totalGroups, totalUsers }` (for home page stats strip)            |
| GET    | `/groups/dashboard-stats`       | JWT    | `{ groupsCreated, groupsJoined, availableGroups, upcomingSessions }` |
| GET    | `/groups`                       | JWT    | List all active groups (query params: `search`, `sort`, `subject`)   |
| POST   | `/groups`                       | JWT    | Create a new group (409 if duplicate groupName+subject+creator+date+time exists) |
| GET    | `/groups/:id`                   | JWT    | Get one group with populated members and creator details             |
| PUT    | `/groups/:id`                   | JWT    | Update group (creator only)                                          |
| DELETE | `/groups/:id`                   | JWT    | Delete group (creator only)                                          |
| POST   | `/groups/:id/join`              | JWT    | Atomic join — 409 if already a member, 400 if group is full          |
| POST   | `/groups/:id/leave`             | JWT    | Remove self from members (creator cannot leave)                      |

---

## Database Models

### `users` collection (model: [User.js](backend/models/User.js))

```javascript
{
  fullName:   String (required),
  email:      String (required, unique, lowercase),
  password:   String (required, bcrypt hashed),
  avatar:     String (URL, optional),
  university: String,
  major:      String,
  year:       String,
  bio:        String,
  createdAt:  Date (auto),
  updatedAt:  Date (auto)
}
```

### `studygroups` collection (model: [StudyGroup.js](backend/models/StudyGroup.js))

```javascript
{
  groupName:    String (required),
  subject:      String (required),
  description:  String (required),
  date:         String (YYYY-MM-DD),
  time:         String,
  location:     String,
  maxMembers:   Number (default 6),
  members:      [ ObjectId → User ],
  createdBy:    ObjectId → User (required),
  status:       'active' | 'archived' (default 'active'),
  createdAt:    Date (auto),
  updatedAt:    Date (auto)
}
```

`_id` of the document serves as the canonical group ID (returned as `groupId` in API responses).

---

## Duplicate & Race-Condition Prevention

The backend uses a combination of explicit pre-checks and atomic single-query operations:

| Scenario                       | Protection                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Duplicate email on signup      | Mongoose `unique: true` index → handled in controller with 409 + descriptive message                      |
| Duplicate group creation       | Explicit `findOne({groupName, subject, createdBy, date, time})` before insert → 409 Conflict              |
| Double-click "Join" (racing)   | Atomic `findOneAndUpdate( {_id, members:{$ne:userId}, $expr:{$lt:[{$size:'$members'},'$maxMembers']}} , {$addToSet:{members:userId}} )`. Only one concurrent request modifies the document. |
| Joining with full group        | Enforced inside the atomic query (`$expr` `$size < maxMembers`)                                           |
| Joining twice                  | `{$ne: userId}` in query + `$addToSet` update                                                              |
| Creator leaving their group    | Explicit check in `leaveGroup` controller → returns 400 with message                                      |
| Deleting/Editing others' groups| Middleware check: only `group.createdBy.toString() === req.user._id.toString()` can mutate                  |

---

## Troubleshooting

- **MongoDB connection errors** — Verify the `.env` MONGODB_URI has no angle brackets around the password (e.g. `:sowmya0510@`, NOT `:<sowmya0510>@`). Check MongoDB Atlas network IP whitelist.
- **CORS errors** — CORS is configured for `http://localhost:3000` and `http://127.0.0.1:3000`. If you use another origin, add it to `server.js`'s CORS `origin` array.
- **Vite proxy not working** — Make sure backend is running on port 5000 *before* frontend requests; check `vite.config.js` proxy.
- **401 Unauthorized after login** — JWT is persisted in localStorage; check Application → Local Storage for `token`. AuthContext attaches it via Axios request interceptor in [api.js](src/services/api.js).
- **"No study groups available yet."** on empty DB — This is correct empty-state behavior. Create a group or run `npm run seed` in backend.
- **Port 5000/3000 already in use** — Windows: `netstat -ano | findstr :5000` → `taskkill /PID <pid> /F`, or change PORT in `.env` and update the Vite proxy target in `vite.config.js`.

---

Happy studying together! 🎓✨
