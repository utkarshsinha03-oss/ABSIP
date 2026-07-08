"""
ABSIP — Synthetic Border Surveillance Dataset Generator
Member 2: Intelligence Lead — Phase 2
Generated datasets: sectors, sensors, incidents, alerts, patrols, patrol_logs, weather
"""

import json
import uuid
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)
OUTPUT_DIR = Path("data")
OUTPUT_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────
# CONSTANTS & RULES
# ─────────────────────────────────────────────

TERRAIN_TYPES = ["Forest", "Mountain", "River", "Desert", "Plain"]
WEATHER_CONDITIONS = ["Clear", "Fog", "Rain", "Storm", "Snow", "Dust Storm"]
INCIDENT_TYPES = ["Trespassing", "Smuggling", "Unauthorized Crossing", "Surveillance Drone", "Armed Infiltration", "Suspicious Vehicle"]
SENSOR_TYPES = ["Camera", "Motion Sensor", "Thermal Camera", "Radar", "UAV Feed"]
EVENT_TYPES = ["Human Detection", "Vehicle Detection", "Motion Detection", "Thermal Anomaly", "Radar Contact"]
PATROL_VEHICLES = ["Jeep", "ATV", "Armored Vehicle", "Motorcycle", "Helicopter"]

SECTOR_NAMES = [
    "Alpha", "Bravo", "Charlie", "Delta", "Echo",
    "Foxtrot", "Golf", "Hotel", "India", "Juliet",
    "Kilo", "Lima", "Mike", "November", "Oscar",
    "Papa", "Quebec", "Romeo", "Sierra", "Tango",
    "Uniform", "Victor", "Whiskey", "X-Ray", "Yankee",
    "Zulu", "Arrow", "Bison", "Crane", "Dagger",
    "Eagle", "Falcon", "Granite", "Hawk", "Iron",
    "Jaguar", "Kodiak", "Lance", "Marlin", "Nova",
    "Omega", "Phoenix", "Quartz", "Raven", "Sphinx",
    "Thunder", "Umber", "Viper", "Wolf", "Xenon"
]

# Terrain → typical visibility bias
TERRAIN_VISIBILITY_BIAS = {
    "Forest":   ["Low", "Low", "Medium"],
    "Mountain": ["Medium", "Medium", "High"],
    "River":    ["Medium", "Low", "Medium"],
    "Desert":   ["High", "High", "Medium"],
    "Plain":    ["High", "High", "Medium"],
}

# Weather → visibility override
WEATHER_VISIBILITY_MAP = {
    "Clear":      ["High", "High", "Medium"],
    "Fog":        ["Low", "Low", "Low"],
    "Rain":       ["Low", "Medium", "Medium"],
    "Storm":      ["Low", "Low", "Medium"],
    "Snow":       ["Low", "Medium", "Medium"],
    "Dust Storm": ["Low", "Low", "Medium"],
}

def visibility_from_context(terrain, weather):
    terrain_pool = TERRAIN_VISIBILITY_BIAS[terrain]
    weather_pool = WEATHER_VISIBILITY_MAP[weather]
    # weather has higher influence
    combined = weather_pool + weather_pool + terrain_pool
    return random.choice(combined)

def random_timestamp(days_back=180):
    base = datetime.utcnow()
    delta = timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59)
    )
    return (base - delta).strftime("%Y-%m-%dT%H:%M:%SZ")

def uid():
    return str(uuid.uuid4())

# ─────────────────────────────────────────────
# 1. SECTORS (50 records)
# ─────────────────────────────────────────────

