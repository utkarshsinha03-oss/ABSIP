import json
from pathlib import Path

from backend.db import SessionLocal
from backend.models import Alert

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def load_json(filename):
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


db = SessionLocal()

alerts = load_json("alerts.json")

for a in alerts:
    db.add(
        Alert(
            alert_id=a["alert_id"],
            sector_id=a["sector_id"],
            sensor_id=a["sensor_id"],
            event_type=a["event_type"],
            confidence=str(a["confidence"]),
            threat_score=a["threat_score"],
            threat_level=a["threat_level"],
            alert_status=a["alert_status"],
            timestamp=a["timestamp"],
            recommended_action=a["recommended_action"],
        )
    )

db.commit()
db.close()

print(f"Loaded {len(alerts)} alerts")