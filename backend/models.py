from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date, Time, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    schedules = relationship("Schedule", back_populates="user", cascade="all, delete-orphan")
    event_types = relationship("EventType", back_populates="user", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    timezone = Column(String(100), default="UTC")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="schedules")
    event_types = relationship("EventType", back_populates="schedule")
    availabilities = relationship("Availability", back_populates="schedule", cascade="all, delete-orphan")
    date_overrides = relationship("DateOverride", back_populates="schedule", cascade="all, delete-orphan")

class EventType(Base):
    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    slug = Column(String(255), index=True, nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=True)
    buffer_time_before = Column(Integer, default=0)
    buffer_time_after = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="event_types")
    schedule = relationship("Schedule", back_populates="event_types")
    bookings = relationship("Booking", back_populates="event_type")

class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False) # 0 = Monday, 6 = Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    schedule = relationship("Schedule", back_populates="availabilities")

class DateOverride(Base):
    __tablename__ = "date_overrides"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=True) # Null if is_unavailable is True
    end_time = Column(Time, nullable=True)
    is_unavailable = Column(Boolean, default=False)

    schedule = relationship("Schedule", back_populates="date_overrides")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"))
    booker_name = Column(String(255), nullable=False)
    booker_email = Column(String(255), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="confirmed") # confirmed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    event_type = relationship("EventType", back_populates="bookings")
