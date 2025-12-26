# Frontend

React frontend for the Travel Cost Estimator application.

## Structure

```
src/
├── components/       # Reusable components
│   ├── MapDisplay.jsx
│   ├── RouteCalculator.jsx
│   ├── TripHistory.jsx
│   └── VehicleManager.jsx
├── pages/           # Page components
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   └── Register.jsx
├── context/         # React context
│   └── AuthContext.jsx
├── services/        # API services
│   └── api.js
├── App.jsx          # Main app component
├── App.css          # Global styles
└── main.jsx         # Entry point
```

## Features

### Authentication
- Login and registration pages
- JWT token management
- Protected routes
- Auto-logout on 401

### Dashboard
- Route calculator with map
- Vehicle management
- Trip history with pagination
- Save calculated routes

## Running

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Environment Variables

Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Development

### Adding New Components

1. Create component in `src/components/`
2. Import and use in pages
3. Add styles in component or `App.css`

### API Integration

Use the `api` service from `src/services/api.js`:

```javascript
import api from '../services/api';

// Example
const vehicles = await api.getVehicles();
```

### Authentication

Use `AuthContext` for auth state:

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

## Styling

- Uses CSS variables for theming
- Responsive design
- Dark mode support
- Custom components styled in `App.css`

## Build

Production build outputs to `dist/`:
```bash
npm run build
```

Serve with any static file server or integrate with backend.
