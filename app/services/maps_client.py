import googlemaps
from typing import List, Dict, Any
from app.config import settings


class GoogleMapsClient:
    """Client for interacting with Google Maps Routes API."""
    
    def __init__(self):
        """Initialize the Google Maps client with API key."""
        self.api_key = settings.google_maps_api_key
        self.base_url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    
    def _parse_duration(self, duration_str: str) -> int:
        """Parse duration string like '123s' into seconds integer."""
        if not duration_str or not duration_str.endswith('s'):
            return 0
        return int(duration_str[:-1])

    def get_directions(
        self,
        origin: str,
        destination: str,
        alternatives: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get directions from origin to destination using Routes API.
        
        Args:
            origin: Starting location (address or coordinates)
            destination: Ending location (address or coordinates)
            alternatives: Whether to return alternative routes
            
        Returns:
            List of route dictionaries containing distance, duration, and polyline
            
        Raises:
            Exception: If the API request fails
        """
        import httpx
        import json

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.routeToken"
        }

        payload = {
            "origin": {
                "address": origin
            },
            "destination": {
                "address": destination
            },
            "travelMode": "DRIVE",
            "computeAlternativeRoutes": alternatives,
            "routingPreference": "TRAFFIC_AWARE",
            "units": "METRIC"
        }

        try:
            # Check for placeholder key before making request
            if "your_google_maps_api_key" in self.api_key:
                 raise ValueError("Google Maps API Configuration Error: Default placeholder key in use. Please configure a valid API key.")

            with httpx.Client() as client:
                response = client.post(
                    self.base_url,
                    headers=headers,
                    json=payload,
                    timeout=10.0
                )
                
                if response.status_code != 200:
                    error_msg = f"Routes API Error: {response.status_code}"
                    try:
                        error_details = response.json()
                        if "error" in error_details and "message" in error_details["error"]:
                            error_msg += f" - {error_details['error']['message']}"
                    except:
                        error_msg += f" - {response.text}"
                    raise Exception(error_msg)
                
                data = response.json()
                
                if "routes" not in data:
                     raise ValueError(f"No routes found from {origin} to {destination}")

                parsed_routes = []
                for idx, route in enumerate(data["routes"]):
                    distance = route.get("distanceMeters", 0)
                    duration = self._parse_duration(route.get("duration", "0s"))
                    polyline = route.get("polyline", {}).get("encodedPolyline", "")
                    
                    route_data = {
                        'distance_meters': distance,
                        'duration_seconds': duration,
                        'polyline': polyline,
                        'route_type': 'fastest' if idx == 0 else f'alternative_{idx}',
                        # Routes API doesn't return geocoded addresses in the route object easily
                        # so we essentially echo back inputs or handle this differently if needed.
                        'start_address': origin,
                        'end_address': destination
                    }
                    parsed_routes.append(route_data)
                
                return parsed_routes

        except Exception as e:
            # Re-raise exceptions to be handled by the router
            raise e


# Global client instance
maps_client = GoogleMapsClient()
