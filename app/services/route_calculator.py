from typing import List, Dict, Any
from app.services.maps_client import maps_client


class RouteCalculator:
    """Service for calculating and processing route information."""
    
    @staticmethod
    def meters_to_kilometers(meters: float) -> float:
        """Convert meters to kilometers."""
        return round(meters / 1000, 2)
    
    @staticmethod
    def seconds_to_minutes(seconds: float) -> float:
        """Convert seconds to minutes."""
        return round(seconds / 60, 2)
    
    def calculate_routes(
        self,
        origin: str,
        destination: str,
        alternatives: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Calculate routes with normalized distance and duration.
        
        Args:
            origin: Starting location
            destination: Ending location
            alternatives: Whether to fetch alternative routes
            
        Returns:
            List of route dictionaries with normalized values
        """
        # Fetch raw route data from Google Maps
        raw_routes = maps_client.get_directions(
            origin=origin,
            destination=destination,
            alternatives=alternatives
        )
        
        # Process and normalize the route data
        processed_routes = []
        for route in raw_routes:
            processed_route = {
                'distance_km': self.meters_to_kilometers(route['distance_meters']),
                'duration_minutes': self.seconds_to_minutes(route['duration_seconds']),
                'polyline': route['polyline'],
                'route_type': route['route_type'],
                'start_address': route['start_address'],
                'end_address': route['end_address']
            }
            processed_routes.append(processed_route)
        
        return processed_routes


# Global calculator instance
route_calculator = RouteCalculator()
