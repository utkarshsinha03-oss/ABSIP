import networkx as nx
import random
import json

from backend.intelligence.threat_engine import calculate_threat_score


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

        cost = calculate_edge_cost(
             G.nodes[source],
             G.nodes[destination],
             random.randint(1,10)
        )
        G.add_edge(
            source,
            destination,
            weight=cost
        )


    extra_edges = len(sectors)//2

    for _ in range(extra_edges):
        a,b=random.sample(
            sectors,
            2
        )

        if not G.has_edge(a,b):

            cost = calculate_edge_cost(
                G.nodes[a],
                 G.nodes[b],
                 random.randint(1,10)
            )
            G.add_edge(
                a,
                b,
                weight=cost
            )

    return G
def calculate_edge_cost(source_data, destination_data, distance):

    cost = distance
    threat = max(
        source_data["threat_score"],
        destination_data["threat_score"]
    )

    cost += threat * 0.1

    if destination_data["weather"] in [
        "Storm",
        "Fog",
        "Dust Storm"
    ]:
        cost += 5
    if source_data["weather"] in [
        "Storm",
        "Fog",
        "Dust Storm"
    ]:
        cost += 5

    if destination_data["visibility"] == "Low":
        cost += 3
    return cost
def load_sector_data():

    with open("data/sectors.json", "r") as f:
        sectors = json.load(f)

    return sectors



def load_alerts():

    with open("data/alerts.json", "r") as f:
        alerts = json.load(f)

    return alerts



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

