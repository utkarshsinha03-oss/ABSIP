"""
ABSIP — Threat Scoring Engine
Member 2: Intelligence Lead — Phase 2
Functions: calculate_threat_score(), get_threat_level(), generate_explanation()
"""

import json
import uuid
from datetime import datetime
from pathlib import Path

# ─────────────────────────────────────────────
# THREAT FACTOR WEIGHTS
# ─────────────────────────────────────────────

WEIGHTS = {
    "human_detection": {
        "none":                    0,
        "single_slow":            20,
        "single_directional":     35,
        "group":                  45,
        "armed_multiple":         55,
    },
    "vehicle_detection": {
        "none":                    0,
        "parked":                 10,
        "slow_moving":            20,
        "fast_toward_border":     35,
    },
    "visibility": {
        "High":    0,
        "Medium":  5,
        "Low":    12,
    },
    "weather": {
        "Clear":       0,
        "Rain":        3,
        "Fog":         7,
        "Storm":       8,
        "Snow":        4,
        "Dust Storm":  7,
    },
    "patrol_gap": {
        "0-1h":   0,
        "1-2h":   3,
        "2-4h":   6,
        "4h+":   10,
    },
    # historical_risk is a raw score 1–10, used directly
}


# ─────────────────────────────────────────────
# HELPER: patrol gap bracket
# ─────────────────────────────────────────────

def _patrol_gap_score(hours: float) -> int:
    if hours <= 1:
        return 0
    elif hours <= 2:
        return 3
    elif hours <= 4:
        return 6
    else:
        return 10


# ─────────────────────────────────────────────
# 1. get_threat_level()
# ─────────────────────────────────────────────

def get_threat_level(score: int) -> str:
    """
    Convert a numeric threat score (0–100) into a threat level label.

    Args:
        score (int): Threat score between 0 and 100.

    Returns:
        str: One of 'Safe', 'Medium', 'High', 'Critical'
    """
    if score <= 30:
        return "Safe"
    elif score <= 60:
        return "Medium"
    elif score <= 80:
        return "High"
    else:
        return "Critical"


# ─────────────────────────────────────────────
# 2. calculate_threat_score()
# ─────────────────────────────────────────────

def calculate_threat_score(event: dict) -> dict:
    """
    Calculate a threat score from a detection event.

    Args:
        event (dict): Detection event with the following fields:
            - human_detected (str): 'none' | 'single_slow' | 'single_directional' | 'group' | 'armed_multiple'
            - vehicle_detected (str): 'none' | 'parked' | 'slow_moving' | 'fast_toward_border'
            - visibility (str): 'High' | 'Medium' | 'Low'
            - weather (str): 'Clear' | 'Rain' | 'Fog' | 'Storm' | 'Snow' | 'Dust Storm'
            - historical_risk (int): 1–10
            - last_patrol_hours (float): hours since last patrol

    Returns:
        dict: {
            "score": int,
            "level": str,
            "score_breakdown": dict
        }
    """
    human_key    = event.get("human_detected", "none")
    vehicle_key  = event.get("vehicle_detected", "none")
    visibility   = event.get("visibility", "High")
    weather      = event.get("weather", "Clear")
    hist_risk    = int(event.get("historical_risk", 0))
    patrol_hours = float(event.get("last_patrol_hours", 0))

    # Calculate individual factor scores
    human_score      = WEIGHTS["human_detection"].get(human_key, 0)
    vehicle_score    = WEIGHTS["vehicle_detection"].get(vehicle_key, 0)
    visibility_score = WEIGHTS["visibility"].get(visibility, 0)
    weather_score    = WEIGHTS["weather"].get(weather, 0)
    patrol_score     = _patrol_gap_score(patrol_hours)
    hist_score       = max(0, min(15, hist_risk))  # cap at 15

    total = human_score + vehicle_score + visibility_score + weather_score + patrol_score + hist_score
    total = min(100, total)  # cap at 100

    return {
        "score": total,
        "level": get_threat_level(total),
        "score_breakdown": {
            "human_detection":  human_score,
            "vehicle_detection": vehicle_score,
            "visibility":       visibility_score,
            "weather":          weather_score,
            "patrol_gap":       patrol_score,
            "historical_risk":  hist_score,
        }
    }


# ─────────────────────────────────────────────
# 3. generate_explanation()
# ─────────────────────────────────────────────

