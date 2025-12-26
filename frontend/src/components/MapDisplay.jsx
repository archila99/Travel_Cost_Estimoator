import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapDisplay({ routes, origin, destination }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const polylinesRef = useRef([]);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        initializeMap();
    }, []);

    useEffect(() => {
        if (isMapReady && mapInstanceRef.current && routes && routes.length > 0) {
            displayRoutes();
        }
    }, [isMapReady, routes, origin, destination]);

    const initializeMap = async () => {
        const loader = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: 'weekly',
            libraries: ['geometry', 'marker']
        });

        try {
            const google = await loader.load();

            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
                center: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
                zoom: 12,
                mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
                styles: [
                    {
                        featureType: 'all',
                        elementType: 'geometry',
                        stylers: [{ color: '#242f3e' }]
                    },
                    {
                        featureType: 'all',
                        elementType: 'labels.text.stroke',
                        stylers: [{ color: '#242f3e' }]
                    },
                    {
                        featureType: 'all',
                        elementType: 'labels.text.fill',
                        stylers: [{ color: '#746855' }]
                    },
                    {
                        featureType: 'water',
                        elementType: 'geometry',
                        stylers: [{ color: '#17263c' }]
                    }
                ]
            });
            setIsMapReady(true);
        } catch (error) {
            console.error('Error loading Google Maps:', error);
        }
    };

    const displayRoutes = async () => {
        const google = window.google;
        if (!google || !mapInstanceRef.current) return;

        // Clear existing markers and polylines
        markersRef.current.forEach(marker => { marker.map = null; });
        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        markersRef.current = [];
        polylinesRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

        // Draw each route
        routes.forEach((route, index) => {
            if (!route.polyline) return;

            // Decode polyline
            const path = google.maps.geometry.encoding.decodePath(route.polyline);

            // Create polyline
            const polyline = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: colors[index % colors.length],
                strokeOpacity: index === 0 ? 1.0 : 0.6,
                strokeWeight: index === 0 ? 5 : 3,
                map: mapInstanceRef.current
            });

            polylinesRef.current.push(polyline);

            // Extend bounds
            path.forEach(point => bounds.extend(point));

            // Add markers for the first route
            if (index === 0 && path.length > 0) {
                const { AdvancedMarkerElement, PinElement } = google.maps.marker;

                // Origin pin
                const originPin = new PinElement({
                    background: '#10B981',
                    borderColor: '#ffffff',
                    glyphColor: '#ffffff',
                    glyph: 'A'
                });

                const originMarker = new AdvancedMarkerElement({
                    position: path[0],
                    map: mapInstanceRef.current,
                    title: 'Origin',
                    content: originPin.element
                });

                // Destination pin
                const destPin = new PinElement({
                    background: '#EF4444',
                    borderColor: '#ffffff',
                    glyphColor: '#ffffff',
                    glyph: 'B'
                });

                const destMarker = new AdvancedMarkerElement({
                    position: path[path.length - 1],
                    map: mapInstanceRef.current,
                    title: 'Destination',
                    content: destPin.element
                });

                markersRef.current.push(originMarker, destMarker);
            }
        });

        // Fit map to bounds
        if (!bounds.isEmpty()) {
            mapInstanceRef.current.fitBounds(bounds);
        }
    };

    return (
        <div className="map-container" ref={mapRef}></div>
    );
}
