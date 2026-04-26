# Scheduling Platform - Technical Documentation

This document provides a comprehensive technical overview of the full-stack scheduling application modeled after SlotSync. 

## 1. System Architecture

The project follows a decoupled client-server architecture with a clear separation between the presentation layer and the business/data layers.

### Frontend
- **Framework**: Built on **Next.js 16.2** using the App Router (`app/` directory).
- **Styling**: Tailored with **Tailwind CSS v4** and customized components, prioritizing aesthetic, responsive, and clean design.
- **State & UI**: Uses modern React paradigms, `Lucide React` for iconography, and `date-fns` for robust frontend time manipulations.

### Backend
- **Framework**: **FastAPI** (Python 3.x), utilizing Pydantic for data validation and Starlette for routing.
- **Database Orchestration**: **SQLAlchemy** acts as the ORM, communicating with a **PostgreSQL 16** database (`psycopg2`).
- **RESTful API**: Exposes JSON payloads for the frontend to consume, manage configurations, and book events.

---

## 2. Data Models (Schema)

The database consists of 5 tightly-coupled core models:

1. **Schedule**: Represents a collection of availabilities (e.g., "Working Hours").
   - Contains: `name`, `timezone`, `is_default` flag.
2. **Availability**: Defines standard weekly recurring hours.
   - Tied to a `Schedule`.
   - Contains: `day_of_week` (0-6), `start_time`, `end_time`.
3. **DateOverride**: Exceptional hours or days off that override standard weekly loops.
   - Contains: `date`, `start_time`, `end_time`, `is_unavailable` flag.
4. **EventType**: Determines the kind of meetings a user can book.
   - Tied to a specific `Schedule`.
   - Contains: `title`, `duration_minutes`, `slug`, `buffer_time_before`, `buffer_time_after`.
5. **Booking**: Actively booked reservations made by external users.
   - Tied to an `EventType`.
   - Contains: `booker_name`, `booker_email`, `start_time`, `end_time`, `status` (confirmed/cancelled).

---

## 3. Core Business Logic

### Slot Generation Algorithm
The API endpoint `/api/public/slots/{slug}` intelligently computes exact time slots for external bookers:
1. **Fetch Availabilities**: Determines if the specific target date has a `DateOverride`. If so, uses the override. If not, falls back to the `Availability` matching the day of the week.
2. **Current Time Awareness**: If checking "today", the algorithm forces the starting slot to snap dynamically forward from exactly `datetime.now()` to the next crisp integer interval.
3. **Collision Avoidance**: Looks through all confirmed `Booking` instances on that day. 
4. **Buffer Implementation**: Before validating a potential slot against existing bookings, the system expands the collision zone by padding it with `buffer_time_before` and `buffer_time_after` values from the Event Type to guarantee no overlap occurs and burnout is prevented.

---

## 4. REST API Endpoint Map

### Event Types
- `GET /api/event-types` — List all event types.
- `GET /api/event-types/{id}` — Get single event type.
- `POST /api/event-types` — Create an event type.
- `PUT /api/event-types/{id}` — Update event details.
- `DELETE /api/event-types/{id}` — Delete an event.

### Schedules & Availability
- `GET /api/schedules` — List schedules.
- `POST /api/schedules` — Create a new schedule.
- `PUT /api/schedules/{id}/default` — Set a given schedule as global system default.
- `GET /api/schedules/{id}/availability` — Read weekly loops.
- `PUT /api/schedules/{id}/availability` — Bulk overwrite weekly loops.
- `GET /api/schedules/{id}/overrides` — List date overrides.
- `PUT /api/schedules/{id}/overrides` — Map/overwrite exact overrides.

### Bookings (Public & Admin)
- `GET /api/public/event-types/{slug}` — Retrieve public metadata for an event.
- `GET /api/public/slots/{slug}?target_date=YYYY-MM-DD` — Generate algorithmic slots.
- `POST /api/bookings` — Create a new reservation.
- `GET /api/bookings` — (Admin) View all bookings.
- `PATCH /api/bookings/{id}/cancel` — Soft-cancel an existing reservation.

---

## 5. Deployment Lifecycle

The project is fully prepared for an abstracted 1-click cloud lifecycle:
- **Database Layer**: Managed PostgreSQL hosted on Render.
- **Backend API Layer**: Containerized ASGI FastAPI application deployed automatically to Render, reading `DATABASE_URL` for stateful database injection.
- **Frontend Layer**: Next.js distribution deployed via Vercel Edge networks (`https://scaler-slotsync-clone.vercel.app/`). Automatically points to the Production Render API endpoint via the Vercel variables.
