import networkx as nx
import random

G = nx.Graph()

for i in range(1, 51):
    G.add_node(f"B{i}")

for _ in range(120):
    sector1 = f"B{random.randint(1, 50)}"
    sector2 = f"B{random.randint(1, 50)}"

    if sector1 != sector2:
        G.add_edge(
            sector1,
            sector2,
            weight=random.randint(1, 10)
        )
threat_scores = {}

for i in range(1, 51):
    threat_scores[f"B{i}"] = random.randint(1, 100)

highest_threat_sector = max(threat_scores, key=threat_scores.get)
highest_threat_score = threat_scores[highest_threat_sector]

patrol = {
    "patrol_id": "P1",
    "current_sector": "B1"
}

try:
    route = nx.dijkstra_path(
        G,
        source=patrol["current_sector"],
        target=highest_threat_sector,
        weight="weight"
    )

    total_cost = nx.dijkstra_path_length(
        G,
        source=patrol["current_sector"],
        target=highest_threat_sector,
        weight="weight"
    )

except nx.NetworkXNoPath:
    route = []
    total_cost = float("inf")

print("\n========== ABSIP PLANNING ENGINE ==========\n")

print("Total Sectors:", len(G.nodes))
print("Total Routes:", len(G.edges))

print("\nPatrol Information")
print("-------------------")
print("Patrol ID:", patrol["patrol_id"])
print("Current Sector:", patrol["current_sector"])

print("\nHighest Threat Detected")
print("-----------------------")
print("Sector:", highest_threat_sector)
print("Threat Score:", highest_threat_score)

print("\nGenerated Route")
print("----------------")

if route:
    for sector in route:
        print(sector)
else:
    print("No valid route found.")

print("\nTotal Travel Cost:", total_cost)

print("\n==========================================")