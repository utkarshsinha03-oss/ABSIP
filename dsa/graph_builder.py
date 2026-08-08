import math
import networkx as nx
import random
from sqlalchemy import select

from backend.db import SessionLocal
from backend.models import Sector, Alert
from backend.intelligence.threat_engine import calculate_threat_score

EARTH_RADIUS_KM = 6371.0
DEFAULT_DISTANCE_KM = 5.0  # fallback when either sector is missing valid coordinates

TERRAIN_PENALTY = {
    "Plain": 0,
    "Grassland": 1,
    "Forest": 3,
    "Hills": 4,
    "Mountain": 6,
    "River": 5,
    "Desert": 4,
}

WEATHER_PENALTY = {
    "Clear": 0,
    "Rain": 2,
    "Snow": 3,
    "Fog": 5,
    "Storm": 6,
    "Dust Storm": 5,
}

VISIBILITY_PENALTY = {
    "High": 0,
    "Medium": 2,
    "Low": 5,
}


def _safe_float(value):
    """Convert a DB value to float; returns None if missing or not numeric."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def haversine_distance(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/long points, in kilometers."""
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    return EARTH_RADIUS_KM * c


def calculate_distance(source_data, destination_data):
    """
    Real geographic distance (km) between two graph nodes. Falls back to a
    fixed default if either sector has missing/invalid coordinates, rather
    than crashing the graph build.
    """
    lat1 = source_data.get("latitude")
    lon1 = source_data.get("longitude")
    lat2 = destination_data.get("latitude")
    lon2 = destination_data.get("longitude")

    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return DEFAULT_DISTANCE_KM

    return haversine_distance(lat1, lon1, lat2, lon2)


def build_absip_graph(sector_data):
    G = nx.Graph()
    for sector in sector_data:
        sector_id = sector["sector_id"]

        threat_result = calculate_threat_score(
            sector,
            sector.get("alerts", [])
        )

        G.add_node(
           sector_id,

           threat_score = threat_result["score"],

           threat_level = threat_result["level"],

           latitude = _safe_float(sector.get("latitude")),

           longitude = _safe_float(sector.get("longitude")),

           terrain_type = sector.get("terrain_type", "Plain"),

           score_breakdown = threat_result.get(
              "score_breakdown",
              {}
           ),

           reasons = threat_result.get(
               "reasons",
               []
           ),

           visibility = sector.get(
              "visibility_level",
              "High"
           ),

           weather = sector.get(
             "weather_condition",
             "Clear"
           ),

           historical_risk= sector.get(
             "historical_risk_score",
             0
           ),

          last_patrol_hours = sector.get(
             "patrol_gap_hours",
               0
          ),

          alerts = sector.get(
            "alerts",
            []
         )
)

    sectors = list(G.nodes())

    for i in range(len(sectors)-1):

        source = sectors[i]
        destination = sectors[i+1]

        distance = calculate_distance(
            G.nodes[source],
            G.nodes[destination]
        )

        cost = calculate_edge_cost(
             G.nodes[source],
             G.nodes[destination],
             distance
        )
        G.add_edge(
            source,
            destination,
            weight=cost,
            distance=distance
        )


    extra_edges = len(sectors)//2

    for _ in range(extra_edges):
        a,b=random.sample(
            sectors,
            2
        )

        if not G.has_edge(a,b):

            distance = calculate_distance(
                G.nodes[a],
                G.nodes[b]
            )

            cost = calculate_edge_cost(
                G.nodes[a],
                G.nodes[b],
                distance
            )
            G.add_edge(
                a,
                b,
                weight=cost,
                distance=distance
            )

    return G
def calculate_edge_cost(source_data, destination_data, distance):

    cost = distance
    threat = max(
        source_data["threat_score"],
        destination_data["threat_score"]
    )

    cost += threat * 0.1

    cost += TERRAIN_PENALTY.get(
        destination_data.get("terrain_type"),
        2
    )

    cost += WEATHER_PENALTY.get(
        destination_data.get("weather"),
        0
    )
    cost += WEATHER_PENALTY.get(
        source_data.get("weather"),
        0
    )

    cost += VISIBILITY_PENALTY.get(
        destination_data.get("visibility"),
        0
    )

    return round(cost, 2)
