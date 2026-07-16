"""
Intelligence Router — endpoints powered by the Threat Engine module.
"""

from fastapi import APIRouter, HTTPException
from dsa.graph_builder import load_alerts
from backend.models.schemas import ExplanationResponse

from backend.services.planning_service import get_sector_threat
from backend.intelligence.threat_engine import calculate_threat_score
from backend.intelligence.explanation_engine import generate_explanation

router = APIRouter(prefix="", tags=["Intelligence"])


@router.get("/threat/{sector_id}")
def get_threat(sector_id: str):
    """
    Returns the current threat score, level, and reasons for a specific sector.
    """
    result = get_sector_threat(sector_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Sector '{sector_id}' not found")
    return result


@router.get("/explanation/{sector_id}", response_model=ExplanationResponse)
def get_explanation(sector_id: str):
    """
    Returns a human-readable explanation of why a sector has its current threat level.
    """
    result = get_sector_threat(sector_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Sector '{sector_id}' not found")

    try:
        sector_data = {
            "sector_id": result["sector_id"],
            "visibility": result["visibility"],
            "weather": result["weather"],
            "historical_risk": result["historical_risk"],
            "last_patrol_hours": result["last_patrol_hours"],
        }
        explanation = generate_explanation(sector_data, result["alerts"])
        return {
            "sector_id": sector_id,
            "score": result["threat_score"],
            "level": result["threat_level"],
            "reasons": explanation.get("reasons", result["reasons"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {e}")
@router.get("/alerts")
def get_alerts():
    """
    Returns all raw alerts from the sensor/detection data.
    """
    try:
        return load_alerts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {e}")