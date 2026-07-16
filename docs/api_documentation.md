# ABSIP / RAKSHAK — Backend API Documentation

Base URL: `http://localhost:8000`

---

## Health & Root

### GET /

Returns service status.
**Response:**

```json
{ "service": "RAKSHAK / ABSIP API", "status": "online" }
```

### GET /health

Health check endpoint.
**Response:**

```json
{ "status": "ok", "service": "RAKSHAK / ABSIP API" }
```

---

## Intelligence Endpoints

### GET /threat/{sector_id}

Returns current threat score, level, and reasons for a specific sector.

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| sector_id | string | e.g. "S001" |

**Response Example:**

```json
{
  "sector_id": "S001",
  "threat_score": 100,
  "threat_level": "Critical",
  "visibility": "High",
  "weather": "Clear",
  "historical_risk": 5,
  "last_patrol_hours": 2.2,
  "alerts": [{ "event": "radar_contact", "confidence": 0.76 }],
  "reasons": ["Radar contact detected with 76% confidence"]
}
```

**Errors:** `404` if sector not found.

---

### GET /explanation/{sector_id}

Returns a human-readable explanation of why a sector has its current threat level.

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| sector_id | string | e.g. "S001" |

**Response Example:**

```json
{
  "sector_id": "S001",
  "score": 100,
  "level": "Critical",
  "reasons": ["Radar contact detected with 76% confidence"]
}
```

**Errors:** `404` if sector not found.

---

### GET /alerts

Returns all raw alerts from the sensor/detection data.

**Response Example:**

```json
[{ "sector_id": "S001", "event_type": "Human Detection", "confidence": 0.76 }]
```

---

## Planning Endpoints

### GET /ranked-sectors

Returns all sectors ranked by threat score (highest first).

**Response:** List of sector threat objects (same shape as `/threat/{sector_id}`).

---

### GET /top-threats

Returns the top N highest-threat sectors.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| limit | int | 5 | Number of top sectors to return |

**Example:** `GET /top-threats?limit=3`

**Response:** List of sector threat objects.

---

### GET /sectors

Returns all sectors with current threat data (alias of `/ranked-sectors`).

---

### GET /patrol-assignments

Returns the recommended patrol dispatch plan — which patrol should go to which high-threat sector, and the route.

**Response Example:**

```json
[
  {
    "patrol": { "patrol_id": "P1", "current_sector": "S001" },
    "sector": "S001",
    "path": ["S001"],
    "cost": 0,
    "threat_score": 100,
    "threat_level": "Critical"
  }
]
```

---

## Error Format

All errors follow FastAPI's standard format:

```json
{ "detail": "Sector 'S999' not found" }
```

| Status Code | Meaning               |
| ----------- | --------------------- |
| 404         | Resource not found    |
| 500         | Internal server error |

---

## Notes for Frontend Integration

- CORS is enabled for `http://localhost:5173` (Vite dev server).
- All responses are JSON.
- Interactive testing available at `http://localhost:8000/docs` (Swagger UI).
