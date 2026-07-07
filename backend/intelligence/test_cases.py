"""
ABSIP — Intelligence Module Test Cases + Unit Tests
Member 2: Intelligence Lead — Phase 5

Run with: python test_cases.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from threat_engine import calculate_threat_score
from threat_levels import get_threat_level

# ─────────────────────────────────────────────
# 20 REALISTIC TEST SCENARIOS
# ─────────────────────────────────────────────

SCENARIOS = [
    {
        "name": "Scenario 01 — Human detected, fog, high risk, no patrol",
        "sector": {
            "sector_id": "B17",
            "visibility": "Low",
            "historical_risk": 8,
            "last_patrol_hours": 5,
            "weather": "Fog",
        },
        "alerts": [{"event": "human_detected", "confidence": 0.95}],
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 02 — All clear, recent patrol, good visibility",
        "sector": {
            "sector_id": "A01",
            "visibility": "High",
            "historical_risk": 1,
            "last_patrol_hours": 0.5,
            "weather": "Clear",
        },
        "alerts": [],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 03 — Vehicle detected, clear conditions",
        "sector": {
            "sector_id": "C05",
            "visibility": "High",
            "historical_risk": 4,
            "last_patrol_hours": 2.0,
            "weather": "Clear",
        },
        "alerts": [{"event": "vehicle_detected", "confidence": 0.88}],
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 04 — Drone detected, storm, high risk",
        "sector": {
            "sector_id": "D22",
            "visibility": "Low",
            "historical_risk": 9,
            "last_patrol_hours": 6,
            "weather": "Storm",
        },
        "alerts": [{"event": "drone_detected", "confidence": 0.92}],
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 05 — Low confidence alert (should be ignored)",
        "sector": {
            "sector_id": "E10",
            "visibility": "High",
            "historical_risk": 2,
            "last_patrol_hours": 1.0,
            "weather": "Clear",
        },
        "alerts": [{"event": "human_detected", "confidence": 0.40}],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 06 — Multiple alerts, fog, long patrol gap",
        "sector": {
            "sector_id": "F33",
            "visibility": "Low",
            "historical_risk": 7,
            "last_patrol_hours": 8,
            "weather": "Fog",
        },
        "alerts": [
            {"event": "human_detected", "confidence": 0.91},
            {"event": "vehicle_detected", "confidence": 0.85},
        ],
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 07 — Radar contact, medium visibility",
        "sector": {
            "sector_id": "G14",
            "visibility": "Medium",
            "historical_risk": 5,
            "last_patrol_hours": 3.0,
            "weather": "Rain",
        },
        "alerts": [{"event": "radar_contact", "confidence": 0.80}],
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 08 — No alerts but very high historical risk",
        "sector": {
            "sector_id": "H09",
            "visibility": "Low",
            "historical_risk": 10,
            "last_patrol_hours": 7,
            "weather": "Fog",
        },
        "alerts": [],
        "expected_level": "High",
    },
    {
        "name": "Scenario 09 — Thermal anomaly, dust storm",
        "sector": {
            "sector_id": "I41",
            "visibility": "Low",
            "historical_risk": 6,
            "last_patrol_hours": 4,
            "weather": "Dust Storm",
        },
        "alerts": [{"event": "thermal_anomaly", "confidence": 0.87}],
        "expected_level": "High",
    },
    {
        "name": "Scenario 10 — Safe sector, minor weather",
        "sector": {
            "sector_id": "J02",
            "visibility": "High",
            "historical_risk": 2,
            "last_patrol_hours": 1.0,
            "weather": "Rain",
        },
        "alerts": [],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 11 — Human detected, snow, moderate risk",
        "sector": {
            "sector_id": "K18",
            "visibility": "Medium",
            "historical_risk": 5,
            "last_patrol_hours": 3.5,
            "weather": "Snow",
        },
        "alerts": [{"event": "human_detected", "confidence": 0.78}],
        "expected_level": "High",
    },
    {
        "name": "Scenario 12 — Motion detected only, low risk sector",
        "sector": {
            "sector_id": "L07",
            "visibility": "High",
            "historical_risk": 2,
            "last_patrol_hours": 1.5,
            "weather": "Clear",
        },
        "alerts": [{"event": "motion_detected", "confidence": 0.82}],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 13 — Vehicle + human, active threat sector",
        "sector": {
            "sector_id": "M29",
            "visibility": "Low",
            "historical_risk": 9,
            "last_patrol_hours": 5,
            "weather": "Storm",
        },
        "alerts": [
            {"event": "human_detected", "confidence": 0.97},
            {"event": "vehicle_detected", "confidence": 0.93},
        ],
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 14 — Drone only, clear day, low risk",
        "sector": {
            "sector_id": "N11",
            "visibility": "High",
            "historical_risk": 3,
            "last_patrol_hours": 2.0,
            "weather": "Clear",
        },
        "alerts": [{"event": "drone_detected", "confidence": 0.85}],
        "expected_level": "Medium",
    },
    {
        "name": "Scenario 15 — Zero historical risk, no alerts",
        "sector": {
            "sector_id": "O03",
            "visibility": "High",
            "historical_risk": 0,
            "last_patrol_hours": 0,
            "weather": "Clear",
        },
        "alerts": [],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 16 — Unknown event type (graceful handling)",
        "sector": {
            "sector_id": "P44",
            "visibility": "Medium",
            "historical_risk": 4,
            "last_patrol_hours": 2.5,
            "weather": "Clear",
        },
        "alerts": [{"event": "unknown_event", "confidence": 0.90}],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 17 — Missing fields in sector (graceful handling)",
        "sector": {
            "sector_id": "Q55",
        },
        "alerts": [],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 18 — Radar + thermal, fog, long gap",
        "sector": {
            "sector_id": "R26",
            "visibility": "Low",
            "historical_risk": 7,
            "last_patrol_hours": 6,
            "weather": "Fog",
        },
        "alerts": [
            {"event": "radar_contact", "confidence": 0.88},
            {"event": "thermal_anomaly", "confidence": 0.91},
        ],
        "expected_level": "Critical",
    },
    {
        "name": "Scenario 19 — High confidence, low risk environment",
        "sector": {
            "sector_id": "S08",
            "visibility": "High",
            "historical_risk": 1,
            "last_patrol_hours": 0.5,
            "weather": "Clear",
        },
        "alerts": [{"event": "motion_detected", "confidence": 0.99}],
        "expected_level": "Safe",
    },
    {
        "name": "Scenario 20 — Max everything (stress test)",
        "sector": {
            "sector_id": "T99",
            "visibility": "Low",
            "historical_risk": 10,
            "last_patrol_hours": 10,
            "weather": "Storm",
        },
        "alerts": [
            {"event": "human_detected", "confidence": 1.0},
            {"event": "vehicle_detected", "confidence": 1.0},
            {"event": "drone_detected", "confidence": 1.0},
        ],
        "expected_level": "Critical",
    },
]


# ─────────────────────────────────────────────
# UNIT TESTS
# ─────────────────────────────────────────────

def test_score_always_in_range():
    """Every score must be between 0 and 100."""
    for s in SCENARIOS:
        result = calculate_threat_score(s["sector"], s["alerts"])
        assert 0 <= result["score"] <= 100, (
            f"Score out of range in {s['name']}: {result['score']}"
        )

def test_level_matches_score():
    """Every score must map to the correct threat level."""
    for s in SCENARIOS:
        result = calculate_threat_score(s["sector"], s["alerts"])
        expected_from_score = get_threat_level(result["score"])
        assert result["level"] == expected_from_score, (
            f"Level mismatch in {s['name']}: score={result['score']} gave {result['level']} but expected {expected_from_score}"
        )

def test_reasons_not_empty():
    """Every result must have at least one reason."""
    for s in SCENARIOS:
        result = calculate_threat_score(s["sector"], s["alerts"])
        assert len(result["reasons"]) >= 1, (
            f"No reasons returned in {s['name']}"
        )

def test_low_confidence_ignored():
    """Alerts with confidence < 0.50 must not affect score."""
    sector = {"sector_id": "TEST", "visibility": "High", "historical_risk": 0, "last_patrol_hours": 0, "weather": "Clear"}
    alerts_low = [{"event": "human_detected", "confidence": 0.30}]
    alerts_none = []
    result_low = calculate_threat_score(sector, alerts_low)
    result_none = calculate_threat_score(sector, alerts_none)
    assert result_low["score"] == result_none["score"], (
        f"Low confidence alert affected score: {result_low['score']} vs {result_none['score']}"
    )

def test_missing_sector_fields():
    """Missing sector fields must not crash the engine."""
    result = calculate_threat_score({"sector_id": "EMPTY"}, [])
    assert 0 <= result["score"] <= 100

def test_sector_id_in_output():
    """Output must always contain the correct sector_id."""
    sector = {"sector_id": "X99", "visibility": "High", "historical_risk": 0, "last_patrol_hours": 0, "weather": "Clear"}
    result = calculate_threat_score(sector, [])
    assert result["sector_id"] == "X99"


# ─────────────────────────────────────────────
# RUN SCENARIOS + UNIT TESTS
# ─────────────────────────────────────────────

def run_scenarios():
    print("=" * 65)
    print("ABSIP — Threat Intelligence Engine: Scenario Tests")
    print("=" * 65)

    passed = 0
    failed = 0

    for s in SCENARIOS:
        result = calculate_threat_score(s["sector"], s["alerts"])
        actual = result["level"]
        expected = s["expected_level"]
        status = "✅ PASS" if actual == expected else "❌ FAIL"

        if actual == expected:
            passed += 1
        else:
            failed += 1

        print(f"\n{status} | {s['name']}")
        print(f"         Score: {result['score']} | Level: {actual} | Expected: {expected}")
        for r in result["reasons"]:
            print(f"         → {r}")

    print("\n" + "=" * 65)
    print(f"Scenarios: {passed} passed, {failed} failed out of {len(SCENARIOS)}")
    print("=" * 65)


def run_unit_tests():
    print("\n" + "=" * 65)
    print("ABSIP — Unit Tests")
    print("=" * 65)

    tests = [
        ("Score always in range (0–100)",    test_score_always_in_range),
        ("Level matches score",               test_level_matches_score),
        ("Reasons never empty",               test_reasons_not_empty),
        ("Low confidence alerts ignored",     test_low_confidence_ignored),
        ("Missing sector fields handled",     test_missing_sector_fields),
        ("Sector ID present in output",       test_sector_id_in_output),
    ]

    passed = 0
    failed = 0

    for name, test_fn in tests:
        try:
            test_fn()
            print(f"✅ PASS | {name}")
            passed += 1
        except AssertionError as e:
            print(f"❌ FAIL | {name}")
            print(f"         {e}")
            failed += 1

    print("\n" + "=" * 65)
    print(f"Unit Tests: {passed} passed, {failed} failed out of {len(tests)}")
    print("=" * 65)


if __name__ == "__main__":
    run_scenarios()
    run_unit_tests()