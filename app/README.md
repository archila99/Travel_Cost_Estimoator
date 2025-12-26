# Backend API

FastAPI backend for the Travel Cost Estimator application.

## Structure

```
app/
├── models/           # Database models
│   ├── user.py      # User model
│   ├── vehicle.py   # Vehicle model
│   └── trip.py      # Trip model
├── routers/         # API endpoints
│   ├── auth.py      # Authentication endpoints
│   ├── vehicles.py  # Vehicle CRUD
│   ├── trips.py     # Trip CRUD
│   └── routes.py    # Route calculation
├── schemas/         # Pydantic schemas
│   ├── user.py      # User schemas
│   ├── vehicle.py   # Vehicle schemas
│   └── trip.py      # Trip schemas
├── config.py        # App configuration
├── database.py      # Database connection
├── dependencies.py  # Shared dependencies (auth)
└── main.py         # FastAPI application
```

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /token` - Login and get JWT token

### Vehicles
- `GET /vehicles/` - List user's vehicles
- `POST /vehicles/` - Create vehicle
- `GET /vehicles/{id}` - Get vehicle details
- `PUT /vehicles/{id}` - Update vehicle
- `DELETE /vehicles/{id}` - Delete vehicle

### Trips
- `GET /trips/` - List user's trips (paginated)
- `POST /trips/` - Save a trip
- `GET /trips/{id}` - Get trip details
- `DELETE /trips/{id}` - Delete trip
- `GET /trips/vehicle/{vehicle_id}` - Get trips by vehicle

### Routes
- `POST /routes/calculate` - Calculate route and costs

## Running

```bash
# Development
uvicorn app.main:app --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Database connection string
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `SECRET_KEY` - JWT secret key

## Authentication

All endpoints except `/register`, `/token`, and `/health` require JWT authentication.

Include token in requests:
```
Authorization: Bearer <your_jwt_token>
```

## Development

### Adding New Endpoints

1. Create router in `app/routers/`
2. Define schemas in `app/schemas/`
3. Create models if needed in `app/models/`
4. Include router in `app/main.py`

### Database Changes

1. Modify models in `app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review migration in `alembic/versions/`
4. Apply: `alembic upgrade head`
