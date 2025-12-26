from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Trip(Base):
    """Trip model for storing route calculation history."""
    
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    fuel_used_liters = Column(Float, nullable=False)
    fuel_cost = Column(Float, nullable=False)
    route_type = Column(String, default="fastest")  # fastest, shortest, alternative
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<Trip(id={self.id}, origin='{self.origin}', destination='{self.destination}')>"
