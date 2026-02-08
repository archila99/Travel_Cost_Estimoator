#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

REGION="us-central1"
DB_INSTANCE_NAME="travel-estimator-db"
DB_NAME="travel_estimator"
REPO_NAME="travel-repo"

# Fail fast if billing is not enabled
if ! gcloud beta billing projects describe "$PROJECT_ID" &>/dev/null; then
  echo "❌ Billing is not enabled for this project."
  echo "   Link a billing account (new accounts get free credit):"
  echo "   https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
  exit 1
fi

echo "🚀 Starting Resource Setup for Project: $PROJECT_ID"

# 1. Enable APIs
echo "Enable required APIs..."
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com compute.googleapis.com

# 2. Create Artifact Registry
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    echo "Creating Artifact Registry..."
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository"
else
    echo "Artifact Registry '$REPO_NAME' already exists."
fi

# 3. Cloud SQL Setup
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
    
    echo "✅ Database created."
    echo "---------------------------------------------------"
    echo "SAVE THIS PASSWORD for deploy.sh:"
    echo "  export DB_PASSWORD='$DB_PASSWORD'"
else
    echo "Cloud SQL instance already exists."
    echo "If you don't have the password, you may need to reset it."
fi

# Ensure the database exists (create if missing, e.g. instance was created outside this script)
if gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE_NAME &>/dev/null; then
    echo "Database '$DB_NAME' already exists."
else
    echo "Creating database '$DB_NAME'..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
    echo "✅ Database created."
fi

# Get Connection Name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
echo "DATABASE_URL usage (for secrets): postgresql+psycopg2://postgres:<DB_PASSWORD>@/$DB_NAME?host=/cloudsql/$INSTANCE_CONNECTION_NAME"

echo "---------------------------------------------------"
echo "Setup Complete!"
