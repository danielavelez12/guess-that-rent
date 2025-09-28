# Guess That Rent API

A FastAPI server that fetches rental listings from Airtable.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Airtable credentials and database URL
```

3. Run the server:
```bash
python main.py
```

## Environment Variables

- `AIRTABLE_BASE_ID`: Your Airtable base ID
- `AIRTABLE_TABLE_NAME`: Your table name (default: "Listings")
- `AIRTABLE_API_KEY`: Your Airtable API key
- `PORT`: Server port (default: 8000)
- `DATABASE_URL`: SQLAlchemy URL to your Postgres database

## API Endpoints

- `GET /`: Health check
- `GET /listings`: Fetch all listings from Airtable
- `POST /users`: Create a new user
- `POST /scores`: Create a new score for a user
- `GET /scores/today`: Get all scores created today (Eastern Time)

## Deployment on Render

1. Connect your GitHub repository to Render
2. Set the environment variables in Render dashboard
3. Deploy!

The server will automatically use the PORT environment variable that Render provides.
