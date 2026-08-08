
from dsa.graph_builder import (
    load_sector_data,
    load_alerts,
    attach_alerts,
    build_absip_graph,
)
def rank_threats(graph):

    ranked_sectors = []

    for sector_id, data in graph.nodes(data=True):

        ranked_sectors.append(
            {
                "sector_id": sector_id,
                "threat_score": data["threat_score"],
                "threat_level": data["threat_level"],
                "score_breakdown": data.get("score_breakdown", {}),
                "visibility": data["visibility"],
                "weather": data["weather"],
                "historical_risk": data["historical_risk"],
                "last_patrol_hours": data["last_patrol_hours"],
                "alerts": data["alerts"],
                "reasons": data["reasons"],
            }
        )

    ranked_sectors.sort(
        key=lambda sector: (
            sector["threat_score"],
            sector["last_patrol_hours"],
            sector["historical_risk"],
            len(sector["alerts"]),
        ),
        reverse=True,
    )

    return ranked_sectors


def get_highest_priority_sector(graph):

    ranked = rank_threats(graph)

    if len(ranked) == 0:
        return None

    return ranked[0]


def print_threat_ranking(graph):

    ranked = rank_threats(graph)

    print("\n========== THREAT RANKING ==========\n")

    for rank, sector in enumerate(ranked, start=1):

        print(f"Rank #{rank}")
        print(f"Sector ID        : {sector['sector_id']}")
        print(f"Threat Score     : {sector['threat_score']}")
        print(f"Threat Level     : {sector['threat_level']}")
        print(f"Visibility       : {sector['visibility']}")
        print(f"Weather          : {sector['weather']}")
        print(f"Historical Risk  : {sector['historical_risk']}")
        print(f"Last Patrol Gap  : {sector['last_patrol_hours']} hours")

        print("Alerts:")

        if sector["alerts"]:
            for alert in sector["alerts"]:
                print(
                    f"  • {alert['event']} "
                    f"({alert['confidence']:.2f})"
                )
        else:
            print("  None")

        print("Reasons:")

        if sector["reasons"]:
            for reason in sector["reasons"]:
                print(f"  • {reason}")
        else:
            print("  None")

        print("-" * 60)


if __name__ == "__main__":

    sectors = load_sector_data()

    alerts = load_alerts()

    sectors = attach_alerts(
        sectors,
        alerts,
    )

    graph = build_absip_graph(
        sectors,
    )

    print_threat_ranking(graph)

    highest = get_highest_priority_sector(graph)

    print("\n========== HIGHEST PRIORITY ==========")
    print("Sector :", highest["sector_id"])
    print("Score  :", highest["threat_score"])
    print("Level  :", highest["threat_level"])