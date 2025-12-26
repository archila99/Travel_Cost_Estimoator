from datetime import datetime
from pydantic import BaseModel, Field


class VehicleBase(BaseModel):
    """Base vehicle schema with common fields."""
    name: str = Field(..., description="Vehicle name or model")
    fuel_type: str = Field(..., description="Type of fuel (petrol, diesel, electric, hybrid)")
    fuel_consumption: float = Field(..., gt=0, description="Fuel consumption in liters per 100km")
    fuel_price: float = Field(..., gt=0, description="Fuel price per liter")


class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle."""
    pass


class VehicleUpdate(BaseModel):
    """Schema for updating a vehicle (all fields optional)."""
    name: str | None = None
    fuel_type: str | None = None
    fuel_consumption: float | None = Field(None, gt=0)
    fuel_price: float | None = Field(None, gt=0)


class VehicleResponse(VehicleBase):
    """Schema for vehicle response with ID and timestamp."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
