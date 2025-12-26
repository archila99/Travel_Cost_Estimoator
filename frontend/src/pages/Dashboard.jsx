import { useState } from 'react';
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
                        <div style={{ flex: 1 }}>
                            <h1 className="app-title">Route Planner & Cost Estimator</h1>
                            <p className="app-subtitle">Calculate your travel costs with real-time route visualization</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                            <span>{user?.email}</span>
                            <button
                                onClick={logout}
                                className="btn btn-sm"
                                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                            >
                                Logout
                            </button>
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
                    {activeTab === 'vehicles' && <VehicleManager />}
                    {activeTab === 'history' && <TripHistory />}
                </div>
            </main>
        </div>
    );
}
