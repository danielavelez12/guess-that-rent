#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv

load_dotenv("../.env")

AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME")
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")

headers = {"Authorization": f"Bearer {AIRTABLE_API_KEY}"}
url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"

response = requests.get(url, headers=headers)
data = response.json()

print("Sonnet 4 Calculations:")
print("=" * 50)

valid_errors = []
record_num = 1

for record in data["records"]:
    fields = record.get("fields", {})

    name = fields.get("Name", "Unknown")
    actual_rent = fields.get("Rent Price")
    sonnet_guess = fields.get("Sonnet 4 Guess")

    print(f"Record {record_num}: {name}")
    print(f"  Actual Rent: ${actual_rent:,}" if actual_rent else "  Actual Rent: Missing")
    print(f"  Sonnet 4 Guess: ${sonnet_guess:,}" if sonnet_guess else "  Sonnet 4 Guess: Missing/$0")

    if actual_rent and sonnet_guess and sonnet_guess != 0:
        error_percent = abs(sonnet_guess - actual_rent) / actual_rent * 100
        valid_errors.append(error_percent)
        print(f"  Error: |{sonnet_guess:,} - {actual_rent:,}| / {actual_rent:,} * 100 = {error_percent:.2f}%")
        print(f"  ✓ INCLUDED in calculation")
    else:
        print(f"  ✗ SKIPPED (missing data or $0 guess)")

    print()
    record_num += 1

print("Summary:")
print(f"Valid predictions: {len(valid_errors)}")
if valid_errors:
    print(f"Individual errors: {[round(e, 2) for e in valid_errors]}")
    avg_error = sum(valid_errors) / len(valid_errors)
    print(f"Average error: {sum(valid_errors):.2f} / {len(valid_errors)} = {avg_error:.2f}%")
    score = 100 - avg_error
    print(f"Final score: 100 - {avg_error:.2f} = {score:.1f}%")