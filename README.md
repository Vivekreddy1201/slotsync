# SlotSync - Full Stack Scheduling Platform

## Description

SlotSync is a full-stack scheduling and booking application inspired by [Cal.com](http://Cal.com). It allows users to register, authenticate, create event types, define availability, and share public booking links where others can schedule meetings.

## Live Demo

https://scaler-cal-com-clone.vercel.app/

---

## Overview

The application enables authenticated users to manage their schedules and allows external users to book time slots based on defined availability. It focuses on clean architecture, secure authentication, efficient scheduling logic, and a smooth booking experience.

---

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- date-fns

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL

### Deployment
- Frontend hosted on Vercel
- Backend and database hosted on Render

---

## Core Features

### Authentication (JWT)
- User registration and login
- JWT-based authentication with short-lived access tokens (15 minutes)
- Refresh tokens valid for 7 days for seamless session renewal
- Secure token storage and automatic refresh handling on the frontend
- Protected routes — all dashboard and management endpoints require a valid access token

### Event Types Management
- Create event types with title, description, duration, and unique slug
- Edit and delete event types
- Each event type has a public booking link

### Availability Settings
- Configure working days
- Set daily time ranges
- Timezone-aware scheduling

### Public Booking
- Calendar-based date selection
- Dynamic time slot generation
- Booking form with name and email
- Prevention of double booking using backend validation
- Booking confirmation

### Bookings Dashboard
- View upcoming bookings
- View past bookings
- Cancel bookings

### Bonus Features
- Buffer time between meetings
- Multiple availability schedules
- Date overrides
- Responsive UI

---

## System Design

The application follows a client-server architecture with clear separation between frontend and backend.

### Backend
- REST API built using FastAPI
- Modular structure with routes, services, and database layers
- JWT middleware for authentication and authorization
- Slot generation based on availability, duration, and buffer time
- Server-side validation to prevent booking conflicts

### Database Design
- `users` table
- `event_types` table
- `availability` table
- `schedules` table
- `date_overrides` table
- `bookings` table

### Relationships
- One user can have multiple event types
- One event type can have multiple bookings
- Availability linked to schedules

---

## Core Logic

### Authentication Flow
- On login, the server issues an **access token** (expires in 15 minutes) and a **refresh token** (expires in 7 days)
- The frontend automatically uses the refresh token to obtain a new access token when it expires
- On logout or refresh token expiry, the user is redirected to login

### Slot Generation
- Check date overrides or weekly availability
- Generate slots based on duration and working hours
- Apply buffer time before and after events
- Remove slots that overlap with existing bookings

### Double Booking Prevention
- Booking validation performed at the backend before saving

### Timezone Handling
- All timestamps stored in UTC
- Converted to local timezone on frontend

---

## API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Event Types *(protected)*
- `GET /api/event-types`
- `GET /api/event-types/{id}`
- `POST /api/event-types`
- `PUT /api/event-types/{id}`
- `DELETE /api/event-types/{id}`

### Schedules and Availability *(protected)*
- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/{id}/default`
- `GET /api/schedules/{id}/availability`
- `PUT /api/schedules/{id}/availability`
- `GET /api/schedules/{id}/overrides`
- `PUT /api/schedules/{id}/overrides`

### Public Booking
- `GET /api/public/event-types/{slug}`
- `GET /api/public/slots/{slug}?target_date=YYYY-MM-DD`
- `POST /api/bookings`

### Bookings *(protected)*
- `GET /api/bookings`
- `PATCH /api/bookings/{id}/cancel`

---

## Sample API

### Login
```http
POST /api/auth/login
{
  "email": "ram@gmail.com",
  "password": "yourpassword"
}
```

Response:
```json
{
  "access_token": "<jwt_access_token>",
  "refresh_token": "<jwt_refresh_token>",
  "token_type": "bearer"
}
```

### Refresh Token
```http
POST /api/auth/refresh
{
  "refresh_token": "<jwt_refresh_token>"
}
```

### Create Booking
```http
POST /api/bookings
Authorization: Bearer <access_token>

{
  "event_type_id": 1,
  "start_time": "2026-04-16T10:00:00Z",
  "end_time": "2026-04-16T10:30:00Z",
  "name": "ram",
  "email": "ram@gmail.com"
}
```

---

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/Vivekreddy1201/slotsync
cd slotsync
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Configure the following in your `.env` file:

```env
SECRET_KEY=your_jwt_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql://user:password@localhost/slotSync
```

---

## Assumptions

- Users must register and log in to manage event types, availability, and bookings
- Public booking pages remain accessible without authentication
- Access tokens expire after 15 minutes; refresh tokens after 7 days
