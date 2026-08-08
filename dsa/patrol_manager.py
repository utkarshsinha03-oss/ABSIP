import networkx as nx

from dsa.graph_builder import (
    load_sector_data,
    load_alerts,
    attach_alerts,
    build_absip_graph,
    haversine_distance,
)

from dsa.threat_ranker import rank_threats

PATROLS = [
    {
        "patrol_id": "P1",
        "current_sector": "S001"
    },
    {
        "patrol_id": "P2",
        "current_sector": "S020"
    },
    {
        "patrol_id": "P3",
        "current_sector": "S040"
    }
]

AVERAGE_PATROL_SPEED_KMPH = 35


def heuristic(graph, current_sector, target_sector):
    """
    A* heuristic: straight-line (haversine) distance between the current
    and target sector, in the same km unit as edge `distance`. Returns 0
    (always admissible) if either sector is missing valid coordinates.
    """
    current = graph.nodes[current_sector]
    target = graph.nodes[target_sector]

    lat1 = current.get("latitude")
    lon1 = current.get("longitude")
    lat2 = target.get("latitude")
    lon2 = target.get("longitude")

    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0

    return haversine_distance(lat1, lon1, lat2, lon2)


def generate_route_reasons(graph, path):
    route_reasons = []

    for i in range(len(path) - 1):
        destination = path[i + 1]
        data = graph.nodes[destination]

        if data.get("terrain_type") in ["Mountain", "River", "Hills"]:
            route_reasons.append(
                f"{destination} has difficult {data['terrain_type']} terrain"
            )

        if data.get("weather") in ["Fog", "Storm", "Dust Storm", "Snow"]:
            route_reasons.append(
                f"{destination} has adverse weather: {data['weather']}"
            )

        if data.get("visibility") == "Low":
            route_reasons.append(
                f"{destination} has low visibility"
            )

        if data.get("threat_score", 0) >= 70:
            route_reasons.append(
                f"{destination} is a high-risk sector"
            )

    if not route_reasons:
        route_reasons.append(
            "Route selected because it has the lowest combined operational cost"
        )

    return route_reasons


def assign_patrols(graph, ranked_sectors, patrols):

    available_patrols = patrols.copy()
    assignments = []

    for data in ranked_sectors:

        if not available_patrols:
            break

        sector_id = data["sector_id"]

        best_patrol = None
        best_distance = float("inf")
        best_path = None
        best_route_distance_km = 0

        for patrol in available_patrols:

            try:

                path = nx.astar_path(
                    graph,
                    patrol["current_sector"],
                    sector_id,
                    heuristic=lambda u, v: heuristic(graph, u, v),
                    weight="weight"
                )

                distance = nx.path_weight(
                    graph,
                    path,
                    weight="weight"
                )

                route_distance_km = sum(
                    graph[path[i]][path[i + 1]].get("distance", 0)
                    for i in range(len(path) - 1)
                )

                if distance < best_distance:

                    best_distance = distance
                    best_patrol = patrol
                    best_path = path
                    best_route_distance_km = route_distance_km

            except nx.NetworkXNoPath:
                continue

        if best_patrol:

            estimated_time_minutes = (
                round((best_route_distance_km / AVERAGE_PATROL_SPEED_KMPH) * 60)
                if best_route_distance_km
                else 0
            )

            assignments.append(
                {
                    "patrol": best_patrol,
                    "sector": sector_id,
                    "path": best_path,
                    "cost": round(best_distance, 2),
                    "route_distance_km": round(best_route_distance_km, 2),
                    "estimated_time_minutes": estimated_time_minutes,
                    "route_reasons": generate_route_reasons(graph, best_path),
                    "threat_score": data["threat_score"],
                    "threat_level": data["threat_level"],
                    "visibility": data["visibility"],
                    "weather": data["weather"],
                    "historical_risk": data["historical_risk"],
                    "last_patrol_hours": data["last_patrol_hours"],
                    "alerts": data["alerts"],
                    "reasons": data["reasons"]
                }
            )

            available_patrols.remove(best_patrol)

    return assignments

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

    ranked = rank_threats(graph)

    assignments = assign_patrols(
        graph,
        ranked,
        PATROLS
    )

    print("\n========== PATROL DISPATCH PLAN ==========\n")

    for assignment in assignments:

        print("------------------------------------------------------")

        print("Patrol ID          :", assignment["patrol"]["patrol_id"])

        print("Current Sector     :", assignment["patrol"]["current_sector"])

        print("Assigned Sector    :", assignment["sector"])

        print("Threat Score       :", assignment["threat_score"])

        print("Threat Level       :", assignment["threat_level"])

        print("Visibility         :", assignment["visibility"])

        print("Weather            :", assignment["weather"])

        print("Historical Risk    :", assignment["historical_risk"])

        print("Last Patrol Gap    :", assignment["last_patrol_hours"], "hours")

        print("Travel Cost        :", assignment["cost"])

        print("Route Distance     :", assignment["route_distance_km"], "km")

        print("Estimated Time     :", assignment["estimated_time_minutes"], "minutes")

        print("Recommended Route  :")

        print(" -> ".join(assignment["path"]))

        print("\nAlerts:")

        if assignment["alerts"]:
            for alert in assignment["alerts"]:
                print(
                    f"  • {alert['event']} ({alert['confidence']:.2f})"
                )
        else:
            print("  None")

        print("\nReasons:")

        if assignment["reasons"]:
            for reason in assignment["reasons"]:
                print(f"  • {reason}")
        else:
            print("  None")

        print("\nRoute Reasons:")

        for reason in assignment["route_reasons"]:
            print(f"  • {reason}")

        print()

    print("========== DISPATCH COMPLETE ==========")
