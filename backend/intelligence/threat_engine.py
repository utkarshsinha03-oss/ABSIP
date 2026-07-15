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

    # ── 1. Alert-based scores ──────────────────
    for alert in alerts:
        event = alert.get("event", "").lower()
        confidence = float(alert.get("confidence", 0))

        # Skip low-confidence detections
        if confidence < 0.50:
            continue

        event_score = EVENT_SCORES.get(event, 0)

        # Scale score by confidence
        score += int(event_score * confidence)

    # ── 2. Visibility score ───────────────────
    visibility = sector.get("visibility", "High")
    score += VISIBILITY_SCORES.get(visibility, 0)

    # ── 3. Weather score ──────────────────────
    weather = sector.get("weather", "Clear")
    score += WEATHER_SCORES.get(weather, 0)

    # ── 4. Historical risk (multiplier) ───────
    hist_risk = int(sector.get("historical_risk", 0))
    score += hist_risk * HISTORICAL_RISK_MULTIPLIER

    # ── 5. Patrol gap (multiplier) ────────────
    patrol_hours = float(sector.get("last_patrol_hours", 0))
    if patrol_hours > PATROL_GAP_THRESHOLD_HOURS:
        gap_score = int((patrol_hours - PATROL_GAP_THRESHOLD_HOURS) * PATROL_GAP_MULTIPLIER)
        score += gap_score

    # ── 6. Cap score between 0 and 100 ────────
    score = max(0, min(100, score))

    # ── 7. Get threat level ───────────────────
    level = get_threat_level(score)

    # ── 8. Generate explanation ───────────────
    explanation = generate_explanation(sector, alerts)

    return {
        "sector_id": sector.get("sector_id", "UNKNOWN"),
        "score":     score,
        "level":     level,
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
    