def generate_explanation(event: dict, score_breakdown: dict) -> dict:
    """
    Generate human-readable reasons for a threat score.

    Args:
        event (dict): The original detection event.
        score_breakdown (dict): Per-factor scores from calculate_threat_score().

    Returns:
        dict: { "reasons": [str, ...] }
    """
    reasons = []

    # Human detection
    human_key = event.get("human_detected", "none")
    human_messages = {
        "single_slow":        "Single individual detected with slow movement near border",
        "single_directional": "Single individual detected moving directly toward restricted zone",
        "group":              "Group of 2–4 individuals detected with directional movement",
        "armed_multiple":     "Multiple armed groups detected with fast movement toward border",
    }
    if human_key in human_messages:
        reasons.append(human_messages[human_key])

    # Vehicle detection
    vehicle_key = event.get("vehicle_detected", "none")
    vehicle_messages = {
        "parked":             "Unidentified vehicle parked near border zone",
        "slow_moving":        "Slow-moving vehicle detected near restricted area",
        "fast_toward_border": "Fast-moving vehicle heading toward border at high speed",
    }
    if vehicle_key in vehicle_messages:
        reasons.append(vehicle_messages[vehicle_key])

    # Visibility
    visibility = event.get("visibility", "High")
    if visibility == "Low":
        weather = event.get("weather", "")
        reasons.append(f"Visibility is critically low due to {weather} conditions")
    elif visibility == "Medium":
        reasons.append("Visibility is reduced — detection reliability may be affected")

    # Weather
    weather = event.get("weather", "Clear")
    if weather in ["Fog", "Storm", "Dust Storm"]:
        reasons.append(f"Severe weather condition ({weather}) increases infiltration risk")
    elif weather in ["Rain", "Snow"]:
        reasons.append(f"Adverse weather ({weather}) may reduce sensor effectiveness")

    # Historical risk
    hist_risk = int(event.get("historical_risk", 0))
    if hist_risk >= 8:
        reasons.append(f"Sector has active threat designation — historical risk score {hist_risk}/10")
    elif hist_risk >= 5:
        reasons.append(f"Sector has moderate incident history — historical risk score {hist_risk}/10")
    elif hist_risk > 0:
        reasons.append(f"Sector has low but non-zero incident history — score {hist_risk}/10")

    # Patrol gap
    patrol_hours = float(event.get("last_patrol_hours", 0))
    if patrol_hours > 4:
        reasons.append(f"Sector has not been patrolled for {patrol_hours} hours — high exploitation window")
    elif patrol_hours > 2:
        reasons.append(f"Last patrol was {patrol_hours} hours ago — moderate gap")
    elif patrol_hours > 1:
        reasons.append(f"Last patrol was {patrol_hours} hours ago — within acceptable range")

    if not reasons:
        reasons.append("No significant threat factors detected — routine monitoring active")

    return {"reasons": reasons}


# ─────────────────────────────────────────────
# 4. FULL PIPELINE: assess_threat()
# ─────────────────────────────────────────────

