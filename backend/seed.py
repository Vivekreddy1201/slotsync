from database import SessionLocal, engine
from models import Base, EventType, Availability, Booking
from datetime import time, datetime, timedelta

def seed_database():
    print("Creating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Seeding event types...")
        event1 = EventType(
            title="15 Min Meeting",
            description="Quick chat to sync up.",
            duration_minutes=15,
            slug="15min"
        )
        event2 = EventType(
            title="30 Min Meeting",
            description="Standard half-hour meeting.",
            duration_minutes=30,
            slug="30min"
        )
        
        db.add(event1)
        db.add(event2)
        db.commit()
        
        print("Seeding availabilities...")
        # Mon-Fri (0-4), 9 AM to 5 PM
        availabilities = []
        for day in range(5):
            avail = Availability(
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                timezone="UTC"
            )
            availabilities.append(avail)
        db.add_all(availabilities)
        db.commit()
        
        print("Seeding fake bookings...")
        # Add a booking tomorrow at 10:00 AM
        tomorrow = datetime.now() + timedelta(days=1)
        start_t = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 10, 0)
        
        b1 = Booking(
            event_type_id=event2.id,
            booker_name="John Doe",
            booker_email="john@example.com",
            start_time=start_t,
            end_time=start_t + timedelta(minutes=30),
            status="confirmed"
        )
        db.add(b1)
        db.commit()
        
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