def generate_sectors():
    sectors = []
    base_lat = 32.0
    base_lon = 74.0

    for i, name in enumerate(SECTOR_NAMES):
        terrain = random.choice(TERRAIN_TYPES)
        weather = random.choice(WEATHER_CONDITIONS)
        visibility = visibility_from_context(terrain, weather)

        # Historical risk: Forest/River/Mountain = higher risk areas
        base_risk = {"Forest": 6, "Mountain": 5, "River": 7, "Desert": 4, "Plain": 3}[terrain]
        historical_risk = min(10, max(1, base_risk + random.randint(-2, 3)))

        # Patrol gap in hours — high-risk sectors get more attention but still have gaps
        patrol_gap_hours = round(random.uniform(0.5, 8.0), 1)

        sector = {
            "sector_id": f"S{str(i+1).zfill(3)}",
            "sector_name": f"{name} Sector",
            "latitude": round(base_lat + (i % 10) * 0.15 + random.uniform(-0.05, 0.05), 4),
            "longitude": round(base_lon + (i // 10) * 0.2 + random.uniform(-0.05, 0.05), 4),
            "terrain_type": terrain,
            "weather_condition": weather,
            "visibility_level": visibility,
            "historical_risk_score": historical_risk,
            "patrol_gap_hours": patrol_gap_hours,
            "active_threat_designation": historical_risk >= 8,
            "area_sq_km": round(random.uniform(5.0, 50.0), 2),
            "last_incident_date": random_timestamp(days_back=90) if historical_risk >= 5 else None,
        }
        sectors.append(sector)

    return sectors

# ─────────────────────────────────────────────
# 2. SENSORS (75–100 records)
# ─────────────────────────────────────────────

def generate_sensors(sectors):
    sensors = []
    sensor_count = random.randint(75, 100)
    sector_ids = [s["sector_id"] for s in sectors]

    # Ensure every sector has at least one sensor
    for sector_id in sector_ids:
        sensor = {
            "sensor_id": f"SEN{str(len(sensors)+1).zfill(4)}",
            "sector_id": sector_id,
            "sensor_type": random.choice(SENSOR_TYPES),
            "operational_status": random.choices(["Active", "Active", "Active", "Maintenance", "Offline"], k=1)[0],
            "detection_range_m": random.choice([100, 250, 500, 750, 1000]),
            "installed_date": random_timestamp(days_back=730),
            "last_maintenance_date": random_timestamp(days_back=180),
        }
        sensors.append(sensor)

    # Fill up to sensor_count with additional sensors on high-risk sectors
    high_risk_sectors = [s["sector_id"] for s in sectors if s["historical_risk_score"] >= 6]
    while len(sensors) < sensor_count:
        sector_id = random.choice(high_risk_sectors if high_risk_sectors else sector_ids)
        sensor = {
            "sensor_id": f"SEN{str(len(sensors)+1).zfill(4)}",
            "sector_id": sector_id,
            "sensor_type": random.choice(SENSOR_TYPES),
            "operational_status": random.choices(["Active", "Active", "Active", "Maintenance", "Offline"], k=1)[0],
            "detection_range_m": random.choice([100, 250, 500, 750, 1000]),
            "installed_date": random_timestamp(days_back=730),
            "last_maintenance_date": random_timestamp(days_back=180),
        }
        sensors.append(sensor)

    return sensors

# ─────────────────────────────────────────────
# 3. HISTORICAL INCIDENTS (300–500 records)
# ─────────────────────────────────────────────

def generate_incidents(sectors):
    incidents = []
    target = random.randint(300, 500)

    # High-risk sectors get proportionally more incidents
    weighted_sectors = []
    for s in sectors:
        weight = s["historical_risk_score"]
        weighted_sectors.extend([s["sector_id"]] * weight)

    for i in range(target):
        sector_id = random.choice(weighted_sectors)
        severity = random.choices(
            ["Low", "Medium", "High", "Critical"],
            weights=[30, 40, 20, 10], k=1
        )[0]
        resolution = random.choices(
            ["Resolved", "Resolved", "Resolved", "Unresolved", "Under Investigation"],
            weights=[50, 20, 10, 10, 10], k=1
        )[0]

        incident = {
            "incident_id": f"INC{str(i+1).zfill(5)}",
            "sector_id": sector_id,
            "incident_type": random.choice(INCIDENT_TYPES),
            "severity": severity,
            "timestamp": random_timestamp(days_back=365),
            "response_time_minutes": random.randint(5, 120),
            "resolution_status": resolution,
            "casualties": random.choice([0, 0, 0, 0, 1, 2]) if severity in ["High", "Critical"] else 0,
            "notes": f"Incident detected by patrol in sector {sector_id}.",
        }
        incidents.append(incident)

    return incidents

# ─────────────────────────────────────────────
# 4. ACTIVE ALERTS (100–150 records)
# ─────────────────────────────────────────────

def generate_alerts(sectors, sensors):
    alerts = []
    target = random.randint(100, 150)

    active_sensors = [s for s in sensors if s["operational_status"] == "Active"]
    high_risk_sectors = [s["sector_id"] for s in sectors if s["historical_risk_score"] >= 5]

    for i in range(target):
        sector_id = random.choice(high_risk_sectors)
        sector = next(s for s in sectors if s["sector_id"] == sector_id)

        # Pick a sensor in this sector if available
        sector_sensors = [s for s in active_sensors if s["sector_id"] == sector_id]
        sensor_id = random.choice(sector_sensors)["sensor_id"] if sector_sensors else None

        confidence = round(random.uniform(0.75, 0.99), 2)
        event_type = random.choice(EVENT_TYPES)

        # Threat score based on sector attributes
        base_score = sector["historical_risk_score"] * 5
        if sector["visibility_level"] == "Low":
            base_score += 10
        if sector["patrol_gap_hours"] > 4:
            base_score += 10
        if sector["weather_condition"] in ["Fog", "Storm", "Dust Storm"]:
            base_score += 5
        threat_score = min(100, max(20, base_score + random.randint(-10, 15)))

        if threat_score >= 81:
            threat_level = "Critical"
        elif threat_score >= 61:
            threat_level = "High"
        elif threat_score >= 31:
            threat_level = "Medium"
        else:
            threat_level = "Safe"

        recommended_actions = {
            "Safe": "continue_monitoring",
            "Medium": "notify_operator",
            "High": "dispatch_patrol",
            "Critical": "emergency_response",
        }

        alert = {
            "alert_id": uid(),
            "sector_id": sector_id,
            "sensor_id": sensor_id,
            "coordinates": {
                "lat": sector["latitude"],
                "lon": sector["longitude"],
            },
            "event_type": event_type,
            "confidence": confidence,
            "threat_score": threat_score,
            "threat_level": threat_level,
            "alert_status": random.choices(
                ["open", "acknowledged", "resolved", "escalated"],
                weights=[40, 30, 20, 10], k=1
            )[0],
            "timestamp": random_timestamp(days_back=7),
            "recommended_action": recommended_actions[threat_level],
            "active_factors": random.sample(
                ["human_detected", "vehicle_detected", "historical_risk", "low_visibility", "patrol_gap", "weather"],
                k=random.randint(2, 4)
            ),
            "explainability": {
                "score_breakdown": {
                    "human_detection": random.randint(0, 35) if "human_detected" in ["human_detected"] else 0,
                    "vehicle_detection": random.randint(0, 25),
                    "historical_risk": sector["historical_risk_score"],
                    "visibility": {"High": 0, "Medium": 4, "Low": 10}[sector["visibility_level"]],
                    "patrol_gap": min(10, int(sector["patrol_gap_hours"] * 1.5)),
                    "weather": 5 if sector["weather_condition"] in ["Fog", "Storm", "Dust Storm"] else 0,
                },
                "reasons": [
                    f"{event_type} detected in {sector_id} with {int(confidence*100)}% confidence",
                    f"Sector visibility is {sector['visibility_level']} due to {sector['weather_condition']} conditions",
                    f"Historical risk score for this sector is {sector['historical_risk_score']}/10",
                    f"Last patrol was {sector['patrol_gap_hours']} hours ago",
                ]
            }
        }
        alerts.append(alert)

    return alerts

# ─────────────────────────────────────────────
# 5. PATROLS (8–10 units)
# ─────────────────────────────────────────────

def generate_patrols(sectors):
    patrols = []
    count = random.randint(8, 10)
    sector_ids = [s["sector_id"] for s in sectors]

    for i in range(count):
        patrol = {
            "patrol_id": f"P{str(i+1).zfill(3)}",
            "patrol_name": f"Patrol Unit {i+1}",
            "assigned_sector": random.choice(sector_ids),
            "status": random.choices(["Active", "Active", "Standby", "Off-duty"], weights=[50, 20, 20, 10], k=1)[0],
            "team_size": random.randint(3, 8),
            "vehicle_type": random.choice(PATROL_VEHICLES),
            "fuel_level_percent": random.randint(30, 100),
            "shift": random.choice(["Morning", "Evening", "Night"]),
            "communication_channel": f"CH-{random.randint(1, 10)}",
            "last_check_in": random_timestamp(days_back=1),
        }
        patrols.append(patrol)

    return patrols

# ─────────────────────────────────────────────
# 6. PATROL LOGS (500–1000 records)
# ─────────────────────────────────────────────

def generate_patrol_logs(patrols, sectors):
    logs = []
    target = random.randint(500, 1000)
    sector_ids = [s["sector_id"] for s in sectors]
    patrol_ids = [p["patrol_id"] for p in patrols]

    for i in range(target):
        arrival = datetime.utcnow() - timedelta(
            days=random.randint(0, 180),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        duration_minutes = random.randint(20, 180)
        departure = arrival + timedelta(minutes=duration_minutes)

        remarks_pool = [
            "Routine patrol completed, no incidents detected.",
            "Suspicious footprints observed near fence line.",
            "Sensor offline — reported to maintenance team.",
            "Patrol completed under adverse weather conditions.",
            "Coordinated with neighboring patrol unit.",
            "All clear. Area secured.",
            "Detected vehicle tracks, investigation initiated.",
        ]

        log = {
            "log_id": f"LOG{str(i+1).zfill(6)}",
            "patrol_id": random.choice(patrol_ids),
            "sector_id": random.choice(sector_ids),
            "arrival_time": arrival.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "departure_time": departure.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "duration_minutes": duration_minutes,
            "patrol_outcome": random.choices(
                ["Clear", "Clear", "Clear", "Incident Reported", "Sensor Issue", "Suspicious Activity"],
                weights=[50, 20, 10, 10, 5, 5], k=1
            )[0],
            "remarks": random.choice(remarks_pool),
        }
        logs.append(log)

    return logs

# ─────────────────────────────────────────────
# 7. WEATHER (50 records — one per sector)
# ─────────────────────────────────────────────

def generate_weather(sectors):
    weather_records = []

    for sector in sectors:
        condition = sector["weather_condition"]
        visibility = sector["visibility_level"]

        temp_map = {
            "Clear": (15, 35), "Fog": (5, 20), "Rain": (10, 25),
            "Storm": (5, 18), "Snow": (-10, 5), "Dust Storm": (25, 45)
        }
        temp_range = temp_map[condition]

        wind_map = {
            "Clear": (0, 15), "Fog": (0, 10), "Rain": (10, 30),
            "Storm": (30, 80), "Snow": (5, 25), "Dust Storm": (20, 60)
        }
        wind_range = wind_map[condition]

        record = {
            "weather_id": f"W{str(sectors.index(sector)+1).zfill(3)}",
            "sector_id": sector["sector_id"],
            "weather_condition": condition,
            "visibility_level": visibility,
            "temperature_celsius": round(random.uniform(*temp_range), 1),
            "wind_speed_kmh": round(random.uniform(*wind_range), 1),
            "rainfall_mm": round(random.uniform(0, 50), 1) if condition in ["Rain", "Storm"] else 0.0,
            "recorded_at": random_timestamp(days_back=1),
        }
        weather_records.append(record)

    return weather_records

# ─────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────

def validate(sectors, sensors, incidents, alerts, patrols, patrol_logs, weather):
    sector_ids = {s["sector_id"] for s in sectors}
    patrol_ids = {p["patrol_id"] for p in patrols}
    sensor_ids = {s["sensor_id"] for s in sensors}

    errors = []

    for s in sensors:
        if s["sector_id"] not in sector_ids:
            errors.append(f"Sensor {s['sensor_id']} references unknown sector {s['sector_id']}")

    for inc in incidents:
        if inc["sector_id"] not in sector_ids:
            errors.append(f"Incident {inc['incident_id']} references unknown sector")

    for a in alerts:
        if a["sector_id"] not in sector_ids:
            errors.append(f"Alert {a['alert_id']} references unknown sector")

    for log in patrol_logs:
        if log["patrol_id"] not in patrol_ids:
            errors.append(f"Log {log['log_id']} references unknown patrol")
        if log["sector_id"] not in sector_ids:
            errors.append(f"Log {log['log_id']} references unknown sector")

    for w in weather:
        if w["sector_id"] not in sector_ids:
            errors.append(f"Weather {w['weather_id']} references unknown sector")

    return errors

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    print("Generating ABSIP datasets...")

    sectors     = generate_sectors()
    sensors     = generate_sensors(sectors)
    incidents   = generate_incidents(sectors)
    alerts      = generate_alerts(sectors, sensors)
    patrols     = generate_patrols(sectors)
    patrol_logs = generate_patrol_logs(patrols, sectors)
    weather     = generate_weather(sectors)

    datasets = {
        "sectors":     sectors,
        "sensors":     sensors,
        "incidents":   incidents,
        "alerts":      alerts,
        "patrols":     patrols,
        "patrol_logs": patrol_logs,
        "weather":     weather,
    }

    # Validate
    errors = validate(sectors, sensors, incidents, alerts, patrols, patrol_logs, weather)
    if errors:
        print(f"\n❌ Validation failed with {len(errors)} error(s):")
        for e in errors:
            print(f"   - {e}")
        return

    # Write JSON files
    for name, data in datasets.items():
        path = OUTPUT_DIR / f"{name}.json"
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  ✅ {name}.json — {len(data)} records → {path}")

    print(f"\nAll datasets written to ./{OUTPUT_DIR}/")
    print("\nSummary:")
    for name, data in datasets.items():
        print(f"  {name:<15} {len(data):>5} records")

if __name__ == "__main__":
    main()