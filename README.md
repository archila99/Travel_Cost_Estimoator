# Travel Cost Estimator

A full-stack web application for calculating travel costs and managing trip history with JWT authentication. Built with FastAPI (Python) and React.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.127.0-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)

## Features

### 🔐 Authentication
- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Protected API endpoints
- User-specific data isolation

### 🚗 Vehicle Management
- Add, edit, and delete vehicles
- Track fuel consumption rates
- Manage fuel prices per vehicle

### 🗺️ Route Planning
- Calculate routes using Google Maps API
- Real-time cost estimation based on vehicle fuel consumption
- Interactive map visualization
- Alternative route suggestions
- Save calculated routes to trip history

### 📊 Trip History
- View all saved trips
- Filter by vehicle
- Pagination support
- Delete unwanted trips

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Google Maps API** - Route calculation

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Google Maps JavaScript API** - Map visualization

## Project Structure

```
Travel-Cost-Estimator/
├── app/                    # Backend application
│   ├── models/            # SQLAlchemy models
│   ├── routers/           # API endpoints
│   ├── schemas/           # Pydantic schemas
│   ├── config.py          # Configuration
│   ├── database.py        # Database setup
│   ├── dependencies.py    # Auth dependencies
│   └── main.py           # FastAPI app
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Auth context
│   │   └── services/     # API service
│   └── index.html
├── alembic/              # Database migrations
├── tests/                # Test files
├── requirements.txt      # Python dependencies
└── .env.example         # Environment variables template
```

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Google Maps API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Travel-Cost-Estimator.git
cd Travel-Cost-Estimator
```

2. **Set up backend**
```bash
# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your Google Maps API key and SECRET_KEY
```

3. **Set up frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Add your Google Maps API key to .env.local
```

4. **Initialize database**
```bash
# From project root
alembic upgrade head
```

### Running the Application

1. **Start backend** (from project root)
```bash
source venv/bin/activate
uvicorn app.main:app --reload
```
Backend runs on http://localhost:8000

2. **Start frontend** (in new terminal)
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

3. **Access the application**
- Open http://localhost:5173
- Register a new account
- Start adding vehicles and calculating routes!

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./travel_estimator.db
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SECRET_KEY=your_secret_key_for_jwt
```

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

```bash
# Backend tests
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Set environment variables for production
3. Run backend with production server (e.g., Gunicorn)
4. Serve frontend build files with nginx or similar

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Google Maps API for route calculation and visualization
- FastAPI for the excellent Python web framework
- React community for the amazing ecosystem