def load_sector_data():
    db = SessionLocal()

    sectors = db.execute(select(Sector)).scalars().all()

    result = []

    for s in sectors:
        result.append(
            {
                "sector_id": s.sector_id,
                "sector_name": s.sector_name,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "terrain_type": s.terrain_type,
                "weather_condition": s.weather_condition,
                "visibility_level": s.visibility_level,
                "historical_risk_score": s.historical_risk_score,
                "patrol_gap_hours": s.patrol_gap_hours,
                "active_threat_designation": s.active_threat_designation,
                "area_sq_km": s.area_sq_km,
                "last_incident_date": s.last_incident_date,
            }
        )

    db.close()
    return result



def load_alerts():
    db = SessionLocal()

    alerts = db.execute(select(Alert)).scalars().all()

    result = []

    for a in alerts:
        result.append(
            {
                "alert_id": a.alert_id,
                "sector_id": a.sector_id,
                "sensor_id": a.sensor_id,
                "event_type": a.event_type,
                "confidence": float(a.confidence),
                "threat_score": a.threat_score,
                "threat_level": a.threat_level,
                "alert_status": a.alert_status,
                "timestamp": a.timestamp,
                "recommended_action": a.recommended_action,
            }
        )

    db.close()
    return result


def attach_alerts(sectors, alerts):

    alert_map = {}

    for alert in alerts:

        sector_id = alert["sector_id"]

        if sector_id not in alert_map:
            alert_map[sector_id] = []

        alert_map[sector_id].append(
            {
                "event": alert["event_type"]
                .lower()
                .replace(" ","_")
                .replace("detection", "detected"),

                "confidence": alert["confidence"]

            }
        )


    for sector in sectors:

        sector_id = sector["sector_id"]

        sector["alerts"] = alert_map.get(
            sector_id,
            []
        )
        sector["visibility"]=sector.get(
            "visibility_level",
            "High"
        )
        sector["weather"] = sector.get(
             "weather_condition",
             "Clear"
        )
        sector["historical_risk"] = sector.get(
            "historical_risk_score",
            0
        )
        sector["last_patrol_hours"] = sector.get(
             "patrol_gap_hours",
             0
        )
    return sectors

if __name__ == "__main__":

    sectors = load_sector_data()

    alerts = load_alerts()

    sectors = attach_alerts(
        sectors,
        alerts
    )


    graph = build_absip_graph(
        sectors
    )


    print("Total Nodes:", graph.number_of_nodes())

    print("Total Edges:", graph.number_of_edges())


    print("\n========== ALL SECTOR DETAILS ==========")

    for node, data in graph.nodes(data=True):

        print("\n--------------------------------")
        print("Sector ID:", node)

        print("Threat Score:", data["threat_score"])

        print("Threat Level:", data["threat_level"])

        print("Visibility:", data["visibility"])

        print("Weather:", data["weather"])

        print("Historical Risk:", data["historical_risk"])

        print("Last Patrol Gap:", data["last_patrol_hours"], "hours")

        print("Alerts:")

        if len(data["alerts"]) == 0:
            print("No alerts")

        else:
            for alert in data["alerts"]:
                print(
                    " - Event:",
                    alert["event"],
                    "| Confidence:",
                    alert["confidence"]
                )


        print("Reasons:")

        if len(data["reasons"]) == 0:
            print("No reasons available")

        else:
            for reason in data["reasons"]:
                print(" -", reason)



    print("\n========== HIGHEST THREAT SECTOR ==========")


    highest = max(
        graph.nodes(data=True),
        key=lambda x: x[1]["threat_score"]
    )


    print("Sector:", highest[0])

    print("Score:", highest[1]["threat_score"])

    print("Level:", highest[1]["threat_level"])
