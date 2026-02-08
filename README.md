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
- **Alembic** - Optional: for future schema migrations (fresh deploys use `create_all()`)
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
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
(The API base URL must include `/api` because the backend mounts all API routes under that prefix.)

## Database and migrations

- **Fresh installs / Cloud Run:** The app creates tables on startup via `Base.metadata.create_all()`. No migration step is run in the container.
- **Alembic** is kept for future schema changes (e.g. adding a column without wiping the DB). When you need it: run `alembic upgrade head` locally or in a one-off job against your DB, or add it back to the deploy flow.

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Create new migration (when you change models and need to migrate existing DBs)
alembic revision --autogenerate -m "description"

# Apply migrations (local or when managing an existing DB)
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

**This project does not use GitHub Actions.** Deploy from your machine using `deploy.sh` only.

### Deploy to Google Cloud (`deploy.sh`)

The script builds the Docker image, pushes it to Artifact Registry, and deploys to **Cloud Run** with **Cloud SQL (PostgreSQL)**.

**1. One-time setup**

- Install and log in to [Google Cloud SDK](https://cloud.google.com/sdk/docs/install):
  ```bash
  gcloud auth login
  gcloud config set project YOUR_PROJECT_ID
  ```
- Create Cloud SQL and Artifact Registry (once per project):
  ```bash
  ./scripts/setup_gcp_resources.sh
  ```
  **Save the DB password** printed when the database is created.

**2. Configure and deploy**

Put your secrets in `.env` at the project root (see `.env.example`). `deploy.sh` loads `.env` automatically, so you don’t need to export variables each time:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
DB_PASSWORD=password_from_setup_script
```

Then from the project root:

```bash
./deploy.sh
```

Optional: set `REGION`, `REGISTRATION_KEY`, or `SECRET_KEY` in `.env` or export them before `./deploy.sh` if you need to override defaults.

**3. Result**

The script prints the Cloud Run service URL. Open it in a browser to use the app.

---

### Using Docker (local)
```bash
docker-compose up -d
```

### Manual deployment (generic)
1. Build frontend: `cd frontend && npm run build`
2. Set environment variables for production
3. Run backend with production server (e.g., Gunicorn)
4. Serve frontend build files with nginx or similar

## Updating GitHub

- **Push your changes** (README, code, removal of old files):
  ```bash
  git add .
  git status
  git commit -m "Your message"
  git push origin main
  ```

- **Remove a file from the repo** (e.g. an old workflow file that’s already deleted locally):
  ```bash
  git rm --cached path/to/file
  git commit -m "Remove file from repo"
  git push origin main
  ```
  If the file is already deleted locally, `git status` will show it as deleted; run `git add -A` or `git add path/to/file`, then commit and push.

- **Remove a file that still exists locally** so it’s no longer tracked and not on GitHub:
  ```bash
  git rm path/to/file
  git commit -m "Remove file"
  git push origin main
  ```

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
