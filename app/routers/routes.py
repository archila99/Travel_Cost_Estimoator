import logging
from types import SimpleNamespace
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.user import User
from app.schemas.route import RouteRequest, RouteResponse, RouteOption
from app.services.route_calculator import route_calculator
from app.services.cost_estimator import cost_estimator
from app.dependencies import get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/calculate", response_model=RouteResponse)
def calculate_route(
    route_request: RouteRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Calculate route with fuel consumption and cost estimation.
    Guest: send fuel_consumption and fuel_price (no auth); trip is not saved.
    Logged in: send vehicle_id; primary route is saved to your trip history.
    """
    vehicle = None
    if current_user:
        if route_request.vehicle_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="When logged in, vehicle_id is required",
            )
        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == route_request.vehicle_id,
                Vehicle.user_id == current_user.id,
            )
            .first()
        )
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with id {route_request.vehicle_id} not found",
            )
    else:
        if route_request.fuel_consumption is None or route_request.fuel_price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="When not logged in, fuel_consumption and fuel_price are required",
            )
        vehicle = SimpleNamespace(
            fuel_consumption=route_request.fuel_consumption,
            fuel_price=route_request.fuel_price,
        )

    try:
        routes = route_calculator.calculate_routes(
            origin=route_request.origin,
            destination=route_request.destination,
            alternatives=route_request.alternatives,
        )
        route_options = []
        saved_trip_id = None

        for idx, route in enumerate(routes):
            cost_data = cost_estimator.estimate_trip_cost(
                distance_km=route["distance_km"],
                vehicle=vehicle,
            )
            route_option = RouteOption(
                distance_km=route["distance_km"],
                duration_minutes=route["duration_minutes"],
                fuel_used_liters=cost_data["fuel_used_liters"],
                fuel_cost=cost_data["fuel_cost"],
                route_type=route["route_type"],
                polyline=route["polyline"],
            )
            route_options.append(route_option)

            if idx == 0 and current_user and hasattr(vehicle, "id"):
                trip = Trip(
                    vehicle_id=vehicle.id,
                    user_id=current_user.id,
                    origin=route["start_address"],
                    destination=route["end_address"],
                    distance_km=route["distance_km"],
                    duration_minutes=route["duration_minutes"],
                    fuel_used_liters=cost_data["fuel_used_liters"],
                    fuel_cost=cost_data["fuel_cost"],
                    route_type=route["route_type"],
                )
                db.add(trip)
                db.commit()
                db.refresh(trip)
                saved_trip_id = trip.id

        return RouteResponse(
            origin=route_request.origin,
            destination=route_request.destination,
            vehicle_id=getattr(vehicle, "id", None),
            routes=route_options,
            trip_id=saved_trip_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Route calculation failed: %s", e)
        msg = str(e).lower()
        # Return a clear message when the failure is likely API key or Google Maps config
        if "api key" in msg or "google maps" in msg or "403" in msg or "401" in msg or "invalid" in msg or "placeholder" in msg:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Google Maps API error. Check that GOOGLE_MAPS_API_KEY is set in .env, "
                    "is valid, and that Routes API (Directions API) is enabled for your project."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating route: {str(e)}",
        )
