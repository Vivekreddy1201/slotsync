<div align="center">
  <img src="https://slotsync.com/logo.svg" alt="SlotSync Logo" width="120" />
  <br/>
  <h1>Full-Stack Scheduling Platform</h1>
  <p>An elegant, high-performance scheduling web application built as a pixel-perfect replica of SlotSync.</p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="Postgres" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </div>
</div>

---

## 📖 Overview

This project is a beautifully designed, full-stack scheduling and booking system modeled directly after SlotSync. Built with an unwavering commitment to UI/UX excellence, it offers seamless appointment scheduling, customizable user availability, and a frictionless public-facing booking flow.

Whether you're looking to share your availability with a simple `/[slug]` link or extensively manage your working hours and timezone, this application delivers a remarkably smooth experience.

## ✨ Core Features

#### 📅 Effortless Booking Experience
- **Public Booking Pages**: Instantly generate clean, shareable URLs for others to book time on your calendar.
- **Smart Time Slots**: The system automatically slices your available hours into crisp intervals tailored to your event type's duration.
- **Buffer Times**: Configurable buffers before and after events to prevent burn-out and back-to-back unmanageable schedules.

#### ⚙️ Powerful Event & Availability Management
- **Multiple Schedules**: Define various availability curves (e.g. "Working Hours", "Weekends") and assign them to specific events.
- **Date Overrides**: Step away for a vacation? Set specific dates as "Unavailable" or create custom working hours for specific days without ruining your weekly schedule.
- **Timezone Awareness**: Full support for scheduling across international boundaries.

#### 📊 Dashboard & Workflows
- **Upcoming & Past Meetings**: See exactly what's on your agenda.
- **Cancel Framework**: Soft cancellation capabilities to back out of upcoming reservations safely.
- **Bulk Updates**: Need to switch the default schedule for 15 event types? Do it in one click via the bulk update flow.

## 🛠 Tech Stack

Our stack is lean, type-safe, and highly scalable:

**Frontend Ecosystem**
- **Framework**: `Next.js` (App Router)
- **Styling**: `Tailwind CSS v4`
- **Icons & Primitives**: `Lucide React`
- **Dates**: `date-fns` for rigorous frontend datetime orchestration

**Backend Ecosystem**
- **Framework**: `FastAPI` (Python)
- **ORM**: `SQLAlchemy`
- **Database**: `PostgreSQL` (`psycopg2`)

---

## 🚀 Live Production Deployment

**🌐 Live URL:** [https://scaler-slotsync-clone.vercel.app/](https://scaler-slotsync-clone.vercel.app/)

The codebase is natively configured for an immediate 1-click cloud deployment.

- **Frontend Hosting**: Rendered and distributed securely via **Vercel** (`frontend` directory).
- **Backend & API Layer**: containerized and launched automatically via **Render** using the provided `render.yaml` Blueprint.
- **Database**: Managed **Render PostgreSQL** securely attached via the `DATABASE_URL` environment variable.

---

## 💻 Local Development Setup

Interested in running the repository on your own machine? Start here.

### 1. Database Setup
Ensure PostgreSQL is running locally and update the target URL in `backend/database.py` (or inject it via the `DATABASE_URL` environment variable).

### 2. Backend Operations
```bash
cd backend

# Create isolated environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies and seed the database
pip install -r requirements.txt
python seed.py

# Launch the Uvicorn ASGI server
uvicorn main:app --reload --port 8000
```
*The API immediately spins up at `http://localhost:8000/api`*

### 3. Frontend Operations
```bash
cd frontend

# Hydrate the Node modules
npm install

# Start the Next.js development engine
npm run dev
```
*The management dashboard gracefully spins up at `http://localhost:3000`*

---

> Designed & Developed as a masterclass Capstone project.
