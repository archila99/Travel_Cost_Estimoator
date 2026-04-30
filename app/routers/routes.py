import logging
from types import SimpleNamespace
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.user import User
from app.schemas.route import RouteRequest, RouteResponse, RouteOption
from app.services.route_calculator import route_calculator
from app.services.cost_estimator import cost_estimator
from app.services.maps_client import RouteError
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
        origin = (route_request.origin or "").strip()
        destination = (route_request.destination or "").strip()
        if not origin or not destination:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "VALIDATION_ERROR", "message": "Origin and destination are required."},
            )
        if origin.lower() == destination.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "VALIDATION_ERROR", "message": "Origin and destination must be different."},
            )
        routes = route_calculator.calculate_routes(
            origin=origin,
            destination=destination,
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
            origin=origin,
            destination=destination,
            vehicle_id=getattr(vehicle, "id", None),
            routes=route_options,
            trip_id=saved_trip_id,
        )
    except HTTPException:
        raise
    except RouteError as e:
        raise HTTPException(
            status_code=e.http_status,
            detail={"error": e.code, "message": e.message, **({"field": e.field} if e.field else {})},
        )
    except Exception as e:
        logger.exception("Route calculation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ROUTING_SERVICE_ERROR", "message": "Routing service is unavailable. Please try again later."},
        )
