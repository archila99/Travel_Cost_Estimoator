from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.trip import Trip
from app.schemas.trip import TripResponse, TripListResponse, TripCreate
from app.dependencies import get_current_user

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip: TripCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Create a new trip for the authenticated user.
    """
    db_trip = Trip(**trip.model_dump(), user_id=current_user.id)
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.get("/", response_model=TripListResponse)
def list_trips(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List all trips with pagination.
    """
    total = db.query(Trip).filter(Trip.user_id == current_user.id).count()
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).offset(skip).limit(limit).all()
    
    return TripListResponse(
        trips=trips,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Get a specific trip by ID.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with id {trip_id} not found"
        )
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Delete a specific trip by ID.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with id {trip_id} not found"
        )
    
    db.delete(trip)
    db.commit()
    return None


@router.get("/vehicle/{vehicle_id}", response_model=List[TripResponse])
def get_trips_by_vehicle(
    vehicle_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all trips for a specific vehicle.
    """
    trips = (
        db.query(Trip)
        .filter(Trip.vehicle_id == vehicle_id, Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return trips
