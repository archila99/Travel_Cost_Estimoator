from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.schemas.route import RouteRequest, RouteResponse, RouteOption
from app.services.route_calculator import route_calculator
from app.services.cost_estimator import cost_estimator

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/calculate", response_model=RouteResponse)
def calculate_route(route_request: RouteRequest, db: Session = Depends(get_db)):
    """
    Calculate route with fuel consumption and cost estimation.
    
    Args:
        route_request: Route calculation parameters
        db: Database session
        
    Returns:
        Route options with cost estimates
        
    Raises:
        HTTPException: If vehicle not found or route calculation fails
    """
    # Fetch vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == route_request.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with id {route_request.vehicle_id} not found"
        )
    
    try:
        # Calculate routes
        routes = route_calculator.calculate_routes(
            origin=route_request.origin,
            destination=route_request.destination,
            alternatives=route_request.alternatives
        )
        
        # Process each route and calculate costs
        route_options = []
        saved_trip_id = None
        
        for idx, route in enumerate(routes):
            # Calculate fuel consumption and cost
            cost_data = cost_estimator.estimate_trip_cost(
                distance_km=route['distance_km'],
                vehicle=vehicle
            )
            
            # Create route option
            route_option = RouteOption(
                distance_km=route['distance_km'],
                duration_minutes=route['duration_minutes'],
                fuel_used_liters=cost_data['fuel_used_liters'],
                fuel_cost=cost_data['fuel_cost'],
                route_type=route['route_type'],
                polyline=route['polyline']
            )
            route_options.append(route_option)
            
            # Save only the primary (first) route to database
            if idx == 0:
                trip = Trip(
                    vehicle_id=vehicle.id,
                    origin=route['start_address'],
                    destination=route['end_address'],
                    distance_km=route['distance_km'],
                    duration_minutes=route['duration_minutes'],
                    fuel_used_liters=cost_data['fuel_used_liters'],
                    fuel_cost=cost_data['fuel_cost'],
                    route_type=route['route_type']
                )
                db.add(trip)
                db.commit()
                db.refresh(trip)
                saved_trip_id = trip.id
        
        return RouteResponse(
            origin=route_request.origin,
            destination=route_request.destination,
            vehicle_id=vehicle.id,
            routes=route_options,
            trip_id=saved_trip_id
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating route: {str(e)}"
        )
