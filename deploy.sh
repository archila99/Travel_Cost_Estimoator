#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="travel-estimator"
DB_INSTANCE_NAME="travel-estimator-db"
DB_NAME="travel_estimator"
REPO_NAME="travel-repo"
IMAGE_NAME="travel-app"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest"

echo "🚀 Starting Deployment for Project: $PROJECT_ID"

# 1. Enable APIs
echo "Enable required APIs..."
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com compute.googleapis.com

# 2. Create Artifact Registry
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    echo "Creating Artifact Registry..."
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository"
fi

# 3. Build & Push Image
echo "Building and Pushing Docker Image..."
gcloud builds submit --tag $IMAGE_TAG

# 4. Cloud SQL Setup
# Check if instance exists
if ! gcloud sql instances describe $DB_INSTANCE_NAME &>/dev/null; then
    echo "Creating Cloud SQL Instance (this may take a few minutes)..."
    # Generating a random password
    DB_PASSWORD=$(openssl rand -base64 12)
    echo "Generated DB Password: $DB_PASSWORD"
    
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$DB_PASSWORD
        
    echo "Creating Database..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
else
    echo "Cloud SQL instance already exists."
    # Prompt for existing password if we didn't create it, or assume it's set in env in a real CI/CD
    # For this script we'll assume the user knows it or we might need to reset/update logic.
    # To keep it simple for now, we warn.
    echo "⚠️  Using existing DB instance. Make sure you set DB_PASSWORD env var if running locally."
fi

# 5. Deploy to Cloud Run
echo "Deploying to Cloud Run..."

# Set a random registration key if not provided
REG_KEY=${REGISTRATION_KEY:-$(openssl rand -hex 16)}
echo "🔑 Registration Key: $REG_KEY"

# Retrieve the connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")

# Deploy
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
    --set-env-vars "DATABASE_URL=postgresql+psycopg2://postgres:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$INSTANCE_CONNECTION_NAME" \
    --set-env-vars "SECRET_KEY=$(openssl rand -hex 32)" \
    --set-env-vars "REGISTRATION_KEY=$REG_KEY" \
    --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID"

echo "✅ Deployment Complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')"
echo "Registration Key used: $REG_KEY"
