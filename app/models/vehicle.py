from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.database import Base


class Vehicle(Base):
    """Vehicle model for storing vehicle information and fuel specifications."""
    
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    fuel_type = Column(String, nullable=False)  # petrol, diesel, electric, hybrid
    fuel_consumption = Column(Float, nullable=False)  # liters per 100km
    fuel_price = Column(Float, nullable=False)  # price per liter
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Vehicle(id={self.id}, name='{self.name}', fuel_type='{self.fuel_type}')>"
