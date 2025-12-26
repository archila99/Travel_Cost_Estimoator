from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    """Schema for route calculation request."""
    origin: str = Field(..., description="Starting location (address or coordinates)")
    destination: str = Field(..., description="Destination location (address or coordinates)")
    vehicle_id: int = Field(..., description="ID of the vehicle to use for calculations")
    alternatives: bool = Field(False, description="Whether to return alternative routes")


class RouteOption(BaseModel):
    """Schema for a single route option."""
    distance_km: float = Field(..., description="Total distance in kilometers")
    duration_minutes: float = Field(..., description="Estimated duration in minutes")
    fuel_used_liters: float = Field(..., description="Estimated fuel consumption in liters")
    fuel_cost: float = Field(..., description="Estimated fuel cost")
    route_type: str = Field(..., description="Route type (fastest, shortest, alternative)")
    polyline: str | None = Field(None, description="Encoded polyline for map display")


class RouteResponse(BaseModel):
    """Schema for route calculation response."""
    origin: str
    destination: str
    vehicle_id: int
    routes: list[RouteOption]
    trip_id: int | None = Field(None, description="ID of the saved trip (primary route only)")
