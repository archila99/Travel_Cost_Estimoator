# Backend-only image (frontend is deployed separately to Vercel)
FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2 (Postgres)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render sets PORT; bind to it (fallback for local docker runs).
ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --worker-class uvicorn.workers.UvicornWorker --timeout 120 app.main:app"]
