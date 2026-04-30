import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MapDisplay from './MapDisplay';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FUEL_CONSUMPTION = 7;
const DEFAULT_FUEL_PRICE = 1.5;

export default function RouteCalculator() {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({ origin: null, destination: null });

    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        vehicle_id: '',
        fuel_consumption: DEFAULT_FUEL_CONSUMPTION,
        fuel_price: DEFAULT_FUEL_PRICE,
        alternatives: false
    });

    useEffect(() => {
        if (user) loadVehicles();
    }, [user]);

    const loadVehicles = async () => {
        try {
            const data = await api.getVehicles();
            setVehicles(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, vehicle_id: data[0].id }));
            }
        } catch (err) {
            setError('Failed to load vehicles: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({ origin: null, destination: null });
        try {
            setLoading(true);
            const origin = (formData.origin || '').trim();
            const destination = (formData.destination || '').trim();
            const payload = {
                origin,
                destination,
                alternatives: formData.alternatives
            };
            if (user && formData.vehicle_id) {
                payload.vehicle_id = parseInt(formData.vehicle_id);
            } else {
                payload.fuel_consumption = Number(formData.fuel_consumption) || DEFAULT_FUEL_CONSUMPTION;
                payload.fuel_price = Number(formData.fuel_price) || DEFAULT_FUEL_PRICE;
            }
            const data = await api.calculateRoute(payload);
            setResult(data);
        } catch (err) {
            const detail = err?.detail;
            const code = typeof detail === 'object' && detail ? detail.error : null;
            const msg = err?.message || 'Unknown error';

            if (code === 'INVALID_LOCATION') {
                if (detail?.field === 'origin') setFieldErrors((p) => ({ ...p, origin: detail.message }));
                if (detail?.field === 'destination') setFieldErrors((p) => ({ ...p, destination: detail.message }));
                if (!detail?.field) setError(detail?.message || 'Please enter valid locations.');
            } else if (code === 'ROUTE_NOT_AVAILABLE') {
                setError('This route is not drivable. Please try different locations.');
            } else if (code === 'VALIDATION_ERROR') {
                setError(detail?.message || 'Please check your inputs.');
            } else if (code === 'ROUTING_TIMEOUT') {
                setError('Routing service timed out. Please try again.');
            } else if (code === 'ROUTING_SERVICE_ERROR') {
                setError('Routing service is unavailable. Please try again later.');
            } else {
                // Fallback (avoid technical details)
                setError('Failed to calculate route. Please try again.');
                console.warn('Route calculation error:', msg, detail);
            }
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div>
            <div className="card mb-3">
                <div className="card-header">
                    <h3 className="card-title">Calculate Route</h3>
                    <p className="card-description">
                        {user
                            ? 'Enter origin and destination; your trip is saved when you calculate.'
                            : 'Try it out—enter origin and destination. Log in to save trips and use your vehicles.'}
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {user && vehicles.length === 0 ? (
                    <div className="alert alert-info">
                        Add a vehicle in the Vehicles tab first, then come back to calculate routes.
                    </div>
                ) : null}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">Origin</label>
                            <input
                                type="text"
                                name="origin"
                                className={`form-input ${fieldErrors.origin ? 'input-error' : ''}`}
                                placeholder="e.g., New York, NY"
                                value={formData.origin}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.origin && (
                                <div className="field-error">{fieldErrors.origin}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Destination</label>
                            <input
                                type="text"
                                name="destination"
                                className={`form-input ${fieldErrors.destination ? 'input-error' : ''}`}
                                placeholder="e.g., Boston, MA"
                                value={formData.destination}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.destination && (
                                <div className="field-error">{fieldErrors.destination}</div>
                            )}
                        </div>
                    </div>

                    {user && vehicles.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Vehicle</label>
                            <select
                                name="vehicle_id"
                                className="form-select"
                                value={formData.vehicle_id}
                                onChange={handleChange}
                            >
                                {vehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} ({vehicle.fuel_consumption} L/100km)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!user && (
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Fuel consumption (L/100km)</label>
                                <input
                                    type="number"
                                    name="fuel_consumption"
                                    className="form-input"
                                    min="1"
                                    max="50"
                                    step="0.5"
                                    value={formData.fuel_consumption}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fuel price (£/L)</label>
                                <input
                                    type="number"
                                    name="fuel_price"
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    value={formData.fuel_price}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                name="alternatives"
                                checked={formData.alternatives}
                                onChange={handleChange}
                            />
                            <span>Show alternative routes</span>
                        </label>
                    </div>

                    <div className="route-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || (user && vehicles.length === 0)}
                        >
                            {loading ? 'Calculating...' : 'Calculate Route'}
                        </button>
                        {result && result.trip_id && (
                            <span className="alert alert-info saved-badge">✓ Saved to Trip History</span>
                        )}
                        {result && !user && (
                            <span className="alert alert-info saved-badge">
                                <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to save trips
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {result && (
                <>
                    <div className="card mb-3">
                        <div className="card-header">
                            <h3 className="card-title">Route Options</h3>
                            <p className="card-description">
                                {result.routes.length} route{result.routes.length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        <div className="grid grid-3">
                            {result.routes.map((route, index) => (
                                <div
                                    key={index}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        padding: '1.5rem',
                                        borderRadius: 'var(--border-radius)',
                                        border: index === 0 ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                        position: 'relative'
                                    }}
                                >
                                    {index === 0 && (
                                        <span
                                            className="badge badge-primary"
                                            style={{ position: 'absolute', top: '1rem', right: '1rem' }}
                                        >
                                            Recommended
                                        </span>
                                    )}

                                    <h4 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                                        {route.route_type.replace('_', ' ')}
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Distance</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                                {route.distance_km.toFixed(1)} km
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Duration</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                                {Math.floor(route.duration_minutes / 60)}h {Math.round(route.duration_minutes % 60)}m
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Fuel Used</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                                {route.fuel_used_liters.toFixed(2)} L
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                marginTop: '0.5rem',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Cost</div>
                                            <div
                                                style={{
                                                    fontSize: '1.75rem',
                                                    fontWeight: '700',
                                                    background: 'var(--primary-gradient)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}
                                            >
                                                ${route.fuel_cost.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Route Map</h3>
                            <p className="card-description">
                                Visual representation of your route{result.routes.length > 1 ? 's' : ''}
                            </p>
                        </div>

                        <MapDisplay
                            routes={result.routes}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
