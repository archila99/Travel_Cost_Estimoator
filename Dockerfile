# Build Stage: Frontend
FROM node:18-alpine as frontend_build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
# Build with /api prefix for production
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Run Stage: Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy built frontend assets
COPY --from=frontend_build /frontend/dist /app/static

# Copy entrypoint script
COPY scripts/entrypoint.sh /app/scripts/
RUN chmod +x /app/scripts/entrypoint.sh

# Expose port
EXPOSE 8080

# Use entrypoint script to run migrations
ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# Run with Gunicorn (production server)
# Use the PORT environment variable for Cloud Run
CMD gunicorn --bind :$PORT --workers 1 --worker-class uvicorn.workers.UvicornWorker --threads 8 app.main:app
