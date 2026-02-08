import { useState } from 'react';
import { Link } from 'react-router-dom';
import VehicleManager from '../components/VehicleManager';
import RouteCalculator from '../components/RouteCalculator';
import TripHistory from '../components/TripHistory';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('route');
    const { user, logout } = useAuth();

    return (
        <div className="app">
            <header className="app-header">
                <div className="container">
                    <div className="header-content">
                        <div className="header-brand">
                            <h1 className="app-title">Route Planner & Cost Estimator</h1>
                        </div>
                        <div className="header-actions">
                            {user ? (
                                <>
                                    <span className="header-email">{user.email}</span>
                                    <button
                                        onClick={logout}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="btn btn-sm btn-ghost">Log in</Link>
                                    <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container">
                <nav className="nav-tabs">
                    <button
                        className={`nav-tab ${activeTab === 'route' ? 'active' : ''}`}
                        onClick={() => setActiveTab('route')}
                    >
                        🗺️ Route Planner
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vehicles')}
                    >
                        🚗 Vehicles
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        📊 Trip History
                    </button>
                </nav>

                <div className="app-content">
                    {activeTab === 'route' && <RouteCalculator />}
                    {activeTab === 'vehicles' && (
                        user ? <VehicleManager /> : (
                            <div className="card">
                                <p className="card-description">Log in to add and manage vehicles, then save your trips.</p>
                                <Link to="/login" className="btn btn-primary">Log in</Link>
                            </div>
                        )
                    )}
                    {activeTab === 'history' && (
                        user ? <TripHistory /> : (
                            <div className="card">
                                <p className="card-description">Log in to view and save your trip history.</p>
                                <Link to="/login" className="btn btn-primary">Log in</Link>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
