from typing import List, Dict, Any, Optional
import logging
import httpx
from app.config import settings


class RouteError(Exception):
    """Expected routing failure with a stable error code for the frontend."""

    def __init__(self, code: str, message: str, http_status: int = 400, field: Optional[str] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.field = field


class OpenRouteServiceClient:
    """Client for interacting with OpenRouteService (geocoding + directions)."""
    
    def __init__(self):
        """Initialize the OpenRouteService client with API key."""
        self.api_key = settings.openrouteservice_api_key
        self.directions_url = "https://api.openrouteservice.org/v2/directions/driving-car"
        self.geocode_url = "https://api.openrouteservice.org/geocode/search"
        self._log = logging.getLogger(__name__)

    def _debug_enabled(self) -> bool:
        # Dev-only: set ORS_DEBUG=true in environment to log statuses/coords
        import os
        return os.getenv("ORS_DEBUG", "").strip().lower() in ("1", "true", "yes", "on")
    
    def _parse_duration(self, duration_value) -> int:
        """ORS duration is usually in seconds (float). Keep helper for safety."""
        if duration_value is None:
            return 0
        try:
            return int(float(duration_value))
        except Exception:
            return 0

    def _headers(self) -> Dict[str, str]:
        key = (self.api_key or "").strip()
        if not key:
            raise ValueError(
                "OpenRouteService API Configuration Error: Set a valid OPENROUTESERVICE_API_KEY in the backend environment."
            )
        return {"Authorization": key, "Content-Type": "application/json"}

    def _raise_for_geocode_status(self, status_code: int, field_name: str) -> None:
        if status_code in (400, 404, 422):
            raise RouteError(
                code="INVALID_LOCATION",
                message=f"Please enter a valid {field_name}.",
                http_status=400,
                field=field_name,
            )
        if status_code == 429:
            raise RouteError(
                code="RATE_LIMIT",
                message="Routing service is busy right now. Please try again in a moment.",
                http_status=503,
            )
        if 500 <= status_code <= 599:
            raise RouteError(
                code="ROUTING_SERVICE_ERROR",
                message="Routing service is unavailable. Please try again later.",
                http_status=502,
            )
        # 401/403 and any other unexpected status
        raise RouteError(
            code="ROUTING_SERVICE_ERROR",
            message="Routing service is unavailable. Please try again later.",
            http_status=502,
        )

    def _raise_for_directions_status(self, status_code: int, body: str) -> None:
        if status_code == 429:
            raise RouteError(
                code="RATE_LIMIT",
                message="Routing service is busy right now. Please try again in a moment.",
                http_status=503,
            )
        if 500 <= status_code <= 599:
            raise RouteError(
                code="ROUTING_SERVICE_ERROR",
                message="Routing service is unavailable. Please try again later.",
                http_status=502,
            )

        lower = (body or "").lower()
        if status_code in (400, 404, 422) and (
            "no route" in lower
            or "no rout" in lower
            or "routable point" in lower
            or "could not find" in lower
            or "point not found" in lower
            or "unable to find" in lower
            or ("route" in lower and "found" in lower)
        ):
            raise RouteError(
                code="ROUTE_NOT_AVAILABLE",
                message="This route is not drivable. Please try different locations.",
                http_status=400,
            )

        # Other 4xx
        if 400 <= status_code <= 499:
            raise RouteError(
                code="ROUTING_SERVICE_ERROR",
                message="Routing service is unavailable. Please try again later.",
                http_status=502,
            )

        raise RouteError(
            code="ROUTING_SERVICE_ERROR",
            message="Routing service is unavailable. Please try again later.",
            http_status=502,
        )

    def _geocode(self, text: str, field_name: str) -> list[float]:
        """Geocode a free-text place to ORS coordinates [lon, lat]."""
        cleaned = " ".join((text or "").strip().split())
        if not cleaned:
            raise RouteError(
                code="INVALID_LOCATION",
                message=f"Please enter a valid {field_name}.",
                http_status=400,
                field=field_name,
            )
        params = {"text": cleaned, "size": 1}
        try:
            with httpx.Client(timeout=httpx.Timeout(10.0, read=20.0)) as client:
                res = client.get(
                    self.geocode_url,
                    headers={"Authorization": self._headers()["Authorization"]},
                    params=params,
                )
        except httpx.TimeoutException as e:
            raise RouteError(
                code="ROUTING_TIMEOUT",
                message="Routing service timed out. Please try again.",
                http_status=504,
            ) from e
        except httpx.RequestError as e:
            raise RouteError(
                code="ROUTING_SERVICE_ERROR",
                message="Routing service is unavailable. Please try again later.",
                http_status=502,
            ) from e

        if self._debug_enabled():
            self._log.info("ORS geocode %s status=%s", field_name, res.status_code)

        if res.status_code != 200:
            self._raise_for_geocode_status(res.status_code, field_name)
        data = res.json()
        features = data.get("features") or []
        if not features:
            raise RouteError(
                code="INVALID_LOCATION",
                message=f"Please enter a valid {field_name}.",
                http_status=400,
                field=field_name,
            )
        coords = features[0].get("geometry", {}).get("coordinates")
        if not coords or len(coords) < 2:
            raise RouteError(
                code="INVALID_LOCATION",
                message=f"Please enter a valid {field_name}.",
                http_status=400,
                field=field_name,
            )
        return [float(coords[0]), float(coords[1])]

    def get_directions(
        self,
        origin: str,
        destination: str,
        alternatives: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get directions from origin to destination using OpenRouteService.
        
        Args:
            origin: Starting location (address or coordinates)
            destination: Ending location (address or coordinates)
            alternatives: Whether to return alternative routes
            
        Returns:
            List of route dictionaries containing distance, duration, and polyline
            
        Raises:
            Exception: If the API request fails
        """
        try:
            start = self._geocode(origin, "origin")
            end = self._geocode(destination, "destination")

            if self._debug_enabled():
                self._log.info("ORS coords origin=%s destination=%s", start, end)

            payload: Dict[str, Any] = {"coordinates": [start, end]}
            if alternatives:
                # Ask ORS for up to 3 routes when alternatives are requested.
                payload["alternative_routes"] = {"target_count": 3}

            try:
                with httpx.Client(timeout=httpx.Timeout(10.0, read=30.0)) as client:
                    response = client.post(self.directions_url, headers=self._headers(), json=payload)
            except httpx.TimeoutException as e:
                raise RouteError(
                    code="ROUTING_TIMEOUT",
                    message="Routing service timed out. Please try again.",
                    http_status=504,
                ) from e
            except httpx.RequestError as e:
                raise RouteError(
                    code="ROUTING_SERVICE_ERROR",
                    message="Routing service is unavailable. Please try again later.",
                    http_status=502,
                ) from e

            if self._debug_enabled():
                self._log.info("ORS directions status=%s", response.status_code)

            if response.status_code != 200:
                body = response.text or ""
                try:
                    j = response.json()
                    # ORS errors are often JSON with either "error" or nested messages.
                    if isinstance(j, dict):
                        if isinstance(j.get("error"), str):
                            body = j["error"]
                        elif isinstance(j.get("error"), dict) and isinstance(j["error"].get("message"), str):
                            body = j["error"]["message"]
                        elif isinstance(j.get("message"), str):
                            body = j["message"]
                except Exception:
                    pass
                self._raise_for_directions_status(response.status_code, body)

            data = response.json()

            routes = data.get("routes") or []
            if not routes:
                raise RouteError(
                    code="ROUTE_NOT_AVAILABLE",
                    message="This route is not drivable. Please try different locations.",
                    http_status=400,
                )

            parsed_routes: List[Dict[str, Any]] = []
            for idx, route in enumerate(routes):
                summary = route.get("summary") or {}
                distance = summary.get("distance", 0)
                duration = self._parse_duration(summary.get("duration", 0))
                polyline = route.get("geometry", "")
                parsed_routes.append(
                    {
                        "distance_meters": distance,
                        "duration_seconds": duration,
                        "polyline": polyline,
                        "route_type": "fastest" if idx == 0 else f"alternative_{idx}",
                        "start_address": origin,
                        "end_address": destination,
                    }
                )

            return parsed_routes

        except RouteError:
            raise
        except Exception:
            # Anything unexpected becomes a stable provider error
            raise RouteError(
                code="ROUTING_SERVICE_ERROR",
                message="Routing service is unavailable. Please try again later.",
                http_status=502,
            )


# Global client instance
maps_client = OpenRouteServiceClient()
