from typing import Optional
from pydantic import BaseModel, Field, model_validator


class RouteRequest(BaseModel):
    """Schema for route calculation request. Use vehicle_id when logged in, or fuel_consumption/fuel_price for guest."""
    origin: str = Field(..., description="Starting location (address or coordinates)")
    destination: str = Field(..., description="Destination location (address or coordinates)")
    vehicle_id: Optional[int] = Field(None, description="ID of the vehicle (required when logged in)")
    fuel_consumption: Optional[float] = Field(None, ge=0.1, le=50, description="L/100km for guest calculation")
    fuel_price: Optional[float] = Field(None, ge=0, description="Price per liter for guest calculation")
    alternatives: bool = Field(False, description="Whether to return alternative routes")

    @model_validator(mode="after")
    def guest_or_vehicle(self):
        has_vehicle = self.vehicle_id is not None
        has_guest = self.fuel_consumption is not None and self.fuel_price is not None
        if not has_vehicle and not has_guest:
            raise ValueError("Provide either vehicle_id (when logged in) or both fuel_consumption and fuel_price (guest)")
        if has_vehicle and has_guest:
            raise ValueError("Provide either vehicle_id or guest fuel params, not both")
        return self


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
    vehicle_id: Optional[int] = Field(None, description="Set when logged in; null for guest")
    routes: list[RouteOption]
    trip_id: Optional[int] = Field(None, description="ID of the saved trip (only when logged in)")
