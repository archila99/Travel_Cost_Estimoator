# Travel Cost Estimator

A full-stack web app for planning routes and estimating trip costs. Use it as a **guest** (no account) or **log in** to save vehicles and trip history. Built with FastAPI (Python) and React.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.127.0-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)

## Features

### 🔐 Authentication
- Register and log in with JWT (email + password)
- Optional **registration key**: when the server is configured with `REGISTRATION_KEY`, new users must enter that key on the Register form
- Secure password hashing (bcrypt); user-specific data isolation

### 🗺️ Route Planner (works with or without login)
- **Guest:** Enter origin, destination, fuel consumption (L/100km) and fuel price; get route and cost. No account needed; the trip is not saved.
- **Logged in:** Pick a saved vehicle; the primary route is saved to your trip history automatically.
- Google Maps–based routes, distance, duration, fuel use and cost
- Optional alternative routes; interactive map with polyline

### 🚗 Vehicles (login required)
- Add, edit, and delete vehicles
- Per-vehicle fuel type, consumption (L/100km), and fuel price
- Used in Route Planner when logged in

### 📊 Trip History (login required)
- List saved trips with pagination
- Filter by vehicle
- Delete trips

## Tech Stack

### Backend
- **FastAPI** – API and SPA serving (production)
- **SQLAlchemy** – ORM; **PostgreSQL** (production) or **SQLite** (local)
- **Pydantic** – Request/response validation
- **JWT** (python-jose) + **bcrypt** – Auth
- **Google Maps APIs** – Routes/Directions (backend), Maps JS (frontend)
- **Alembic** – Optional migrations (fresh deploys use `create_all()` at startup)

### Frontend
- **React** + **Vite** – SPA; **React Router**
- **Google Maps JavaScript API** – Map and polyline display

## Project Structure

```
Travel-Cost-Estimator/
├── app/                    # Backend
│   ├── models/             # User, Vehicle, Trip
│   ├── routers/            # auth, vehicles, trips, routes
│   ├── schemas/            # Pydantic request/response
│   ├── services/           # route_calculator, cost_estimator, maps_client
│   ├── config.py           # Settings (from env)
│   ├── database.py         # Engine, session
│   ├── dependencies.py     # get_current_user, get_current_user_optional
│   └── main.py             # FastAPI app, CORS, /api/*, static SPA
├── frontend/src/
│   ├── components/         # RouteCalculator, MapDisplay, VehicleManager, TripHistory
│   ├── pages/              # Dashboard, Login, Register
│   ├── context/           # AuthContext
│   └── services/           # api.js (API client)
├── alembic/                # Optional DB migrations
├── scripts/                # setup_gcp_resources.sh, entrypoint.sh
├── deploy.sh               # Build + deploy to Cloud Run
├── Dockerfile              # Single image: backend + built frontend
└── .env.example
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Google Maps API key](https://developers.google.com/maps/documentation) (Routes/Directions and Maps JavaScript APIs enabled)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Travel-Cost-Estimator.git
cd Travel-Cost-Estimator
```

2. **Backend**
```bash
python3.11 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set GOOGLE_MAPS_API_KEY, SECRET_KEY; optional DATABASE_URL (default SQLite)
```

3. **Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000/api  and optionally VITE_GOOGLE_MAPS_API_KEY for the map
```

4. **Database** (optional for local SQLite)
```bash
# From project root
alembic upgrade head
```
Or skip: the app creates tables on startup with `create_all()` if they don’t exist.

### Running locally

1. **Backend** (project root): `uvicorn app.main:app --reload` → http://localhost:8000  
2. **Frontend** (in `frontend/`): `npm run dev` → http://localhost:5173  
3. Open **http://localhost:5173** in the browser. You can use the Route Planner as a guest (no login) or register/log in to save vehicles and trips.

## API

All API routes are under the **`/api`** prefix. Public: `POST /api/register`, `POST /api/token`. Health (no prefix): `GET /health`.

- **Swagger UI**: http://localhost:8000/docs  
- **ReDoc**: http://localhost:8000/redoc  

When deployed (single origin), use the same host, e.g. `https://your-service.run.app/docs`.

## Environment Variables

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (Routes/Directions + Maps JS) |
| `SECRET_KEY` | Yes | JWT signing secret |
| `DATABASE_URL` | No (local) | Default: SQLite. For PostgreSQL: set in deploy or docker-compose |
| `REGISTRATION_KEY` | No | If set, new users must provide this key on the Register form |
| `DB_PASSWORD` | For deploy | Cloud SQL postgres password (used by `deploy.sh`) |

### Frontend (.env.local for dev)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base, e.g. `http://localhost:8000/api` (must end with `/api`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional; for map tiles if different from backend key |

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
# Backend (when tests exist in tests/)
pytest
```
The frontend does not include a test script by default.

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

Optional: set `REGION` or `SECRET_KEY` in `.env` before deploy. **Registration:** leave `REGISTRATION_KEY` unset for open sign-ups; set it (e.g. in `.env`) to restrict registration—then share that value with users and they enter it in the Register form’s “Registration key” field.

**3. Result**

The script prints the Cloud Run service URL. Open it in a browser to use the app.

### Docker (local backend + DB)
```bash
docker-compose up -d
```
Runs PostgreSQL and the FastAPI backend on port 8000. Use the frontend dev server (`cd frontend && npm run dev`) and set `VITE_API_BASE_URL=http://localhost:8000/api` to talk to this backend.

### Production build (single container)
The **Dockerfile** builds the frontend and serves it from the same process as the API (Gunicorn + static files). Used by `deploy.sh` for Cloud Run.

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
