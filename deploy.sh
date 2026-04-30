#!/bin/bash
set -e

# Deploy Travel Cost Estimator to Google Cloud Run (from your machine).
# Prereqs: gcloud CLI installed and logged in (gcloud auth login, gcloud config set project PROJECT_ID)
#
# First-time: run ./scripts/setup_gcp_resources.sh to create DB and Artifact Registry, then run this script.
# Required: set OPENROUTESERVICE_API_KEY and DB_PASSWORD in .env (or export before running).

# Load .env from project root so you don't have to export OPENROUTESERVICE_API_KEY and DB_PASSWORD each time
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$SCRIPT_DIR/.env"
  set +a
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

# Fail fast if billing is not enabled (avoids cryptic API errors later)
if ! gcloud beta billing projects describe "$PROJECT_ID" &>/dev/null; then
  echo "❌ Billing is not enabled for this project."
  echo "   Link a billing account (new accounts get free credit):"
  echo "   https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
  exit 1
fi

REGION="${REGION:-us-central1}"
SERVICE_NAME="travel-estimator"
DB_INSTANCE_NAME="travel-estimator-db"
DB_NAME="travel_estimator"
REPO_NAME="travel-repo"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"

if [ -z "$OPENROUTESERVICE_API_KEY" ]; then
  echo "❌ OPENROUTESERVICE_API_KEY is not set. Export it: export OPENROUTESERVICE_API_KEY='your_key'"
  exit 1
fi

echo "🚀 Deploying to project: $PROJECT_ID (region: $REGION)"

# 1. Enable APIs (idempotent)
echo "Enabling APIs..."
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com compute.googleapis.com --quiet

# 2. Ensure Artifact Registry exists
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
  echo "Creating Artifact Registry..."
  gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository"
fi

# 3. Build and push image (from current directory)
echo "Building and pushing Docker image..."
gcloud builds submit --tag "$IMAGE_TAG" .

# 4. Cloud SQL: get connection name and ensure we have DB_PASSWORD
if ! gcloud sql instances describe $DB_INSTANCE_NAME &>/dev/null; then
  echo "❌ Cloud SQL instance '$DB_INSTANCE_NAME' not found. Run ./scripts/setup_gcp_resources.sh first."
  exit 1
fi

INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ DB_PASSWORD is not set. Set the postgres password for Cloud SQL: export DB_PASSWORD='your_password'"
  echo "   (If you ran setup_gcp_resources.sh when the DB was created, it printed the password.)"
  exit 1
fi

# URL-encode password so special characters (e.g. +, &) don't break DATABASE_URL
DB_PASSWORD_ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")
DATABASE_URL="postgresql+psycopg2://postgres:${DB_PASSWORD_ENCODED}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

# 5. Grant Cloud Run service account access to Cloud SQL (so the container can connect)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "Ensuring Cloud Run can connect to Cloud SQL..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUD_RUN_SA}" \
  --role="roles/cloudsql.client" \
  --quiet 2>/dev/null || true

# 6. Deploy to Cloud Run (generate SECRET_KEY if not set - never use placeholder)
if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "your_secret_key_for_jwt_here" ]; then
  SECRET_KEY=$(openssl rand -hex 32)
  echo "Generated new SECRET_KEY for this deploy (set SECRET_KEY env to reuse across deploys)."
fi

# Registration: set REGISTRATION_KEY in .env to restrict sign-ups (users need the key). Leave unset for open registration.
ENV_VARS="DATABASE_URL=${DATABASE_URL},SECRET_KEY=${SECRET_KEY},OPENROUTESERVICE_API_KEY=${OPENROUTESERVICE_API_KEY}"
if [ -n "${REGISTRATION_KEY:-}" ]; then
  ENV_VARS="${ENV_VARS},REGISTRATION_KEY=${REGISTRATION_KEY}"
  echo "Registration: restricted (REGISTRATION_KEY set). Share the key with users who may register."
else
  echo "Registration: open (no REGISTRATION_KEY set). Set REGISTRATION_KEY in .env to restrict."
fi

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image "$IMAGE_TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$INSTANCE_CONNECTION_NAME" \
  --set-env-vars "$ENV_VARS" \
  --timeout 300 \
  --quiet

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
echo ""
echo "✅ Deployment complete!"
echo "   URL: $SERVICE_URL"
echo "   (SECRET_KEY was generated; set SECRET_KEY env before next deploy to keep the same JWT signing key.)"
