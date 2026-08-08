import json
from pathlib import Path
from sqlalchemy import select

from backend.db import SessionLocal
from backend.models import Sector, Sensor, Incident, Patrol, PatrolLog, Alert

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def load_json(filename):
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_table(db, model, pk_column, records, row_builder, label):
    """
    Insert only records whose primary key isn't already present.
    Never deletes, updates, or overwrites existing rows.
    """
    existing_ids = {row[0] for row in db.execute(select(pk_column)).all()}

    inserted = 0
    skipped = 0
    for record in records:
        row = row_builder(record)
        pk_value = getattr(row, pk_column.key)
        if pk_value in existing_ids:
            skipped += 1
            continue
        db.add(row)
        existing_ids.add(pk_value)
        inserted += 1

    db.commit()
    print(f"{label}: inserted {inserted}, skipped {skipped} (already present), {len(records)} total in file")
    return inserted, skipped


db = SessionLocal()

try:
    seed_table(
        db, Sector, Sector.sector_id, load_json("sectors.json"),
        lambda r: Sector(
            sector_id=r["sector_id"],
            sector_name=r["sector_name"],
            latitude=str(r["latitude"]),
            longitude=str(r["longitude"]),
            terrain_type=r["terrain_type"],
            weather_condition=r["weather_condition"],
            visibility_level=r["visibility_level"],
            historical_risk_score=r["historical_risk_score"],
            patrol_gap_hours=str(r["patrol_gap_hours"]),
            active_threat_designation=r["active_threat_designation"],
            area_sq_km=str(r["area_sq_km"]),
            last_incident_date=r["last_incident_date"],
        ),
        "sectors",
    )

    seed_table(
        db, Sensor, Sensor.sensor_id, load_json("sensors.json"),
        lambda r: Sensor(
            sensor_id=r["sensor_id"],
            sector_id=r["sector_id"],
            sensor_type=r["sensor_type"],
            operational_status=r["operational_status"],
            detection_range_m=r["detection_range_m"],
            installed_date=r["installed_date"],
            last_maintenance_date=r["last_maintenance_date"],
        ),
        "sensors",
    )

    seed_table(
        db, Patrol, Patrol.patrol_id, load_json("patrols.json"),
        lambda r: Patrol(
            patrol_id=r["patrol_id"],
            patrol_name=r["patrol_name"],
            assigned_sector=r["assigned_sector"],
            status=r["status"],
            team_size=r["team_size"],
            vehicle_type=r["vehicle_type"],
            fuel_level_percent=r["fuel_level_percent"],
            shift=r["shift"],
            communication_channel=r["communication_channel"],
            last_check_in=r["last_check_in"],
        ),
        "patrols",
    )

    seed_table(
        db, Incident, Incident.incident_id, load_json("incidents.json"),
        lambda r: Incident(
            incident_id=r["incident_id"],
            sector_id=r["sector_id"],
            incident_type=r["incident_type"],
            severity=r["severity"],
            timestamp=r["timestamp"],
            response_time_minutes=r["response_time_minutes"],
            resolution_status=r["resolution_status"],
            casualties=r["casualties"],
            notes=r["notes"],
        ),
        "incidents",
    )

    seed_table(
        db, PatrolLog, PatrolLog.log_id, load_json("patrol_logs.json"),
        lambda r: PatrolLog(
            log_id=r["log_id"],
            patrol_id=r["patrol_id"],
            sector_id=r["sector_id"],
            arrival_time=r["arrival_time"],
            departure_time=r["departure_time"],
            duration_minutes=r["duration_minutes"],
            patrol_outcome=r["patrol_outcome"],
            remarks=r["remarks"],
        ),
        "patrol_logs",
    )

    # active_factors / coordinates / explainability exist in the JSON but
    # have no corresponding column — same fields the current seeder already
    # ignores; intentionally not persisted.
    seed_table(
        db, Alert, Alert.alert_id, load_json("alerts.json"),
        lambda r: Alert(
            alert_id=r["alert_id"],
            sector_id=r["sector_id"],
            sensor_id=r["sensor_id"],
            event_type=r["event_type"],
            confidence=str(r["confidence"]),
            threat_score=r["threat_score"],
            threat_level=r["threat_level"],
            alert_status=r["alert_status"],
            timestamp=r["timestamp"],
            recommended_action=r["recommended_action"],
        ),
        "alerts",
    )

except Exception as e:
    db.rollback()
    print(f"Seeding failed, rolled back uncommitted changes: {e}")
    raise
finally:
    db.close()