def assess_threat(sector_id: str, event: dict, confidence: float = 1.0) -> dict:
    """
    Full pipeline: takes a raw event and returns a complete threat assessment.
    This is what Member 1 (backend) will call.

    Args:
        sector_id (str): The sector where the event occurred.
        event (dict): Detection event data.
        confidence (float): Sensor confidence score (0.0–1.0).

    Returns:
        dict: Complete threat assessment payload.
    """
    # Confidence gate — ignore low-confidence detections
    if confidence < 0.50:
        return {
            "alert_id": str(uuid.uuid4()),
            "sector_id": sector_id,
            "status": "discarded",
            "reason": f"Confidence {confidence} below threshold (0.50) — likely false positive",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

    result     = calculate_threat_score(event)
    explanation = generate_explanation(event, result["score_breakdown"])

    alert_status = "unverified" if confidence < 0.90 else "confirmed"

    recommended_actions = {
        "Safe":     "continue_monitoring",
        "Medium":   "notify_operator",
        "High":     "dispatch_patrol",
        "Critical": "emergency_response",
    }

    return {
        "alert_id":           str(uuid.uuid4()),
        "sector_id":          sector_id,
        "confidence":         confidence,
        "alert_status":       alert_status,
        "threat_score":       result["score"],
        "threat_level":       result["level"],
        "recommended_action": recommended_actions[result["level"]],
        "score_breakdown":    result["score_breakdown"],
        "reasons":            explanation["reasons"],
        "timestamp":          datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ─────────────────────────────────────────────
# 5. TEST SCENARIOS (10–20)
# ─────────────────────────────────────────────

TEST_SCENARIOS = [
    {
        "name": "Scenario 01 — Armed group, storm, no patrol",
        "sector_id": "S001",
        "confidence": 0.97,
        "event": {
            "human_detected":    "armed_multiple",
            "vehicle_detected":  "fast_toward_border",
            "visibility":        "Low",
            "weather":           "Storm",
            "historical_risk":   9,
            "last_patrol_hours": 6.0,
        },
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 02 — Single intruder, foggy night",
        "sector_id": "S012",
        "confidence": 0.91,
        "event": {
            "human_detected":    "single_directional",
            "vehicle_detected":  "none",
            "visibility":        "Low",
            "weather":           "Fog",
            "historical_risk":   7,
            "last_patrol_hours": 3.5,
        },
        "expected_level": "High",
    },
    {
        "name": "Scenario 03 — Suspicious vehicle, clear day",
        "sector_id": "S023",
        "confidence": 0.88,
        "event": {
            "human_detected":    "none",
            "vehicle_detected":  "slow_moving",
            "visibility":        "High",
            "weather":           "Clear",
            "historical_risk":   5,
            "last_patrol_hours": 2.0,
        },
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 04 — All clear, recent patrol",
        "sector_id": "S034",
        "confidence": 0.95,
        "event": {
            "human_detected":    "none",
            "vehicle_detected":  "none",
            "visibility":        "High",
            "weather":           "Clear",
            "historical_risk":   1,
            "last_patrol_hours": 0.5,
        },
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 05 — Low confidence detection (discarded)",
        "sector_id": "S007",
        "confidence": 0.42,
        "event": {
            "human_detected":    "single_slow",
            "vehicle_detected":  "none",
            "visibility":        "Medium",
            "weather":           "Rain",
            "historical_risk":   3,
            "last_patrol_hours": 1.5,
        },
        "expected_level": "discarded",
    },
    {
        "name": "Scenario 06 — Group spotted, dust storm",
        "sector_id": "S041",
        "confidence": 0.93,
        "event": {
            "human_detected":    "group",
            "vehicle_detected":  "parked",
            "visibility":        "Low",
            "weather":           "Dust Storm",
            "historical_risk":   8,
            "last_patrol_hours": 5.0,
        },
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 07 — Parked vehicle, high-risk sector",
        "sector_id": "S018",
        "confidence": 0.79,
        "event": {
            "human_detected":    "none",
            "vehicle_detected":  "parked",
            "visibility":        "Medium",
            "weather":           "Clear",
            "historical_risk":   9,
            "last_patrol_hours": 4.5,
        },
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 08 — Single slow mover, long patrol gap",
        "sector_id": "S029",
        "confidence": 0.90,
        "event": {
            "human_detected":    "single_slow",
            "vehicle_detected":  "none",
            "visibility":        "Medium",
            "weather":           "Rain",
            "historical_risk":   4,
            "last_patrol_hours": 5.0,
        },
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 09 — Fast vehicle, clear conditions",
        "sector_id": "S005",
        "confidence": 0.96,
        "event": {
            "human_detected":    "none",
            "vehicle_detected":  "fast_toward_border",
            "visibility":        "High",
            "weather":           "Clear",
            "historical_risk":   6,
            "last_patrol_hours": 3.0,
        },
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 10 — Snow conditions, moderate risk",
        "sector_id": "S038",
        "confidence": 0.85,
        "event": {
            "human_detected":    "single_slow",
            "vehicle_detected":  "none",
            "visibility":        "Low",
            "weather":           "Snow",
            "historical_risk":   5,
            "last_patrol_hours": 2.5,
        },
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 11 — Armed group, active threat sector",
        "sector_id": "S002",
        "confidence": 0.99,
        "event": {
            "human_detected":    "armed_multiple",
            "vehicle_detected":  "none",
            "visibility":        "High",
            "weather":           "Clear",
            "historical_risk":   10,
            "last_patrol_hours": 1.0,
        },
        "expected_level": "High",
    },
    {
        "name": "Scenario 12 — Unverified detection (confidence 0.77)",
        "sector_id": "S015",
        "confidence": 0.77,
        "event": {
            "human_detected":    "single_directional",
            "vehicle_detected":  "none",
            "visibility":        "Medium",
            "weather":           "Clear",
            "historical_risk":   3,
            "last_patrol_hours": 1.0,
        },
        "expected_level": "Medium",
    },
]


# ─────────────────────────────────────────────
# 6. RUN TESTS
# ─────────────────────────────────────────────

def run_tests():
    print("=" * 60)
    print("ABSIP — Threat Engine Test Results")
    print("=" * 60)

    passed = 0
    failed = 0
    results = []

    for scenario in TEST_SCENARIOS:
        output = assess_threat(
            sector_id=scenario["sector_id"],
            event=scenario["event"],
            confidence=scenario["confidence"],
        )

        # Get actual level
        if output.get("status") == "discarded":
            actual_level = "discarded"
        else:
            actual_level = output["threat_level"]

        expected = scenario["expected_level"]
        status = "✅ PASS" if actual_level == expected else "❌ FAIL"

        if actual_level == expected:
            passed += 1
        else:
            failed += 1

        print(f"\n{status} | {scenario['name']}")
        print(f"         Expected: {expected} | Got: {actual_level}", end="")
        if output.get("status") != "discarded":
            print(f" | Score: {output['threat_score']}")
            for r in output["reasons"]:
                print(f"         → {r}")
        else:
            print(f"\n         → {output['reason']}")

        results.append(output)

    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed out of {len(TEST_SCENARIOS)} scenarios")
    print("=" * 60)

    # Save results to JSON
    output_path = Path("data/test_results.json")
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nTest results saved to {output_path}")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    run_tests()