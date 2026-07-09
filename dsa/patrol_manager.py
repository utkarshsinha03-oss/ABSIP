import networkx as nx

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

        for patrol in available_patrols:

            try:

                path = nx.dijkstra_path(
                    graph,
                    patrol["current_sector"],
                    sector_id,
                    weight="weight"
                )

                distance = nx.dijkstra_path_length(
                    graph,
                    patrol["current_sector"],
                    sector_id,
                    weight="weight"
                )

                if distance < best_distance:

                    best_distance = distance
                    best_patrol = patrol
                    best_path = path

            except nx.NetworkXNoPath:
                continue

        if best_patrol:

            assignments.append(
                {
                    "patrol": best_patrol,
                    "sector": sector_id,
                    "path": best_path,
                    "cost": round(best_distance, 2),
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

        print()

    print("========== DISPATCH COMPLETE ==========")