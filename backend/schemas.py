from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, time, date

# --- Auth & Users ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenRefresh(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PublicUserResponse(BaseModel):
    username: str
    id: int

# --- Schedules ---
class ScheduleBase(BaseModel):
    name: str
    timezone: str = "UTC"
    is_default: bool = False

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Event Types ---
class EventTypeBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    slug: str
    schedule_id: Optional[int] = None
    buffer_time_before: int = 0
    buffer_time_after: int = 0

class EventTypeCreate(EventTypeBase):
    pass

class EventTypeResponse(EventTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Availability ---
class AvailabilityBase(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time

class AvailabilityCreate(AvailabilityBase):
    schedule_id: int

class AvailabilityResponse(AvailabilityBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True

# --- Date Overrides ---
class DateOverrideBase(BaseModel):
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_unavailable: bool = False

class DateOverrideCreate(DateOverrideBase):
    pass

class DateOverrideResponse(DateOverrideBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True

# --- Bookings ---
class BookingBase(BaseModel):
    booker_name: str
    booker_email: EmailStr
    start_time: datetime

class BookingCreate(BookingBase):
    event_type_id: int

class BookingResponse(BookingBase):
    id: int
    event_type_id: int
    end_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Public Booking Day Response
class AvailableSlot(BaseModel):
    start_time: datetime
    end_time: datetime

class PublicEventTypeResponse(EventTypeResponse):
    pass

class DateAvailabilityResponse(BaseModel):
    date: date
    slots: List[AvailableSlot]
