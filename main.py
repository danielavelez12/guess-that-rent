from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, String, DateTime, func, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Mapped, mapped_column, Session
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from zoneinfo import ZoneInfo
import uuid
import datetime

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

DATABASE_URL = os.getenv("DATABASE_URL")
DB_SCHEMA = os.getenv("DB_SCHEMA", "public")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]
engine = create_engine(DATABASE_URL) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": DB_SCHEMA}
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class CreateUserRequest(BaseModel):
    username: str

class Score(Base):
    __tablename__ = "score"
    __table_args__ = {"schema": DB_SCHEMA}
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DB_SCHEMA}.users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    score_value: Mapped[int] = mapped_column(Integer, nullable=False)

class CreateScoreRequest(BaseModel):
    user_id: uuid.UUID
    score_value: int

def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    if engine is None:
        return
    Base.metadata.create_all(bind=engine)

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

@app.post("/users")
async def create_user(payload: CreateUserRequest, request: Request, db: Session = Depends(get_db)):
    client_host = request.client.host if request.client else ""
    user = User(username=payload.username, ip_address=client_host)
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists")
    return {
        "id": str(user.id),
        "username": user.username,
        "ip_address": user.ip_address,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }

@app.get("/users/by-username/{username}")
async def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user.id),
        "username": user.username,
        "ip_address": user.ip_address,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }

@app.get("/scores/today")
async def get_today_scores(db: Session = Depends(get_db)):
    now_et = datetime.datetime.now(ZoneInfo("America/New_York"))
    start_et = now_et.replace(hour=0, minute=0, second=0, microsecond=0)
    end_et = start_et + datetime.timedelta(days=1)
    start_utc = start_et.astimezone(datetime.timezone.utc)
    end_utc = end_et.astimezone(datetime.timezone.utc)
    rows = (
        db.query(Score, User.username)
        .join(User, Score.user_id == User.id)
        .filter(Score.created_at >= start_utc, Score.created_at < end_utc)
        .order_by(Score.created_at.desc())
        .all()
    )
    items = []
    for s, username in rows:
        items.append({
            "id": str(s.id),
            "user_id": str(s.user_id),
            "username": username,
            "score_value": s.score_value,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return {"success": True, "count": len(items), "scores": items}

@app.get("/scores/week")
async def get_week_scores(db: Session = Depends(get_db)):
    now_et = datetime.datetime.now(ZoneInfo("America/New_York"))
    week_start_et = now_et - datetime.timedelta(days=7)
    week_start_utc = week_start_et.astimezone(datetime.timezone.utc)
    now_utc = now_et.astimezone(datetime.timezone.utc)

    # Get all scores from the last week
    rows = (
        db.query(Score, User.username)
        .join(User, Score.user_id == User.id)
        .filter(Score.created_at >= week_start_utc, Score.created_at <= now_utc)
        .order_by(Score.score_value.desc())
        .all()
    )

    # Define AI models
    ai_models = ['Sonnet 4', 'Gemini 2.5 Flash', 'GPT 5']

    # Separate AI and human scores
    ai_scores = []
    human_scores = []

    for s, username in rows:
        score_item = {
            "id": str(s.id),
            "user_id": str(s.user_id),
            "username": username,
            "score_value": s.score_value,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }

        if any(model in username for model in ai_models):
            ai_scores.append(score_item)
        else:
            human_scores.append(score_item)

    # For AI, get all their scores regardless of date, but limit to top 3
    all_ai_rows = (
        db.query(Score, User.username)
        .join(User, Score.user_id == User.id)
        .order_by(Score.score_value.desc())
        .all()
    )

    # Get top AI scores (not just from last week), limited to 3
    all_ai_scores = []
    for s, username in all_ai_rows:
        if any(model in username for model in ai_models):
            all_ai_scores.append({
                "id": str(s.id),
                "user_id": str(s.user_id),
                "username": username,
                "score_value": s.score_value,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            })

    # Limit to top 3 AI scores
    top_ai_scores = all_ai_scores[:3]

    # Limit to top 3 human scores from last week
    top_human_scores = human_scores[:3]

    # Combine: top 3 AI scores + top 3 human scores from last week
    combined_scores = top_ai_scores + top_human_scores

    # Sort the combined list by score_value descending
    combined_scores.sort(key=lambda x: x['score_value'], reverse=True)

    return {"success": True, "count": len(combined_scores), "scores": combined_scores}

@app.post("/scores")
async def create_score(payload: CreateScoreRequest, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    score = Score(user_id=payload.user_id, score_value=payload.score_value)
    db.add(score)
    db.commit()
    db.refresh(score)
    return {
        "id": str(score.id),
        "user_id": str(score.user_id),
        "score_value": score.score_value,
        "created_at": score.created_at.isoformat() if score.created_at else None,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
