# ABSIP — Threat Model Document
**Module:** Intelligence Layer  
**Owner:** Member 2 — Intelligence Lead  
**Version:** 2.0  
**Last Updated:** 2026-06-22  
**Status:** Phase 1 Complete

---

## Table of Contents

1. [Overview](#1-overview)
2. [Threat Factors](#2-threat-factors)
3. [Threat Scoring Logic](#3-threat-scoring-logic)
4. [Confidence Thresholds](#4-confidence-thresholds)
5. [Threat Response Levels](#5-threat-response-levels)
6. [Alert Schema](#6-alert-schema)
7. [Explainability Format](#7-explainability-format)
8. [Sample Scenarios](#8-sample-scenarios)
9. [Integration Notes](#9-integration-notes)
10. [Deliverables Checklist](#10-deliverables-checklist)

---

## 1. Overview

The Intelligence Layer is the decision-making brain of ABSIP. It receives structured event data from the sensor/detection layer and produces threat assessments, alert payloads, and explainability reports for operators and downstream modules.

**Core responsibility:** Convert raw sensor events into actionable, explainable threat scores.

**Inputs:** Detection events (human, vehicle, environmental conditions, historical data)  
**Outputs:** Threat score (0–100), threat level, alert payload, explainability report

---

## 2. Threat Factors

Each factor represents a condition that contributes to the overall threat score. Factors are evaluated independently and their weighted scores are summed.

---

### 2.1 Human Detection
**Max Weight:** 35  
**Why It Matters:** Unauthorized human movement is the most direct indicator of a potential intrusion attempt.

| Sub-condition | Score |
|---|---|
| No human detected | 0 |
| Single individual, stationary or slow | 15 |
| Single individual, directional movement toward border | 25 |
| Group of 2–4 individuals, directional movement | 30 |
| Multiple groups or armed individuals, fast movement | 35 |

---

### 2.2 Vehicle Detection
**Max Weight:** 25  
**Why It Matters:** Vehicles near the border may indicate smuggling, armed infiltration, or coordinated activity.

| Sub-condition | Score |
|---|---|
| No vehicle detected | 0 |
| Parked vehicle, no movement | 10 |
| Slow-moving vehicle, unclear intent | 18 |
| Fast-moving vehicle heading toward restricted zone | 25 |

---

### 2.3 Visibility
**Max Weight:** 10  
**Why It Matters:** Low visibility reduces detection effectiveness and increases the opportunity window for infiltrators.

| Sub-condition | Score |
|---|---|
| Clear visibility (>80%) | 0 |
| Moderate visibility (50–80%) | 4 |
| Low visibility (20–50%) — fog, dust, smoke | 7 |
| Near-zero visibility (<20%) — heavy fog or night without IR | 10 |

---

### 2.4 Historical Risk
**Max Weight:** 15  
**Why It Matters:** Sectors with a documented history of intrusion attempts are statistically higher-risk.

| Sub-condition | Score |
|---|---|
| No prior incidents | 0 |
| 1–2 prior incidents in last 6 months | 7 |
| 3–5 prior incidents in last 6 months | 11 |
| 6+ incidents or active threat designation | 15 |

---

### 2.5 Patrol Gap
**Max Weight:** 10  
**Why It Matters:** Sectors that have not been patrolled recently have a higher exploitation window.

| Sub-condition | Score |
|---|---|
| Patrolled within last 1 hour | 0 |
| 1–2 hours since last patrol | 3 |
| 2–4 hours since last patrol | 6 |
| More than 4 hours since last patrol | 10 |

---

### 2.6 Weather
**Max Weight:** 5  
**Why It Matters:** Adverse weather can mask movement, disrupt sensors, and reduce response capability.

| Sub-condition | Score |
|---|---|
| Clear / normal weather | 0 |
| Mild adverse weather (light rain, wind) | 2 |
| Severe weather (heavy rain, storm, blizzard) | 5 |

---

### Factor Summary Table

| Factor | Max Score | Rationale |
|---|---|---|
| Human Detection | 35 | Highest direct threat signal |
| Vehicle Detection | 25 | Indicates organized or equipped intrusion |
| Historical Risk | 15 | Sector-level risk multiplier |
| Visibility | 10 | Affects detection accuracy |
| Patrol Gap | 10 | Affects response readiness |
| Weather | 5 | Environmental amplifier |
| **Total** | **100** | |

---

## 3. Threat Scoring Logic

### 3.1 Formula

```
threat_score = sum of all active factor scores (capped at 100)
```

All factors are evaluated simultaneously. The final score is an integer between 0 and 100.

---

### 3.2 Threat Level Classification

| Score Range | Threat Level | Color Code |
|---|---|---|
| 0 – 30 | Safe | 🟢 Green |
| 31 – 60 | Medium | 🟡 Yellow |
| 61 – 80 | High | 🟠 Orange |
| 81 – 100 | Critical | 🔴 Red |

---

### 3.3 Worked Examples

**Example 1 — Medium Threat**

| Factor | Condition | Score |
|---|---|---|
| Human Detection | Single individual, directional movement | 25 |
| Historical Risk | 3 prior incidents in sector | 11 |
| Visibility | Low visibility (fog) | 7 |
| Vehicle Detection | None | 0 |
| Patrol Gap | Patrolled 1.5 hours ago | 3 |
| Weather | Clear | 0 |
| **Total** | | **46 → Medium** |

---

**Example 2 — Critical Threat**

| Factor | Condition | Score |
|---|---|---|
| Human Detection | Multiple groups, fast movement | 35 |
| Vehicle Detection | Fast-moving vehicle toward border | 25 |
| Historical Risk | Active threat designation | 15 |
| Visibility | Near-zero visibility | 10 |
| Patrol Gap | 5 hours since last patrol | 10 |
| Weather | Heavy rain | 5 |
| **Total** | | **100 → Critical** |

---

**Example 3 — Safe**

| Factor | Condition | Score |
|---|---|---|
| Human Detection | None | 0 |
| Vehicle Detection | None | 0 |
| Historical Risk | No prior incidents | 0 |
| Visibility | Clear | 0 |
| Patrol Gap | Patrolled 30 minutes ago | 0 |
| Weather | Clear | 0 |
| **Total** | | **0 → Safe** |

---

## 4. Confidence Thresholds

Every event generated by the detection layer includes a `confidence` value (0.0 – 1.0) representing the sensor's certainty in the detection. The intelligence layer uses this to filter and flag alerts.

| Confidence Range | Action |
|---|---|
| < 0.50 | Discard — likely false positive, log only |
| 0.50 – 0.74 | Log event, no alert generated |
| 0.75 – 0.89 | Generate alert, flag as `unverified` |
| ≥ 0.90 | Generate full alert, treat as confirmed detection |

> **Note:** Confidence does not affect the threat score calculation directly. It controls whether an alert is generated and how it is flagged.

---

## 5. Threat Response Levels

### 5.1 Response Actions by Level

| Threat Level | Automated Action | Human Action | Owner | Escalates To |
|---|---|---|---|---|
| Safe | Log event, continue passive monitoring | No action required | Automated System | — |
| Medium | Generate alert, notify sector operator | Acknowledge within 10 min | Sector Operator | High if unacknowledged in 10 min |
| High | Dispatch patrol unit to sector, increase surveillance frequency | Verify and respond within 5 min | Patrol Coordinator | Critical if unresolved in 5 min |
| Critical | Command center lockdown protocol, full sector alert | Immediate response | Central Command | National alert if escalated further |

---

### 5.2 Escalation Logic

```
Medium  →  [unacknowledged for 10 min]  →  High
High    →  [unresolved for 5 min]        →  Critical
Critical → [unresolved for 15 min]       →  National Escalation
```

All escalations are logged with timestamp and reason.

---

## 6. Alert Schema

Every alert generated by the intelligence layer must conform to this JSON schema.

### 6.1 Full Alert Payload

```json
{
  "alert_id": "a3f9c1d2-7b4e-4c2f-a812-1d9f3e5c7b0a",
  "sector": "B17",
  "coordinates": {
    "lat": 32.1045,
    "lon": 74.8312
  },
  "event_type": "human_detected",
  "confidence": 0.91,
  "alert_status": "open",
  "threat_score": 46,
  "threat_level": "Medium",
  "timestamp": "2026-06-22T10:00:00Z",
  "active_factors": [
    "human_detected",
    "historical_risk",
    "low_visibility",
    "patrol_gap"
  ],
  "recommended_action": "notify_operator",
  "explainability": {
    "score_breakdown": {
      "human_detection": 25,
      "historical_risk": 11,
      "visibility": 7,
      "vehicle_detection": 0,
      "patrol_gap": 3,
      "weather": 0
    },
    "reasons": [
      "Single individual detected moving toward restricted zone in sector B17 with 91% confidence",
      "Sector B17 has 3 prior intrusion incidents in the last 6 months (last recorded: 2026-05-10)",
      "Visibility at 30% due to fog conditions at time of detection",
      "Sector last patrolled 1.5 hours ago — within moderate gap threshold"
    ]
  }
}
```

---

### 6.2 Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `alert_id` | UUID string | Yes | Unique identifier for this alert (for tracking and deduplication) |
| `sector` | string | Yes | Sector code where the event was detected |
| `coordinates` | object | Yes | GPS coordinates of the event (used by mission planner for routing) |
| `event_type` | string | Yes | Primary event type: `human_detected`, `vehicle_detected`, `anomaly`, etc. |
| `confidence` | float (0–1) | Yes | Sensor confidence in the detection |
| `alert_status` | string | Yes | `open`, `acknowledged`, `resolved`, `escalated` |
| `threat_score` | integer (0–100) | Yes | Computed threat score |
| `threat_level` | string | Yes | `Safe`, `Medium`, `High`, `Critical` |
| `timestamp` | ISO 8601 | Yes | UTC timestamp of event detection |
| `active_factors` | array of strings | Yes | Machine-readable list of factors that contributed to the score |
| `recommended_action` | string | Yes | System-recommended action for the operator |
| `explainability` | object | Yes | Score breakdown per factor + human-readable reasons |

---

### 6.3 Recommended Action Values

| Threat Level | `recommended_action` value |
|---|---|
| Safe | `continue_monitoring` |
| Medium | `notify_operator` |
| High | `dispatch_patrol` |
| Critical | `emergency_response` |

---

## 7. Explainability Format

Every alert must include an explainability object. This is a core design principle of ABSIP — no threat score should be generated without a human-understandable justification.

### 7.1 Structure

```json
"explainability": {
  "score_breakdown": {
    "human_detection": 25,
    "vehicle_detection": 0,
    "visibility": 7,
    "historical_risk": 11,
    "patrol_gap": 3,
    "weather": 0
  },
  "reasons": [
    "Human movement detected in sector B17 with 91% confidence",
    "Sector B17 has 3 prior incidents in past 6 months",
    "Visibility at 30% due to fog",
    "Last patrol was 1.5 hours ago"
  ]
}
```

### 7.2 Rules for Reason Strings

- Every active factor (score > 0) must produce exactly one reason string.
- Reason strings must reference specific values where available (confidence %, number of incidents, hours since patrol, visibility %).
- Reason strings must be written in plain English suitable for an operator with no technical background.
- Factors with score = 0 are omitted from the reasons list (but included as 0 in `score_breakdown`).

---

## 8. Sample Scenarios

### Scenario 1 — Lone Infiltrator at Night

**Conditions:**
- Single individual detected moving toward restricted zone
- Confidence: 0.93
- Near-zero visibility (night, no IR support)
- Sector has 4 prior incidents
- Last patrol: 3 hours ago
- Clear weather

**Score Calculation:**

| Factor | Score |
|---|---|
| Human Detection | 25 |
| Visibility | 10 |
| Historical Risk | 15 |
| Patrol Gap | 6 |
| Vehicle Detection | 0 |
| Weather | 0 |
| **Total** | **56 → Medium** |

**Alert Level:** Medium  
**Recommended Action:** notify_operator

---

### Scenario 2 — Armed Group, Storm Conditions

**Conditions:**
- Multiple armed groups detected
- Confidence: 0.97
- Fast vehicle heading toward border
- Near-zero visibility
- Active threat sector (6+ incidents)
- Last patrol: 6 hours ago
- Heavy storm

**Score Calculation:**

| Factor | Score |
|---|---|
| Human Detection | 35 |
| Vehicle Detection | 25 |
| Visibility | 10 |
| Historical Risk | 15 |
| Patrol Gap | 10 |
| Weather | 5 |
| **Total** | **100 → Critical** |

**Alert Level:** Critical  
**Recommended Action:** emergency_response

---

### Scenario 3 — Low-Risk Routine Check

**Conditions:**
- No human or vehicle detected
- Clear visibility
- No historical incidents
- Patrolled 20 minutes ago
- Normal weather

**Score:** 0 → Safe  
**Action:** continue_monitoring (no alert generated)

---

### Scenario 4 — Unverified Detection

**Conditions:**
- Human detected, confidence: 0.62 (below full alert threshold)
- Clear visibility
- No historical incidents
- Recent patrol

**Action:** Event logged, no alert generated (confidence < 0.75)

---

### Scenario 5 — Vehicle Only, High-Risk Sector

**Conditions:**
- No human detected
- Slow-moving vehicle, unclear intent
- Confidence: 0.88
- Sector has 5 prior incidents
- Last patrol: 2.5 hours ago
- Light rain

**Score Calculation:**

| Factor | Score |
|---|---|
| Vehicle Detection | 18 |
| Historical Risk | 11 |
| Patrol Gap | 6 |
| Weather | 2 |
| Human Detection | 0 |
| Visibility | 0 |
| **Total** | **37 → Medium** |

**Alert Level:** Medium (flagged `unverified` due to confidence 0.88)  
**Recommended Action:** notify_operator

---

## 9. Integration Notes

### For Member 1 (Backend / Integration)
- All alerts must be published as JSON conforming to Section 6.1.
- The `alert_id` field must be a UUID v4, generated at alert creation time.
- Alert status transitions (`open → acknowledged → resolved`) should be managed by the backend API.
- The intelligence layer produces alerts; the backend is responsible for persistence and routing.

### For Member 3 (Mission Planning / DSA)
- The `coordinates` field in the alert payload provides the GPS location for patrol routing.
- The `threat_level` field should be used to prioritize path-planning (Critical sectors get highest routing priority).
- The `active_factors` array can be used to inform mission type (e.g., `vehicle_detected` may trigger a roadblock mission vs a foot patrol).

### For Phase 3 (AI/ML Enhancement)
- The `confidence` field is designed to accept ML model output scores directly.
- The `score_breakdown` in explainability is designed to be extended with feature importance values from ML models.
- Historical Risk factor will eventually be computed dynamically from a database of past incidents rather than being manually assigned.

---

## 10. Deliverables Checklist

| Deliverable | Status |
|---|---|
| Threat factors defined with descriptions | ✅ Done |
| Sub-level scoring for each factor | ✅ Done |
| Threat scoring formula and worked examples | ✅ Done |
| Confidence threshold table | ✅ Done |
| Threat response levels with escalation logic | ✅ Done |
| Full alert JSON schema with field definitions | ✅ Done |
| Explainability format with rules | ✅ Done |
| Sample scenarios (5 scenarios) | ✅ Done |
| Integration notes for other team members | ✅ Done |

---

*Document maintained by Member 2 — Intelligence Lead, ABSIP Project*