const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
    getToken() {
        return localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                // Auto logout on 401 could be handled here or in UI
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Request failed' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        // Form data for OAuth2
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return this.request('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });
    }

    async register(email, password) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    // Vehicle endpoints
    async getVehicles() {
        return this.request('/vehicles/');
    }

    async getVehicle(id) {
        return this.request(`/vehicles/${id}`);
    }

    async createVehicle(data) {
        return this.request('/vehicles/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateVehicle(id, data) {
        return this.request(`/vehicles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteVehicle(id) {
        return this.request(`/vehicles/${id}`, {
            method: 'DELETE',
        });
    }

    // Route endpoints
    async calculateRoute(data) {
        return this.request('/routes/calculate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Trip endpoints
    async getTrips(skip = 0, limit = 50) {
        return this.request(`/trips/?skip=${skip}&limit=${limit}`);
    }

    async createTrip(data) {
        return this.request('/trips/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getTrip(id) {
        return this.request(`/trips/${id}`);
    }

    async getTripsByVehicle(vehicleId, skip = 0, limit = 50) {
        return this.request(`/trips/vehicle/${vehicleId}?skip=${skip}&limit=${limit}`);
    }

    async deleteTrip(id) {
        return this.request(`/trips/${id}`, {
            method: 'DELETE',
        });
    }
}

export default new ApiService();
