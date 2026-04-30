import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import VehicleManager from '../components/VehicleManager';
import RouteCalculator from '../components/RouteCalculator';
import TripHistory from '../components/TripHistory';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('route');
    const { user, logout } = useAuth();
    const [backendStatus, setBackendStatus] = useState({ state: 'checking', message: 'Checking server…' });
    const [probeNonce, setProbeNonce] = useState(0);

    const healthUrl = useMemo(() => {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const trimmed = base.replace(/\/+$/, '');
        const origin = trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
        return `${origin}/health`;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const fetchWithTimeout = async (url, timeoutMs) => {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await fetch(url, { signal: controller.signal, cache: 'no-store' });
            } finally {
                clearTimeout(t);
            }
        };

        const probe = async () => {
            // Render cold starts commonly take ~10–30s; we retry with gentle backoff.
            const delays = [0, 1000, 2000, 3000, 5000, 8000, 13000];
            for (let i = 0; i < delays.length; i++) {
                if (cancelled) return;
                if (delays[i] > 0) await sleep(delays[i]);

                try {
                    const res = await fetchWithTimeout(healthUrl, 5000);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json().catch(() => ({}));
                    if (cancelled) return;
                    setBackendStatus({ state: 'ready', message: data?.status === 'healthy' ? 'Server ready' : 'Server responding' });
                    return;
                } catch (e) {
                    if (cancelled) return;
                    setBackendStatus({
                        state: 'waking',
                        message: 'Waking up server… (Render cold start)',
                    });
                }
            }

            if (!cancelled) {
                setBackendStatus({ state: 'down', message: 'Server still starting or unreachable. Please retry.' });
            }
        };

        probe();
        return () => {
            cancelled = true;
        };
    }, [healthUrl, probeNonce]);

    return (
        <div className="app">
            <header className="app-header">
                <div className="container">
                    <div className="header-content">
                        <div className="header-brand">
                            <h1 className="app-title">Route Planner & Cost Estimator</h1>
                        </div>
                        <div className="header-actions">
                            {backendStatus.state !== 'ready' && (
                                <span className={`status-badge status-${backendStatus.state}`}>
                                    {backendStatus.message}
                                    {backendStatus.state === 'down' && (
                                        <button
                                            type="button"
                                            className="status-retry"
                                            onClick={() => {
                                                setBackendStatus({ state: 'checking', message: 'Checking server…' });
                                                setProbeNonce((n) => n + 1);
                                            }}
                                        >
                                            Retry
                                        </button>
                                    )}
                                </span>
                            )}
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
