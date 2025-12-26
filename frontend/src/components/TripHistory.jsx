import { useState, useEffect } from 'react';
import api from '../services/api';

export default function TripHistory() {
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState('all');
    const [page, setPage] = useState(1);
    const [totalTrips, setTotalTrips] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        loadTrips();
    }, [selectedVehicle, page]);

    const loadVehicles = async () => {
        try {
            const data = await api.getVehicles();
            setVehicles(data);
        } catch (err) {
            console.error('Failed to load vehicles:', err);
        }
    };

    const loadTrips = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * pageSize;

            let data;
            if (selectedVehicle === 'all') {
                data = await api.getTrips(skip, pageSize);
                setTrips(data.trips);
                setTotalTrips(data.total);
            } else {
                const tripsList = await api.getTripsByVehicle(parseInt(selectedVehicle), skip, pageSize);
                setTrips(tripsList);
                setTotalTrips(tripsList.length);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load trips: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getVehicleName = (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.name : `Vehicle #${vehicleId}`;
    };

    const handleDeleteTrip = async (tripId) => {
        if (!window.confirm('Are you sure you want to delete this trip?')) {
            return;
        }

        try {
            await api.deleteTrip(tripId);
            setTrips(trips.filter(t => t.id !== tripId));
            setTotalTrips(prev => prev - 1);
        } catch (err) {
            console.error('Failed to delete trip:', err);
            setError('Failed to delete trip. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalPages = Math.ceil(totalTrips / pageSize);

    if (loading && trips.length === 0) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 className="card-title">Trip History</h3>
                        <p className="card-description">
                            {totalTrips} trip{totalTrips !== 1 ? 's' : ''} recorded
                        </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                        <select
                            className="form-select"
                            value={selectedVehicle}
                            onChange={(e) => {
                                setSelectedVehicle(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Vehicles</option>
                            {vehicles.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {trips.length === 0 ? (
                <p className="text-muted text-center" style={{ padding: '3rem' }}>
                    No trips found. Calculate your first route to see it here!
                </p>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500' }}>Vehicle</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500' }}>Route</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '500' }}>Distance</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '500' }}>Duration</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '500' }}>Fuel</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '500' }}>Cost</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trips.map((trip) => (
                                    <tr
                                        key={trip.id}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            transition: 'var(--transition)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {formatDate(trip.created_at)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className="badge badge-primary">
                                                {getVehicleName(trip.vehicle_id)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div style={{ fontWeight: '500' }}>{trip.origin}</div>
                                                <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                    → {trip.destination}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                            {trip.distance_km.toFixed(1)} km
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                            {Math.floor(trip.duration_minutes / 60)}h {Math.round(trip.duration_minutes % 60)}m
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                            {trip.fuel_used_liters.toFixed(2)} L
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '1.125rem' }}>
                                            ${trip.fuel_cost.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                className="btn btn-sm"
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.75rem'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTrip(trip.id);
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
