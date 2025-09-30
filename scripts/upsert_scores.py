#!/usr/bin/env python3
"""
Script to fetch data from Airtable, calculate model scores based on rent predictions,
and upsert the results into the guess-that-rent database.
Requires DATABASE_URL, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, and AIRTABLE_API_KEY environment variables.
"""

import os
import uuid
import datetime
import requests
from typing import Dict, List, Tuple
from sqlalchemy import create_engine, String, DateTime, func, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Mapped, mapped_column, Session
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../.env")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Airtable setup
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME", "Listings")
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")

if not all([AIRTABLE_BASE_ID, AIRTABLE_API_KEY]):
    raise ValueError("Airtable configuration missing. Please set AIRTABLE_BASE_ID and AIRTABLE_API_KEY environment variables.")

AIRTABLE_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models (copied from main.py)
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Score(Base):
    __tablename__ = "score"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    score_value: Mapped[int] = mapped_column(Integer, nullable=False)

def fetch_airtable_data() -> List[Dict]:
    """Fetch all records from Airtable."""
    headers = {
        "Authorization": f"Bearer {AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }

    records = []
    offset = None

    while True:
        params = {}
        if offset:
            params["offset"] = offset

        response = requests.get(AIRTABLE_URL, headers=headers, params=params)
        response.raise_for_status()

        data = response.json()
        records.extend(data.get("records", []))

        offset = data.get("offset")
        if not offset:
            break

    print(f"Fetched {len(records)} records from Airtable")
    return records

def extract_model_columns(records: List[Dict]) -> List[str]:
    """Extract model column names from the data (columns ending with 'Guess')."""
    if not records:
        return []

    sample_fields = records[0].get("fields", {})
    model_columns = [col for col in sample_fields.keys() if col.endswith(" Guess")]
    print(f"Found model columns: {model_columns}")
    return model_columns

def calculate_model_scores(records: List[Dict], model_columns: List[str]) -> Dict[str, float]:
    """Calculate scores for each model based on their rent predictions."""
    model_scores = {}

    for model_col in model_columns:
        # Extract model name from column (remove " Guess" suffix)
        model_name = model_col.replace(" Guess", "")

        valid_errors = []

        for record in records:
            fields = record.get("fields", {})

            actual_rent = fields.get("Rent Price")
            model_guess = fields.get(model_col)

            # Skip if missing data or model guess is $0 (special skip value)
            if not actual_rent or not model_guess or model_guess == 0:
                continue

            # Calculate percentage error: |guess - actual| / actual * 100
            error_percent = abs(model_guess - actual_rent) / actual_rent * 100
            valid_errors.append(error_percent)

        if valid_errors:
            avg_error = sum(valid_errors) / len(valid_errors)
            # Score = 100 - average error percentage (higher score is better)
            model_score = round(100 - avg_error, 1)
            model_scores[model_name] = model_score
            print(f"{model_name}: {len(valid_errors)} valid predictions, {avg_error:.1f}% avg error, score: {model_score}")
        else:
            print(f"{model_name}: No valid predictions found")

    return model_scores

def upsert_user(db: Session, username: str, ip_address: str = "127.0.0.1") -> User:
    """Create or get existing user by username."""
    user = db.query(User).filter(User.username == username).first()
    if user:
        print(f"User '{username}' already exists with ID: {user.id}")
        return user

    user = User(username=username, ip_address=ip_address)
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created new user '{username}' with ID: {user.id}")
        return user
    except IntegrityError:
        db.rollback()
        # Handle race condition - try to get the user again
        user = db.query(User).filter(User.username == username).first()
        if user:
            return user
        raise

def create_score(db: Session, user_id: uuid.UUID, score_value: int) -> Score:
    """Create a new score for a user."""
    score = Score(user_id=user_id, score_value=score_value)
    db.add(score)
    db.commit()
    db.refresh(score)
    print(f"Created score {score_value} for user ID: {user_id}")
    return score

def main():
    """Main function to fetch Airtable data and calculate model scores."""
    print("Starting Airtable data processing and database upsert script...")

    try:
        # Fetch data from Airtable
        print("\n1. Fetching data from Airtable...")
        records = fetch_airtable_data()

        if not records:
            print("No records found in Airtable")
            return

        # Extract model columns
        print("\n2. Identifying model columns...")
        model_columns = extract_model_columns(records)

        if not model_columns:
            print("No model guess columns found")
            return

        # Calculate scores
        print("\n3. Calculating model scores...")
        model_scores = calculate_model_scores(records, model_columns)

        if not model_scores:
            print("No valid scores calculated")
            return

        # Upsert to database
        print(f"\n4. Connecting to database: {DATABASE_URL[:50]}...")
        db = SessionLocal()

        try:
            for model_name, score in model_scores.items():
                print(f"\nProcessing model: {model_name}")

                # Upsert user
                user = upsert_user(db, model_name)

                # Create score (store accuracy score directly)
                accuracy_score = round(score)
                create_score(db, user.id, accuracy_score)

            print("\n✓ Successfully processed all models!")

            # Display current scores
            print("\nCurrent leaderboard (higher accuracy % is better):")
            scores = (
                db.query(Score, User.username)
                .join(User, Score.user_id == User.id)
                .order_by(Score.score_value.desc())
                .all()
            )

            for i, (score, username) in enumerate(scores, 1):
                print(f"{i}. {username}: {score.score_value}% accuracy")

        finally:
            db.close()

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Airtable: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()