"""
ABSIP — Explanation Engine
Member 2: Intelligence Lead — Phase 5

Generates human-readable reasons for every threat score.
Every score must be explainable — this is a core USP of ABSIP.
"""

from threat_levels import (
    EVENT_SCORES,
    VISIBILITY_SCORES,
    WEATHER_SCORES,
    PATROL_GAP_THRESHOLD_HOURS,
)


def generate_explanation(sector: dict, alerts: list) -> dict:
    """
    Generate human-readable reasons explaining why a threat score was given.

    Args:
        sector (dict): Sector data including visibility, weather, historical_risk, last_patrol_hours.
        alerts (list): List of alert dicts with 'event' and 'confidence' fields.

    Returns:
        dict: { "reasons": [str, ...] }
    """
    reasons = []

    # Alert-based reasons
    for alert in alerts:
        event = alert.get("event", "").lower()
        confidence = alert.get("confidence", 0)

        if confidence < 0.50:
            continue  # ignore very low confidence

        confidence_pct = int(confidence * 100)

        if event == "human_detected":
            reasons.append(f"Human detected in sector with {confidence_pct}% confidence")
        elif event == "vehicle_detected":
            reasons.append(f"Vehicle detected near border with {confidence_pct}% confidence")
        elif event == "drone_detected":
            reasons.append(f"Unauthorized drone detected with {confidence_pct}% confidence")
        elif event == "motion_detected":
            reasons.append(f"Suspicious motion detected with {confidence_pct}% confidence")
        elif event == "thermal_anomaly":
            reasons.append(f"Thermal anomaly detected with {confidence_pct}% confidence")
        elif event == "radar_contact":
            reasons.append(f"Radar contact detected with {confidence_pct}% confidence")
        elif event and event != "none":
            reasons.append(f"Event '{event}' detected with {confidence_pct}% confidence")

    # Visibility reason
    visibility = sector.get("visibility", "High")
    if visibility == "Low":
        weather = sector.get("weather", "")
        reasons.append(
            f"Visibility is critically low{' due to ' + weather if weather else ''} — increases infiltration risk"
        )
    elif visibility == "Medium":
        reasons.append("Visibility is reduced — sensor detection reliability may be affected")

    # Weather reason
    weather = sector.get("weather", "Clear")
    if weather in ["Fog", "Storm", "Dust Storm"]:
        reasons.append(f"Severe weather condition ({weather}) masks movement and reduces response capability")
    elif weather in ["Rain", "Snow"]:
        reasons.append(f"Adverse weather ({weather}) may reduce sensor effectiveness")

    # Historical risk reason
    hist_risk = int(sector.get("historical_risk", 0))
    if hist_risk >= 8:
        reasons.append(
            f"Sector has active threat designation — historical risk score {hist_risk}/10"
        )
    elif hist_risk >= 5:
        reasons.append(
            f"Sector has significant incident history — historical risk score {hist_risk}/10"
        )
    elif hist_risk > 0:
        reasons.append(
            f"Sector has low but non-zero incident history — risk score {hist_risk}/10"
        )

    # Patrol gap reason
    patrol_hours = float(sector.get("last_patrol_hours", 0))
    if patrol_hours > 4:
        reasons.append(
            f"Sector has not been patrolled for {patrol_hours} hours — high exploitation window"
        )
    elif patrol_hours > PATROL_GAP_THRESHOLD_HOURS:
        reasons.append(
            f"Last patrol was {patrol_hours} hours ago — moderate coverage gap"
        )

    if not reasons:
        reasons.append("No significant threat factors detected — routine monitoring active")

    return {"reasons": reasons}