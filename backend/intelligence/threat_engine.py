"""
ABSIP — Threat Intelligence Engine
Member 2: Intelligence Lead — Phase 5

Main entry point for the intelligence module.
Backend imports this file directly.

Usage:
    from intelligence.threat_engine import calculate_threat_score, get_threat_level

    result = calculate_threat_score(sector, alerts)
    print(result)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from threat_levels import (
    get_threat_level,
    EVENT_SCORES,
    VISIBILITY_SCORES,
    WEATHER_SCORES,
    HISTORICAL_RISK_MULTIPLIER,
    PATROL_GAP_MULTIPLIER,
    PATROL_GAP_THRESHOLD_HOURS,
)
from explanation_engine import generate_explanation


# ─────────────────────────────────────────────
# CORE SCORING FUNCTION
# ─────────────────────────────────────────────

def calculate_threat_score(sector: dict, alerts: list) -> dict:
    """
    Calculate a threat score for a sector based on current alerts and conditions.

    Args:
        sector (dict): Sector data. Expected fields:
            - sector_id (str)
            - visibility (str): 'High' | 'Medium' | 'Low'
            - historical_risk (int): 1–10
            - last_patrol_hours (float): hours since last patrol
            - weather (str): 'Clear' | 'Fog' | 'Rain' | 'Storm' | 'Snow' | 'Dust Storm'

        alerts (list): List of alert dicts. Each alert:
            - event (str): event type e.g. 'human_detected'
            - confidence (float): 0.0–1.0

    Returns:
        dict: {
            "sector_id": str,
            "score": int (0–100),
            "level": str,
            "reasons": list[str]
        }
    """
    score = 0
    breakdown_raw = {
        "human_detection": 0,
        "vehicle_detection": 0,
        "visibility": 0,
        "weather": 0,
        "historical_risk": 0,
        "patrol_gap": 0,
    }

    # ── 1. Alert-based scores ──────────────────
    for alert in alerts:
        event = alert.get("event", "").lower()
        confidence = float(alert.get("confidence", 0))

        # Skip low-confidence detections
        if confidence < 0.50:
            continue

        event_score = EVENT_SCORES.get(event, 0)

        # Scale score by confidence
        contribution = int(event_score * confidence)
        score += contribution
        if event == "human_detected":
            breakdown_raw["human_detection"] += contribution
        elif event == "vehicle_detected":
            breakdown_raw["vehicle_detection"] += contribution

    # ── 2. Visibility score ───────────────────
    visibility = sector.get("visibility", "High")
    visibility_score = VISIBILITY_SCORES.get(visibility, 0)
    score += visibility_score
    breakdown_raw["visibility"] = visibility_score

    # ── 3. Weather score ──────────────────────
    weather = sector.get("weather", "Clear")
    weather_score = WEATHER_SCORES.get(weather, 0)
    score += weather_score
    breakdown_raw["weather"] = weather_score

    # ── 4. Historical risk (multiplier) ───────
    hist_risk = int(sector.get("historical_risk", 0))
    historical_score = hist_risk * HISTORICAL_RISK_MULTIPLIER
    score += historical_score
    breakdown_raw["historical_risk"] = historical_score

    # ── 5. Patrol gap (multiplier) ────────────
    patrol_hours = float(sector.get("last_patrol_hours", 0))
    if patrol_hours > PATROL_GAP_THRESHOLD_HOURS:
        gap_score = int((patrol_hours - PATROL_GAP_THRESHOLD_HOURS) * PATROL_GAP_MULTIPLIER)
        score += gap_score
        breakdown_raw["patrol_gap"] = gap_score

    # ── 6. Cap score between 0 and 100 ────────
    score = max(0, min(100, score))

    # ── 7. Get threat level ───────────────────
    level = get_threat_level(score)

    # ── 8. Generate explanation ───────────────
    explanation = generate_explanation(sector, alerts)

    # ── 9. Normalize each factor to a 0-100 scale for display ──
    factor_max = {
        "human_detection": 50,
        "vehicle_detection": 40,
        "visibility": 20,
        "weather": 10,
        "historical_risk": 20,
        "patrol_gap": 20,
    }
    score_breakdown = {
        key: max(0, min(100, round((value / factor_max[key]) * 100)))
        for key, value in breakdown_raw.items()
    }

    return {
        "sector_id": sector.get("sector_id", "UNKNOWN"),
        "score":     score,
        "level":     level,
        "score_breakdown": score_breakdown,
        "reasons":   explanation["reasons"],
    }


# ─────────────────────────────────────────────
# CONVENIENCE WRAPPER (for backend)
# ─────────────────────────────────────────────

def assess_sector(sector: dict, alerts: list) -> dict:
    """
    Alias for calculate_threat_score. Backend can call either.
    """
    return calculate_threat_score(sector, alerts)
# Additional alias for backend compatibility
assess_threat = assess_sector 
    