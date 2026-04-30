import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import polyline from 'polyline';

function FitBounds({ points }) {
    const map = useMap();
    useEffect(() => {
        if (!points || points.length < 2) return;
        // Leaflet expects [lat, lng]
        map.fitBounds(points, { padding: [24, 24] });
    }, [map, points]);
    return null;
}

export default function MapDisplay({ routes }) {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

    const decodedRoutes = useMemo(() => {
        if (!routes || routes.length === 0) return [];
        return routes
            .filter((r) => r?.polyline)
            .map((r) => ({
                ...r,
                points: polyline.decode(r.polyline).map(([lat, lng]) => [lat, lng]),
            }));
    }, [routes]);

    const primary = decodedRoutes[0];
    const primaryPoints = primary?.points || null;

    return (
        <div className="map-container">
            <MapContainer
                center={[51.5074, -0.1278]} // London default
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {decodedRoutes.map((route, idx) => (
                    <Polyline
                        key={idx}
                        positions={route.points}
                        pathOptions={{
                            color: colors[idx % colors.length],
                            weight: idx === 0 ? 5 : 3,
                            opacity: idx === 0 ? 1 : 0.6,
                        }}
                    />
                ))}

                {primaryPoints && primaryPoints.length > 0 && (
                    <>
                        <Marker position={primaryPoints[0]} />
                        <Marker position={primaryPoints[primaryPoints.length - 1]} />
                        <FitBounds points={primaryPoints} />
                    </>
                )}
            </MapContainer>
        </div>
    );
}
