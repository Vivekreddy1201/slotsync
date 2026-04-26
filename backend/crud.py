from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import models
import schemas
from datetime import datetime, timedelta
import auth

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default schedule
    first_schedule = models.Schedule(name="Working Hours", timezone="UTC", is_default=True, user_id=db_user.id)
    db.add(first_schedule)
    db.commit()
    db.refresh(first_schedule)
    
    return db_user

# --- Schedules ---
def get_schedules(db: Session, user_id: int):
    return db.query(models.Schedule).filter(models.Schedule.user_id == user_id).order_by(models.Schedule.created_at.desc()).all()

def get_schedule(db: Session, schedule_id: int, user_id: int):
    return db.query(models.Schedule).filter(models.Schedule.id == schedule_id, models.Schedule.user_id == user_id).first()

def create_schedule(db: Session, schedule: schemas.ScheduleCreate, user_id: int):
    db_schedule = models.Schedule(**schedule.dict(), user_id=user_id)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def update_schedule(db: Session, schedule_id: int, schedule: schemas.ScheduleCreate, user_id: int):
    db_obj = get_schedule(db, schedule_id, user_id)
    if db_obj:
        for key, value in schedule.dict().items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_schedule(db: Session, schedule_id: int, user_id: int):
    db_obj = get_schedule(db, schedule_id, user_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False

def set_schedule_default(db: Session, schedule_id: int, user_id: int):
    schedule = get_schedule(db, schedule_id, user_id)
    if not schedule: return False
    
    db.query(models.Schedule).filter(models.Schedule.user_id == user_id).update({"is_default": False})
    schedule.is_default = True
    db.commit()
    return True

# --- Event Types ---
def get_event_types(db: Session, user_id: int):
    return db.query(models.EventType).filter(models.EventType.user_id == user_id).order_by(models.EventType.created_at.desc()).all()

def get_event_type_by_slug(db: Session, user_id: int, slug: str):
    return db.query(models.EventType).filter(models.EventType.user_id == user_id, models.EventType.slug == slug).first()

def get_event_type(db: Session, event_type_id: int, user_id: int):
    return db.query(models.EventType).filter(models.EventType.id == event_type_id, models.EventType.user_id == user_id).first()

def create_event_type(db: Session, event_type: schemas.EventTypeCreate, user_id: int):
    evt_dict = event_type.dict()
    if evt_dict.get("schedule_id") is None:
        default_schedule = db.query(models.Schedule).filter(models.Schedule.user_id == user_id, models.Schedule.is_default == True).first()
        if default_schedule:
            evt_dict["schedule_id"] = default_schedule.id
            
    db_event_type = models.EventType(**evt_dict, user_id=user_id)
    db.add(db_event_type)
    db.commit()
    db.refresh(db_event_type)
    return db_event_type

def update_event_type(db: Session, event_type_id: int, event_type: schemas.EventTypeCreate, user_id: int):
    db_obj = get_event_type(db, event_type_id, user_id)
    if db_obj:
        for key, value in event_type.dict().items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_event_type(db: Session, event_type_id: int, user_id: int):
    db_obj = get_event_type(db, event_type_id, user_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False

# --- Availability ---
def get_availabilities(db: Session, schedule_id: int = None, user_id: int = None):
    query = db.query(models.Availability)
    if schedule_id:
        schedule = get_schedule(db, schedule_id, user_id)
        if not schedule:
            return []
        query = query.filter(models.Availability.schedule_id == schedule_id)
    return query.order_by(models.Availability.day_of_week).all()

def set_availabilities(db: Session, schedule_id: int, availabilities: list[schemas.AvailabilityCreate], user_id: int):
    schedule = get_schedule(db, schedule_id, user_id)
    if not schedule:
        return []
    db.query(models.Availability).filter(models.Availability.schedule_id == schedule_id).delete()
    db_objs = []
    for av in availabilities:
        av_dict = av.dict()
        av_dict["schedule_id"] = schedule_id
        db_objs.append(models.Availability(**av_dict))
        
    db.add_all(db_objs)
    db.commit()
    return get_availabilities(db, schedule_id, user_id)

# --- Date Overrides ---
def get_schedule_overrides(db: Session, schedule_id: int, user_id: int):
    schedule = get_schedule(db, schedule_id, user_id)
    if not schedule:
        return []
    return db.query(models.DateOverride).filter(models.DateOverride.schedule_id == schedule_id).order_by(models.DateOverride.date.asc()).all()

def set_schedule_overrides(db: Session, schedule_id: int, overrides: list[schemas.DateOverrideCreate], user_id: int):
    schedule = get_schedule(db, schedule_id, user_id)
    if not schedule:
        return []
    db.query(models.DateOverride).filter(models.DateOverride.schedule_id == schedule_id).delete()
    db_objs = []
    for ov in overrides:
        ov_dict = ov.dict()
        ov_dict["schedule_id"] = schedule_id
        db_objs.append(models.DateOverride(**ov_dict))
        
    db.add_all(db_objs)
    db.commit()
    return get_schedule_overrides(db, schedule_id, user_id)

# --- Bookings ---
def get_bookings(db: Session, user_id: int):
    return db.query(models.Booking).join(models.EventType).filter(models.EventType.user_id == user_id).order_by(models.Booking.start_time.asc()).all()

def get_booking(db: Session, booking_id: int, user_id: int = None):
    query = db.query(models.Booking).filter(models.Booking.id == booking_id)
    if user_id:
        query = query.join(models.EventType).filter(models.EventType.user_id == user_id)
    return query.first()

def create_booking(db: Session, booking: schemas.BookingCreate):
    event_type = db.query(models.EventType).filter(models.EventType.id == booking.event_type_id).first()
    if not event_type:
        raise ValueError("Event type not found")
        
    end_time = booking.start_time + timedelta(minutes=event_type.duration_minutes)
    
    # Check for double booking considering buffers
    p_start = booking.start_time - timedelta(minutes=event_type.buffer_time_before or 0)
    p_end = end_time + timedelta(minutes=event_type.buffer_time_after or 0)

    start_of_day = p_start.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = p_start.replace(hour=23, minute=59, second=59)

    existing_bookings = db.query(models.Booking).filter(
        models.Booking.event_type_id.in_([e.id for e in event_type.user.event_types]),
        models.Booking.status == "confirmed",
        models.Booking.start_time >= start_of_day,
        models.Booking.start_time <= end_of_day
    ).all()

    for b in existing_bookings:
        b_start = b.start_time - timedelta(minutes=(b.event_type.buffer_time_before if b.event_type else 0))
        b_end = b.end_time + timedelta(minutes=(b.event_type.buffer_time_after if b.event_type else 0))
        
        if (p_start < b_end) and (p_end > b_start):
            raise ValueError("Time slot is already booked or violates buffer constraints")
        
    db_booking = models.Booking(
        **booking.dict(),
        end_time=end_time
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def cancel_booking(db: Session, booking_id: int, user_id: int):
    db_booking = get_booking(db, booking_id, user_id)
    if db_booking:
        db_booking.status = "cancelled"
        db.commit()
        db.refresh(db_booking)
    return db_booking
