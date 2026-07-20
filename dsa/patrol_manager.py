import networkx as nx
import json

from dsa.graph_builder import (
    load_sector_data,
    load_alerts,
    attach_alerts,
    build_absip_graph
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
def heuristic(graph, current_sector, target_sector):
    current = graph.nodes[current_sector]
    target = graph.nodes[target_sector]

    lat_difference = target["latitude"] - current["latitude"]
    lon_difference = target["longitude"] - current["longitude"]

    return (lat_difference ** 2 + lon_difference ** 2) ** 0.5

def generate_route_reasons(graph, path):
    route_reasons = []

    for i in range(len(path) - 1):
        destination = path[i + 1]
        data = graph.nodes[destination]

        if data["terrain_type"] in ["Mountain", "River", "Hills"]:
            route_reasons.append(
                f"{destination} has difficult {data['terrain_type']} terrain"
            )

        if data["weather"] in ["Fog", "Storm", "Dust Storm", "Snow"]:
            route_reasons.append(
                f"{destination} has adverse weather: {data['weather']}"
            )

        if data["visibility"] == "Low":
            route_reasons.append(
                f"{destination} has low visibility"
            )

        if data["threat_score"] >= 70:
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
        best_route_distance = 0

        for patrol in available_patrols:

            try:

                path = nx.astar_path(
                    graph,
                    patrol["current_sector"],
                    sector_id,
                    heuristic=lambda current, target: heuristic(
                        graph,
                        current,
                        target
                    ),

                    weight="weight"
                )

                distance = nx.path_weight(
                    graph,
                    path,
                    weight="weight"
                )
                route_distance = sum(
                    graph[path[i]][path[i + 1]]["distance"]
                    for i in range(len(path) - 1)
                )

                if distance < best_distance:

                    best_distance = distance
                    best_patrol = patrol
                    best_path = path
                    best_route_distance = route_distance

            except nx.NetworkXNoPath:
                continue

        if best_patrol:

            average_speed_kmph = 35

            estimated_time_hours = best_route_distance / average_speed_kmph
            estimated_time_minutes = round(estimated_time_hours * 60)

            route_reasons = generate_route_reasons(
                graph,
                best_path
            )



            assignments.append(
                {
                    "patrol_id": best_patrol["patrol_id"],
                    "current_sector": best_patrol["current_sector"],
                    "assigned_sector": sector_id,
                    "route": best_path,
                    "travel_cost": round(best_distance, 2),
                    "route_distance_km": round(best_route_distance, 2),
                    "estimated_time_minutes": estimated_time_minutes,
                    "threat_score": data["threat_score"],
                    "threat_level": data["threat_level"],
                    "visibility": data["visibility"],
                    "weather": data["weather"],
                    "historical_risk": data["historical_risk"],
                    "last_patrol_hours": data["last_patrol_hours"],
                    "alerts": data["alerts"],
                    "reasons": data["reasons"],
                    "route_reasons": route_reasons,           
                }
            )

            available_patrols.remove(best_patrol)

    return assignments

def generate_dispatch_plan():

    sectors = load_sector_data()
    alerts = load_alerts()

    sectors = attach_alerts(
        sectors,
        alerts
    )

    graph = build_absip_graph(
        sectors
    )

    ranked = rank_threats(
        graph
    )

    assignments = assign_patrols(
        graph,
        ranked,
        PATROLS
    )

    return assignments

def generate_patrol_plan():

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

    return assignments

if __name__ == "__main__":
     
    assignments = generate_patrol_plan()

    print("\n========== PATROL DISPATCH PLAN ==========\n")

    for assignment in assignments:

        print("------------------------------------------------------")

        print("Patrol ID          :", assignment["patrol_id"])

        print("Current Sector     :", assignment["current_sector"])

        print("Assigned Sector    :", assignment["assigned_sector"])

        print("Threat Score       :", assignment["threat_score"])

        print("Threat Level       :", assignment["threat_level"])

        print("Visibility         :", assignment["visibility"])

        print("Weather            :", assignment["weather"])

        print("Historical Risk    :", assignment["historical_risk"])

        print("Last Patrol Gap    :", assignment["last_patrol_hours"], "hours")

        print("Travel Cost        :", assignment["travel_cost"])

        print(
             "Route Distance     :",
             assignment["route_distance_km"],
             "km"
             )

        print(
            "Estimated Time     :",
            assignment["estimated_time_minutes"],
           "minutes"
             )

        print("Recommended Route  :")

        print(" -> ".join(assignment["route"]))

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
    print("\n========== JSON OUTPUT ==========\n")
    print(json.dumps(assignments, indent=2))