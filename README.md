<div align="center">
  <h1>SlotSync — Full-Stack Scheduling Platform</h1>
  <p>An elegant, high-performance scheduling web application built as a scalable and modern replica of Cal.com / Calendly.</p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="Postgres" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </div>
</div>

---

## Overview

**SlotSync** is a beautifully designed, full-stack scheduling and booking system. Built with an unwavering commitment to UI/UX excellence, it offers seamless appointment scheduling, customizable user availability, secure authentication, and a frictionless public-facing booking flow.

Whether you're looking to share your availability with a simple `/[username]/[slug]` link or extensively manage your working hours, this application delivers a remarkably smooth experience. It supports a full authentication flow, making it suitable for multi-user deployment where each user can manage their own calendar, schedules, and event types.

## Core Features

#### Secure Authentication & User Management
- **JWT-Based Authentication**: Secure stateless session management utilizing short-lived access tokens (15m) and secure refresh tokens (7 days).
- **Password Encryption**: Best-in-class `bcrypt` password hashing ensures user credentials are computationally secure.
- **User Dashboard**: Dedicated, protected routes for authenticated users to manage their scheduling links.

#### Effortless Booking Experience
- **Public Booking Pages**: Instantly generate clean, shareable URLs (e.g., `/[username]/[slug]`) for others to book time on your calendar.
- **Smart Time Slots**: The system automatically slices available hours into crisp intervals tailored to an event type's specific duration.
- **Buffer Times**: Configurable buffers before and after events to prevent burn-out and back-to-back unmanageable schedules.

#### Powerful Event & Availability Management
- **Multiple Schedules**: Define various availability curves (e.g. "Working Hours", "Weekends") and assign them to specific events.
- **Date Overrides**: Step away for a vacation? Set specific dates as "Unavailable" or create custom working hours for specific days without ruining your weekly schedule.
- **Timezone Awareness**: Full support for scheduling across international boundaries.

#### Dashboard & Workflows
- **Upcoming & Past Meetings**: See exactly what's on your agenda.
- **Cancel Framework**: Soft cancellation capabilities to back out of upcoming reservations safely.
- **Bulk Updates**: Need to switch the default schedule for multiple event types? Do it in one click via the bulk update flow.

---

## Tech Stack

Our stack is lean, type-safe, highly scalable, and deployed via modern cloud-native providers.

**Frontend Ecosystem**
- **Framework**: `Next.js` (App Router)
- **Styling**: `Tailwind CSS v4`
- **Icons & Primitives**: `Lucide React`
- **Dates**: `date-fns` for rigorous frontend datetime orchestration

**Backend Ecosystem**
- **Framework**: `FastAPI` (Python)
- **ORM**: `SQLAlchemy`
- **Database**: `PostgreSQL` (`psycopg2`)
- **Authentication**: `PyJWT` & `passlib[bcrypt]`

---

## Live Production Deployment

Live URL : [https://slotsync.vercel.app/](https://slotsync.vercel.app/)

The codebase is natively configured for an immediate 1-click cloud deployment.
- **Frontend Hosting**: Rendered and distributed securely via **Vercel** (`frontend` directory).
- **Backend & API Layer**: Containerized and launched automatically via **Render** using the provided `render.yaml` Blueprint.
- **Database**: Managed **Render PostgreSQL** securely attached via the `DATABASE_URL` environment variable.

---

## Local Development Setup

Interested in running the repository on your own machine? Follow these simple steps.

### 1. Database Setup
Ensure PostgreSQL is installed and running locally. Create a database (e.g., `slotsync_dev`).
Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/slotsync_dev
SECRET_KEY=your-super-secret-development-key
```

### 2. Backend Operations
Open a terminal and navigate to the backend directory:
```bash
cd backend

# Create isolated environment
python -m venv venv

# Activate environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the database reset/seed script (optional, creates initial tables)
python reset_db.py
python seed.py

# Launch the Uvicorn ASGI server
uvicorn main:app --reload --port 8000
```
*The API is now running at `http://localhost:8000`. You can view the automatic Swagger documentation at `http://localhost:8000/docs`.*

### 3. Frontend Operations
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend

# Install Node modules
npm install

# Start the Next.js development engine
npm run dev
```
*The management dashboard gracefully spins up at `http://localhost:3000`.*

---

## API Reference

The backend exposes a comprehensive RESTful JSON API. Notable namespaces include:
- **`POST /api/auth/register`**: Register a new user account.
- **`POST /api/auth/login`**: Authenticate and receive JWT tokens.
- **`GET /api/public/{username}/event-types`**: Retrieve all public event types for a specific user.
- **`GET /api/public/{username}/slots/{slug}`**: Algorithmic slot generation endpoint considering overrides, buffer times, and existing bookings.

For the complete interactive API documentation, run the backend server and navigate to `/docs`.

---
## Future Improvements

- Google Calendar integration  
- Email notifications  
- Real-time updates using WebSockets  
- Load balancing for high concurrency  

---
