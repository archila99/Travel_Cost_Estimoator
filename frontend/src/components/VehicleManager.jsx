import { useState, useEffect } from 'react';
import api from '../services/api';

export default function VehicleManager() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        fuel_type: 'petrol',
        fuel_consumption: '',
        fuel_price: ''
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await api.getVehicles();
            setVehicles(data);
            setError(null);
        } catch (err) {
            setError('Failed to load vehicles: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await api.updateVehicle(editingId, formData);
                setSuccess('Vehicle updated successfully!');
            } else {
                await api.createVehicle(formData);
                setSuccess('Vehicle created successfully!');
            }

            resetForm();
            loadVehicles();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to save vehicle: ' + err.message);
        }
    };

    const handleEdit = (vehicle) => {
        setFormData({
            name: vehicle.name,
            fuel_type: vehicle.fuel_type,
            fuel_consumption: vehicle.fuel_consumption,
            fuel_price: vehicle.fuel_price
        });
        setEditingId(vehicle.id);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;

        try {
            await api.deleteVehicle(id);
            setSuccess('Vehicle deleted successfully!');
            loadVehicles();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to delete vehicle: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            fuel_type: 'petrol',
            fuel_consumption: '',
            fuel_price: ''
        });
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-2">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h3>
                    <p className="card-description">
                        {editingId ? 'Update vehicle information' : 'Create a new vehicle for route calculations'}
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Vehicle Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="e.g., Toyota Camry 2020"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fuel Type</label>
                        <select
                            name="fuel_type"
                            className="form-select"
                            value={formData.fuel_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="electric">Electric</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fuel Consumption (L/100km)</label>
                        <input
                            type="number"
                            name="fuel_consumption"
                            className="form-input"
                            placeholder="e.g., 7.5"
                            step="0.1"
                            min="0"
                            value={formData.fuel_consumption}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fuel Price (per liter)</label>
                        <input
                            type="number"
                            name="fuel_price"
                            className="form-input"
                            placeholder="e.g., 1.50"
                            step="0.01"
                            min="0"
                            value={formData.fuel_price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            {editingId ? 'Update Vehicle' : 'Add Vehicle'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Your Vehicles</h3>
                    <p className="card-description">
                        {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
                    </p>
                </div>

                {vehicles.length === 0 ? (
                    <p className="text-muted text-center" style={{ padding: '2rem' }}>
                        No vehicles yet. Add your first vehicle to get started!
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {vehicles.map(vehicle => (
                            <div
                                key={vehicle.id}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    padding: '1.25rem',
                                    borderRadius: 'var(--border-radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ marginBottom: '0.5rem' }}>{vehicle.name}</h4>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                            <span className="badge badge-primary">{vehicle.fuel_type}</span>
                                            <span className="badge badge-success">{vehicle.fuel_consumption} L/100km</span>
                                            <span className="badge badge-warning">${vehicle.fuel_price}/L</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleEdit(vehicle)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(vehicle.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
