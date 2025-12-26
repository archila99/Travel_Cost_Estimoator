import { useState, useEffect } from 'react';
import api from '../services/api';
import MapDisplay from './MapDisplay';

export default function RouteCalculator() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        vehicle_id: '',
        alternatives: false
    });

    useEffect(() => {
        loadVehicles();
    }, []);

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

        if (!formData.vehicle_id) {
            setError('Please add a vehicle first');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await api.calculateRoute({
                origin: formData.origin,
                destination: formData.destination,
                vehicle_id: parseInt(formData.vehicle_id),
                alternatives: formData.alternatives
            });

            setResult(data);
        } catch (err) {
            setError('Failed to calculate route: ' + err.message);
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

    const handleSaveTrip = async () => {
        if (!result || result.routes.length === 0) return;

        try {
            // Save the recommended route (first route)
            const route = result.routes[0];
            await api.createTrip({
                vehicle_id: parseInt(formData.vehicle_id),
                origin: formData.origin,
                destination: formData.destination,
                distance_km: route.distance_km,
                duration_minutes: route.duration_minutes,
                fuel_used_liters: route.fuel_used_liters,
                fuel_cost: route.fuel_cost,
                route_type: route.route_type
            });

            alert('Trip saved successfully! Check your Trip History.');
        } catch (err) {
            setError('Failed to save trip: ' + err.message);
        }
    };

    const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id));

    return (
        <div>
            <div className="card mb-3">
                <div className="card-header">
                    <h3 className="card-title">Calculate Route</h3>
                    <p className="card-description">
                        Enter your origin and destination to calculate travel costs
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {vehicles.length === 0 ? (
                    <div className="alert alert-info">
                        Please add a vehicle first before calculating routes.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Origin</label>
                                <input
                                    type="text"
                                    name="origin"
                                    className="form-input"
                                    placeholder="e.g., New York, NY"
                                    value={formData.origin}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Destination</label>
                                <input
                                    type="text"
                                    name="destination"
                                    className="form-input"
                                    placeholder="e.g., Boston, MA"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Vehicle</label>
                            <select
                                name="vehicle_id"
                                className="form-select"
                                value={formData.vehicle_id}
                                onChange={handleChange}
                                required
                            >
                                {vehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} ({vehicle.fuel_consumption} L/100km)
                                    </option>
                                ))}
                            </select>
                        </div>

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

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Calculating...' : 'Calculate Route'}
                            </button>

                            {result && (
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleSaveTrip}
                                    style={{ flex: 1 }}
                                >
                                    💾 Save Trip
                                </button>
                            )}
                        </div>
                    </form>
                )}
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
                            origin={result.origin}
                            destination={result.destination}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
