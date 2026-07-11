"""
Planning Router — endpoints powered by the DSA/Planning module.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from backend.models.schemas import SectorThreat

from backend.services.planning_service import (
    get_ranked_sectors,
    get_top_threat,
    get_patrol_assignments,
)

router = APIRouter(prefix="", tags=["Planning"])


@router.get("/ranked-sectors", response_model=List[SectorThreat])
def ranked_sectors():
    """
    Returns all sectors ranked by threat score (highest first).
    """
    try:
        return get_ranked_sectors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rank sectors: {e}")


@router.get("/top-threats", response_model=List[SectorThreat])
def top_threats(limit: int = 5):
    """
    Returns the top N highest-threat sectors. Default: 5.
    """
    try:
        result = get_top_threat(n=limit)
        if result is None:
            raise HTTPException(status_code=404, detail="No sectors found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch top threats: {e}")


@router.get("/patrol-assignments")
def patrol_assignments():
    """
    Returns the recommended patrol dispatch plan
    (which patrol should go to which high-threat sector, and the route).
    """
    try:
        return get_patrol_assignments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign patrols: {e}")

@router.get("/sectors")
def all_sectors():
    """
    Returns all sectors with their current threat data (same as ranked-sectors,
    but without sorting guarantee — raw list).
    """
    try:
        return get_ranked_sectors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sectors: {e}")        