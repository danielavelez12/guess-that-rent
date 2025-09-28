from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Guess That Rent API", version="1.0.0")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Airtable configuration
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME", "Listings")
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")

AIRTABLE_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"

@app.get("/")
async def root():
    return {"message": "Guess That Rent API is running!"}

@app.get("/listings")
async def get_listings():
    """
    Fetch all listings from Airtable
    """
    if not AIRTABLE_BASE_ID or not AIRTABLE_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Airtable configuration missing. Please set AIRTABLE_BASE_ID and AIRTABLE_API_KEY environment variables."
        )
    
    headers = {
        "Authorization": f"Bearer {AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Fetch first 3 records from Airtable (default view order)
        params = {"maxRecords": 3}
        response = requests.get(AIRTABLE_URL, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Transform the data to a cleaner format
        listings = []
        for record in data.get("records", []):
            listing = {
                "id": record["id"],
                "fields": record.get("fields", {}),
                "createdTime": record.get("createdTime")
            }
            listings.append(listing)
        
        return {
            "success": True,
            "count": len(listings),
            "listings": listings
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch data from Airtable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
