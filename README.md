# Mini Job Portal — Frontend

This repository contains the frontend for the Mini Job Portal — a small job board built with Next.js (app router) and Tailwind CSS. The frontend talks to a separate backend API (Express + TypeScript + MongoDB).

----

**Contents**
- Setup steps (frontend & backend)
- Tech stack
- Environment variables (frontend & backend)
- DB schema / collections (MongoDB) + Firebase usage
- Test accounts (frontend + backend) and quick API commands

----

## Quick Setup

Prerequisites
- Node.js 18+ (or compatible LTS)
- npm (or yarn/pnpm)
- MongoDB running locally or reachable remotely
- Firebase service account JSON (for file storage) OR set `GOOGLE_APPLICATION_CREDENTIALS`

Frontend (this folder)

```bash
cd frontend
npm install
# copy or create .env (see ENV section below)
npm run dev
# open http://localhost:3000
```

Backend (api)

```bash
cd ../backend
npm install
# copy .env.example -> .env and fill values (see ENV section below)
npm run dev
# backend will run at http://localhost:8080 by default
```

Notes
- Frontend expects the backend API base URL in `NEXT_PUBLIC_API_URL` (default http://localhost:8080).
- If SMTP is configured in the backend `.env`, welcome and status emails will be sent.

----

## Tech stack

- Frontend: Next.js (app router), TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Mongoose (MongoDB)
- Authentication: JWT (issued by backend)
- File storage: Firebase Storage (via firebase-admin) for CV uploads
- Emails: Nodemailer (SMTP) for welcome + status emails

----

## Why Option B (Node.js + MongoDB) over Option A (Firebase)?

**Option B was chosen** for this project because it provides:

1. **Custom business logic** — The app has complex workflows (job posting, application tracking, status transitions with email notifications) that are easier to implement in a dedicated backend than Firebase cloud functions.

2. **More flexible role management** — Three distinct roles (candidate, employer, admin) with different permissions require custom authorization logic per endpoint. Node.js + Express middleware is more straightforward than Firebase security rules.

3. **Email notifications as a core feature** — Status updates trigger emails to candidates. Nodemailer + SMTP is simpler to test locally than Firebase cloud functions + external SMTP.

4. **Hybrid approach** — Uses Firebase *Storage* (not Firestore) for PDF uploads, getting the best of both: managed file storage without vendor lock-in on the database.

5. **Team preference** — Easier to debug and extend; developers can inspect logs, middleware, and controllers directly.

**Option A would be faster if:**
- The app had no backend logic (purely CRUD).
- File storage was the only backend requirement.
- Your team prefers serverless deployments (no server management).

**Current trade-off:** Option B requires running a MongoDB instance and a Node.js backend, but gives full control over features, auth, and business rules.

----

## Environment variables

Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` — API base URL (default: `http://localhost:8080`)
- `NEXT_PUBLIC_ADMIN_EMAIL` — optional admin email used by frontend to show admin UI

Backend (`backend/.env` — copy from `.env.example`)
- `PORT` — port to run the API (default 8080)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs
- `ADMIN_EMAIL` — when a registered email matches this, the account becomes `admin`
- `CORS_ORIGIN` — allowed origin for frontend (e.g. `http://localhost:3000`)
- `FRONTEND_URL` — frontend base URL used in emails
- `APP_NAME` — application name used in email templates

Firebase / Google credentials (for file uploads)
- `FIREBASE_STORAGE_BUCKET` — required (e.g. `my-project.appspot.com`)
- `FIREBASE_PROJECT_ID` — optional if you provide a service account
- `FIREBASE_CLIENT_EMAIL` — optional
- `FIREBASE_PRIVATE_KEY` — optional (use `\\n` escaped newlines) OR set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path

SMTP (optional, required for sending emails)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (true/false), `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

----

## DB schema (MongoDB collections)

This app uses MongoDB (Mongoose models). Collections and main fields:

- `users` (`User` model)
  - `_id` (ObjectId)
  - `email` (string, unique)
  - `passwordHash` (string)
  - `role` ("candidate" | "employer" | "admin")
  - `name` (string)
  - `createdAt`, `updatedAt`

- `candidateprofiles` (`CandidateProfile`)
  - `userId` (ref -> users)
  - `phone` (string)
  - `location` (string)
  - `skills` (string[])
  - `bio` (string)
  - `cvs` (array of `{ _id, url, fileName, uploadedAt }`)

- `employerprofiles` (`EmployerProfile`)
  - `userId` (ref -> users)
  - `companyName` (string)
  - `description` (string)
  - `website` (string)

- `jobs` (`Job`)
  - `employerId` (ref -> users)
  - `title`, `description`, `location`, `jobType` ("Internship" | "Full-time"), `salaryRange`

- `applications` (`Application`)
  - `jobId` (ref -> jobs)
  - `candidateId` (ref -> users)
  - `message` (string)
  - `cvUrl` (string)
  - `status` ("Pending" | "Shortlisted" | "Rejected") — default `Pending`

Firebase: this project uses Firebase *Storage* for storing uploaded PDF CVs. There are no Firestore collections used by the app — files are uploaded to the configured storage bucket (under `candidates/{userId}` or `applications/{userId}`).

----

## Test accounts (dev)

Use these sample accounts for local testing. These are not pre-seeded — you can create them via the backend API (`/api/auth/register`) or via the frontend registration page.

Common password used below: `Password123!` (for local testing only)

Frontend (use these to login at the UI)
- Candidate
  - Email: `candidate@example.com`
  - Password: `candidate123`
  - Name: `Test Candidate`

- Employer
  - Email: `employer@example.com`
  - Password: `employer123`
  - Name: `Test Employer`

- Admin
  - Email: `admin@example.com`
  - Password: `admind123`
  - Name: `Admin User`

Notes
- The register endpoint will treat an email equal to `ADMIN_EMAIL` (backend `.env`) as an admin account regardless of the `role` field you pass. Set `ADMIN_EMAIL=admin@example.com` in `backend/.env` to make the `admin@example.com` registration create an admin user.
- After creating users you may want to create an employer profile (`/api/employers/profile`) or candidate profile (`/api/candidates/profile`) either via the frontend or the API.

----

## Helpful dev tips

- If you change models, restart the backend server.
- If Firebase uploads fail locally, ensure `FIREBASE_PRIVATE_KEY` and other credentials are correct or set `GOOGLE_APPLICATION_CREDENTIALS` to your service account JSON path.
- To quickly inspect MongoDB data, use MongoDB Compass or `mongo` shell and look at collections: `users`, `candidateprofiles`, `employerprofiles`, `jobs`, `applications`.

