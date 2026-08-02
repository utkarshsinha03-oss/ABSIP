from sqlalchemy import Column, Integer, String
from backend.db import Base
from sqlalchemy import Boolean, DateTime
from datetime import datetime


class Sector(Base):
    __tablename__ = "sectors"

    sector_id = Column(String, primary_key=True)
    sector_name = Column(String)
    latitude = Column(String)
    longitude = Column(String)
    terrain_type = Column(String)
    weather_condition = Column(String)
    visibility_level = Column(String)
    historical_risk_score = Column(Integer)
    patrol_gap_hours = Column(String)
    active_threat_designation = Column(String)
    area_sq_km = Column(String)
    last_incident_date = Column(String)

class Sensor(Base):
    __tablename__ = "sensors"

    sensor_id = Column(String, primary_key=True)
    sector_id = Column(String)
    sensor_type = Column(String)
    operational_status = Column(String)
    detection_range_m = Column(Integer)
    installed_date = Column(String)
    last_maintenance_date = Column(String)


class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(String, primary_key=True)
    sector_id = Column(String)
    incident_type = Column(String)
    severity = Column(String)
    timestamp = Column(String)
    response_time_minutes = Column(Integer)
    resolution_status = Column(String)
    casualties = Column(Integer)
    notes = Column(String)


class Patrol(Base):
    __tablename__ = "patrols"

    patrol_id = Column(String, primary_key=True)
    patrol_name = Column(String)
    assigned_sector = Column(String)
    status = Column(String)
    team_size = Column(Integer)
    vehicle_type = Column(String)
    fuel_level_percent = Column(Integer)
    shift = Column(String)
    communication_channel = Column(String)
    last_check_in = Column(String)


class PatrolLog(Base):
    __tablename__ = "patrol_logs"

    log_id = Column(String, primary_key=True)
    patrol_id = Column(String)
    sector_id = Column(String)
    arrival_time = Column(String)
    departure_time = Column(String)
    duration_minutes = Column(Integer)
    patrol_outcome = Column(String)
    remarks = Column(String)

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String, primary_key=True)
    sector_id = Column(String)
    sensor_id = Column(String)
    event_type = Column(String)
    confidence = Column(String)
    threat_score = Column(Integer)
    threat_level = Column(String)
    alert_status = Column(String)
    timestamp = Column(String)
    recommended_action = Column(String)



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Officer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)    
