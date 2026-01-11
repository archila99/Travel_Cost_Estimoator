import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to allow importing app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env explicitly
load_dotenv()

key = os.getenv("GOOGLE_MAPS_API_KEY")

print(f"GOOGLE_MAPS_API_KEY is {'Set' if key else 'Not Set'}")
if key:
    print(f"Key length: {len(key)}")
    print(f"Key preview: {key[:4]}...{key[-4:]}")
else:
    print("WARNING: Key is missing!")
    sys.exit(1)

from app.services.maps_client import maps_client

print("\nAttempting to fetch directions...")
try:
    routes = maps_client.get_directions(
        origin="New York, NY",
        destination="Boston, MA"
    )
    print(f"Success! Found {len(routes)} routes.")
    print(f"Route 1 distance: {routes[0]['distance_meters']} meters")
except Exception as e:
    print(f"\nERROR: API Call Failed!")
    print(f"Details: {e}")
