from pydantic import BaseModel
from typing import Optional


class Alert(BaseModel):
    event: str
    confidence: float


class SectorThreat(BaseModel):
    sector_id: str
    threat_score: int
    threat_level: str
    visibility: str
    weather: str
    historical_risk: int
    last_patrol_hours: float
    alerts: list[Alert] = []
    reasons: list[str] = []


class ExplanationResponse(BaseModel):
    sector_id: str
    score: int
    level: str
    reasons: list[str]


class PatrolAssignment(BaseModel):
    patrol_id: str
    current_sector: str
    assigned_sector: str
    path: list[str]
    cost: float
    threat_score: int
    threat_level: str


class HealthResponse(BaseModel):
    status: str
    service: str