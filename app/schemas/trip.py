from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TripCreate(BaseModel):
    """Schema for creating a trip."""
    vehicle_id: int
    origin: str
    destination: str
    distance_km: float
    duration_minutes: float
    fuel_used_liters: float
    fuel_cost: float
    route_type: str = "fastest"


class TripResponse(BaseModel):
    """Schema for trip response."""
    id: int
    vehicle_id: int
    origin: str
    destination: str
    distance_km: float
    duration_minutes: float
    fuel_used_liters: float
    fuel_cost: float
    route_type: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TripListResponse(BaseModel):
    """Schema for paginated trip list response."""
    trips: list[TripResponse]
    total: int
    page: int
    page_size: int
