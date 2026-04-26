from fastapi import FastAPI, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import datetime, date, timedelta, time
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from jwt import PyJWTError as JWTError

import models, schemas, crud, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Scheduling Platform API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user_un = crud.get_user_by_username(db, username=user.username)
    if db_user_un:
        raise HTTPException(status_code=400, detail="Username already taken")
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user:
        user = crud.get_user_by_username(db, username=form_data.username)
        
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = auth.create_refresh_token(
        data={"sub": user.username}
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@app.post("/api/auth/refresh", response_model=schemas.Token)
def refresh_token(token_data: schemas.TokenRefresh, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        import jwt
        from jwt import PyJWTError as JWTError
        payload = jwt.decode(token_data.refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    new_refresh_token = auth.create_refresh_token(
        data={"sub": user.username}
    )
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Event Types Endpoints ---
@app.get("/api/event-types", response_model=List[schemas.EventTypeResponse])
def read_event_types(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_event_types(db, current_user.id)

@app.get("/api/event-types/{event_id}", response_model=schemas.EventTypeResponse)
def read_event_type(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_obj = crud.get_event_type(db, event_id, current_user.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Event type not found")
    return db_obj

@app.post("/api/event-types", response_model=schemas.EventTypeResponse)
def create_event_type(event_type: schemas.EventTypeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if crud.get_event_type_by_slug(db, user_id=current_user.id, slug=event_type.slug):
        raise HTTPException(status_code=400, detail="an event type with this url already exists for your user")
    return crud.create_event_type(db, event_type, current_user.id)

@app.put("/api/event-types/{event_id}", response_model=schemas.EventTypeResponse)
def update_event_type(event_id: int, event_type: schemas.EventTypeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_obj = crud.update_event_type(db, event_id, event_type, current_user.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Event type not found")
    return db_obj

@app.delete("/api/event-types/{event_id}")
def delete_event_type(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_event_type(db, event_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Event type not found")
    return {"message": "Success"}

# --- Schedules Endpoints ---
@app.get("/api/schedules", response_model=List[schemas.ScheduleResponse])
def read_schedules(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_schedules(db, current_user.id)

@app.post("/api/schedules", response_model=schemas.ScheduleResponse)
def create_schedule(schedule: schemas.ScheduleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_schedule(db, schedule, current_user.id)

@app.put("/api/schedules/{schedule_id}", response_model=schemas.ScheduleResponse)
def update_schedule(schedule_id: int, schedule: schemas.ScheduleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_obj = crud.update_schedule(db, schedule_id, schedule, current_user.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return db_obj

@app.delete("/api/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_schedule(db, schedule_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Success"}

@app.put("/api/schedules/{schedule_id}/default")
def set_schedule_default(schedule_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.set_schedule_default(db, schedule_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Success"}

# --- Availability Endpoints ---
@app.get("/api/schedules/{schedule_id}/availability", response_model=List[schemas.AvailabilityResponse])
def read_schedule_availability(schedule_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_availabilities(db, schedule_id, current_user.id)

@app.put("/api/schedules/{schedule_id}/availability", response_model=List[schemas.AvailabilityResponse])
def update_schedule_availability(schedule_id: int, availabilities: List[schemas.AvailabilityCreate], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.set_availabilities(db, schedule_id, availabilities, current_user.id)

# --- Date Overrides Endpoints ---
@app.get("/api/schedules/{schedule_id}/overrides", response_model=List[schemas.DateOverrideResponse])
def read_schedule_overrides(schedule_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_schedule_overrides(db, schedule_id, current_user.id)

@app.put("/api/schedules/{schedule_id}/overrides", response_model=List[schemas.DateOverrideResponse])
def update_schedule_overrides(schedule_id: int, overrides: List[schemas.DateOverrideCreate], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.set_schedule_overrides(db, schedule_id, overrides, current_user.id)

# --- Bookings Management ---
@app.get("/api/bookings", response_model=List[schemas.BookingResponse])
def read_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_bookings(db, current_user.id)

@app.patch("/api/bookings/{booking_id}/cancel", response_model=schemas.BookingResponse)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_obj = crud.cancel_booking(db, booking_id, current_user.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Booking not found")
    return db_obj

# --- Public Booking Endpoints ---
@app.get("/api/public/{username}/event-types", response_model=List[schemas.PublicEventTypeResponse])
def get_public_user_event_types(username: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.get_event_types(db, user.id)

@app.get("/api/public/{username}/event-types/{slug}", response_model=schemas.PublicEventTypeResponse)
def get_public_event_type(username: str, slug: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    event_type = crud.get_event_type_by_slug(db, user.id, slug)
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
    return event_type

@app.get("/api/public/{username}/slots/{slug}")
def get_available_slots(username: str, slug: str, target_date: date, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    event_type = crud.get_event_type_by_slug(db, user.id, slug)
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
        
    day_of_week = target_date.weekday() # 0 = Mon, 6 = Sun
    schedule_id = event_type.schedule_id
    
    if not schedule_id:
        schedule = db.query(models.Schedule).filter(models.Schedule.user_id == user.id, models.Schedule.is_default == True).first()
        schedule_id = schedule.id if schedule else None

    if schedule_id:
        # Check Date Overrides FIRST
        overrides = db.query(models.DateOverride).filter(
            models.DateOverride.schedule_id == schedule_id,
            models.DateOverride.date == target_date
        ).all()
        
        if overrides:
            if any(ov.is_unavailable for ov in overrides):
                availabilities = [] # Full day blocked
            else:
                availabilities = overrides # Duck-typing allows start_time / end_time mapping
        else:
            availabilities = db.query(models.Availability).filter(
                models.Availability.schedule_id == schedule_id,
                models.Availability.day_of_week == day_of_week
            ).all()
    else:
        availabilities = []
    
    if not availabilities:
        return {"date": target_date, "slots": []}
        
    # Get all confirmed bookings for this day for this user
    next_day = target_date + timedelta(days=1)
    bookings_on_day = db.query(models.Booking).join(models.EventType).filter(
        models.EventType.user_id == user.id,
        models.Booking.status == "confirmed",
        models.Booking.start_time >= datetime.combine(target_date, time.min),
        models.Booking.start_time < datetime.combine(next_day, time.min)
    ).all()
    
    slots = []
    duration = timedelta(minutes=event_type.duration_minutes)
    
    for avail in availabilities:
        current_time = datetime.combine(target_date, avail.start_time)
        end_avail_time = datetime.combine(target_date, avail.end_time)
        
        # If looking at today, we want to show times starting from right NOW, 
        # jumping to the next crisp interval, without extending the true schedule limits.
        if target_date == date.today():
            now = datetime.now()
                
            if current_time < now:
                # Snap to the very next clean interval
                minutes_diff = (now - current_time).total_seconds() / 60
                if document_duration := event_type.duration_minutes:
                    intervals_to_jump = int(minutes_diff // document_duration) + 1
                    current_time += timedelta(minutes=intervals_to_jump * document_duration)
                else: 
                    current_time = now
        
        while current_time + duration <= end_avail_time:
            slot_end = current_time + duration
            
            # Check overlap considering buffers
            overlap = False
            
            p_start = current_time - timedelta(minutes=event_type.buffer_time_before or 0)
            p_end = slot_end + timedelta(minutes=event_type.buffer_time_after or 0)
            
            for b in bookings_on_day:
                b_start = b.start_time - timedelta(minutes=(b.event_type.buffer_time_before if b.event_type else 0))
                b_end = b.end_time + timedelta(minutes=(b.event_type.buffer_time_after if b.event_type else 0))
                
                if (p_start < b_end) and (p_end > b_start):
                    overlap = True
                    break
                    
            if not overlap:
                slots.append({
                    "start_time": current_time.isoformat(),
                    "end_time": slot_end.isoformat()
                })
                
            # Slots should be incremented based on the event time size dynamically
            current_time += timedelta(minutes=event_type.duration_minutes)
            
    return {"date": target_date, "slots": slots}

@app.post("/api/public/bookings", response_model=schemas.BookingResponse)
def create_new_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_booking(db, booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
