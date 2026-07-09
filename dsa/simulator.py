import time
from copy import deepcopy

from dsa.graph_builder import (
    load_sector_data,
    load_alerts,
    attach_alerts,
    build_absip_graph,
)

from dsa.threat_ranker import (
    rank_threats,
    get_highest_priority_sector,
)

from dsa.patrol_manager import (
    assign_patrols,
    PATROLS,
)

SIMULATION_DELAY = 0.25
THREAT_REDUCTION_AFTER_PATROL = 70
TOP_THREATS_TO_SHOW = 10

def line(char="=", size=80):
    print(char * size)


def section(title):
    print()
    line("=")
    print(title)
    line("=")


def subsection(title):
    print()
    line("-")
    print(title)
    line("-")


def format_route(path):
    return " -> ".join(path)


def load_intelligence_data():
    section("STEP 1: LOADING ABSIP INTELLIGENCE DATA")

    sectors = load_sector_data()
    alerts = load_alerts()

    sectors = attach_alerts(
        sectors,
        alerts
    )

    print("Sectors loaded :", len(sectors))
    print("Alerts loaded  :", len(alerts))

    return sectors, alerts


def create_graph(sectors):
    section("STEP 2: BUILDING BORDER SURVEILLANCE GRAPH")

    graph = build_absip_graph(
        sectors
    )

    print("Graph status : READY")
    print("Total nodes  :", graph.number_of_nodes())
    print("Total edges  :", graph.number_of_edges())

    return graph


def show_initial_threat_ranking(graph):
    section("STEP 3: INITIAL THREAT RANKING")

    ranked = rank_threats(graph)
    highest = get_highest_priority_sector(graph)

    print("Highest Priority Sector")
    print("Sector :", highest["sector_id"])
    print("Score  :", highest["threat_score"])
    print("Level  :", highest["threat_level"])

    print()
    print(f"Top {TOP_THREATS_TO_SHOW} Threat Sectors")

    for index, sector in enumerate(ranked[:TOP_THREATS_TO_SHOW], start=1):
        print(
            f"{index:02d}. "
            f"{sector['sector_id']} | "
            f"Score: {sector['threat_score']} | "
            f"Level: {sector['threat_level']} | "
            f"Weather: {sector['weather']} | "
            f"Visibility: {sector['visibility']}"
        )

    return ranked


def dispatch_initial_patrols(graph, ranked):
    section("STEP 4: PATROL DISPATCH PLAN")

    assignments = assign_patrols(
        graph,
        ranked,
        PATROLS
    )

    if not assignments:
        print("No patrol assignments created.")
        return []

    for assignment in assignments:
        print()
        line("-")
        print("Patrol ID       :", assignment["patrol"]["patrol_id"])
        print("Current Sector  :", assignment["patrol"]["current_sector"])
        print("Assigned Sector :", assignment["sector"])
        print("Threat Score    :", assignment["threat_score"])
        print("Threat Level    :", assignment["threat_level"])
        print("Weather         :", assignment["weather"])
        print("Visibility      :", assignment["visibility"])
        print("Travel Cost     :", assignment["cost"])
        print("Route           :", format_route(assignment["path"]))

    return assignments


def create_patrol_state(assignments):
    patrol_state = {}

    for assignment in assignments:
        patrol_id = assignment["patrol"]["patrol_id"]

        patrol_state[patrol_id] = {
            "patrol_id": patrol_id,
            "start_sector": assignment["patrol"]["current_sector"],
            "target_sector": assignment["sector"],
            "route": assignment["path"],
            "route_index": 0,
            "status": "READY",
            "travel_cost": assignment["cost"],
            "threat_score": assignment["threat_score"],
            "threat_level": assignment["threat_level"],
        }

    return patrol_state


def all_patrols_finished(patrol_state):
    for patrol in patrol_state.values():
        if patrol["status"] != "COMPLETED":
            return False

    return True


def simulate_patrol_movement(patrol_state):
    section("STEP 5: LIVE PATROL MOVEMENT")

    mission_log = []
    time_step = 0

    while not all_patrols_finished(patrol_state):
        time_step += 1

        subsection(f"TIME STEP {time_step}")

        for patrol_id, patrol in patrol_state.items():
            route = patrol["route"]
            index = patrol["route_index"]

            if patrol["status"] == "COMPLETED":
                print(f"{patrol_id} | COMPLETED at {patrol['target_sector']}")
                continue

            if index == 0:
                current_sector = route[index]
                patrol["status"] = "MOVING"

                print(
                    f"{patrol_id} | READY at {current_sector} | "
                    f"Target: {patrol['target_sector']}"
                )

                mission_log.append(
                    {
                        "time_step": time_step,
                        "patrol_id": patrol_id,
                        "event": "READY",
                        "sector": current_sector,
                    }
                )

                patrol["route_index"] += 1

            elif index < len(route):
                previous_sector = route[index - 1]
                current_sector = route[index]

                print(
                    f"{patrol_id} | MOVED | "
                    f"{previous_sector} -> {current_sector}"
                )

                mission_log.append(
                    {
                        "time_step": time_step,
                        "patrol_id": patrol_id,
                        "event": "MOVED",
                        "from": previous_sector,
                        "to": current_sector,
                    }
                )

                patrol["route_index"] += 1

                if current_sector == patrol["target_sector"]:
                    patrol["status"] = "ARRIVED"

                    print(
                        f"{patrol_id} | ARRIVED at target "
                        f"{patrol['target_sector']}"
                    )

                    mission_log.append(
                        {
                            "time_step": time_step,
                            "patrol_id": patrol_id,
                            "event": "ARRIVED",
                            "sector": current_sector,
                        }
                    )

            else:
                patrol["status"] = "COMPLETED"
                print(f"{patrol_id} | COMPLETED mission.")

                mission_log.append(
                    {
                        "time_step": time_step,
                        "patrol_id": patrol_id,
                        "event": "COMPLETED",
                        "sector": patrol["target_sector"],
                    }
                )

        time.sleep(SIMULATION_DELAY)

    return mission_log

def threat_level_from_score(score):
    if score >= 81:
        return "Critical"
    if score >= 61:
        return "High"
    if score >= 31:
        return "Medium"
    return "Safe"


def neutralize_sector(graph, sector_id):
    if sector_id not in graph.nodes:
        return None

    node = graph.nodes[sector_id]

    old_score = node["threat_score"]
    old_level = node["threat_level"]
    old_alert_count = len(node.get("alerts", []))

    new_score = max(
        0,
        old_score - THREAT_REDUCTION_AFTER_PATROL
    )

    new_level = threat_level_from_score(new_score)

    node["threat_score"] = new_score
    node["threat_level"] = new_level
    node["alerts"] = []
    node["last_patrol_hours"] = 0

    if "reasons" not in node:
        node["reasons"] = []

    node["reasons"].append(
        "Patrol completed successfully."
    )

    node["reasons"].append(
        "Threat score reduced after sector verification."
    )

    return {
        "sector_id": sector_id,
        "old_score": old_score,
        "new_score": new_score,
        "old_level": old_level,
        "new_level": new_level,
        "alerts_cleared": old_alert_count,
    }


def execute_threat_response(graph, assignments):
    section("STEP 6: THREAT RESPONSE AND SECTOR UPDATE")

    neutralization_report = []

    for assignment in assignments:
        sector_id = assignment["sector"]

        result = neutralize_sector(
            graph,
            sector_id
        )

        if result is None:
            continue

        neutralization_report.append(result)

        print()
        line("-")
        print("Sector          :", result["sector_id"])
        print("Old Score       :", result["old_score"])
        print("New Score       :", result["new_score"])
        print("Old Level       :", result["old_level"])
        print("New Level       :", result["new_level"])
        print("Alerts Cleared  :", result["alerts_cleared"])
        print("Patrol Gap      : reset to 0 hours")

    return neutralization_report

def count_threat_levels(ranked):
    counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Safe": 0,
    }

    for sector in ranked:
        level = sector["threat_level"]

        if level not in counts:
            counts[level] = 0

        counts[level] += 1

    return counts


def show_post_mission_ranking(graph):
    section("STEP 7: UPDATED THREAT RANKING")

    updated = rank_threats(graph)
    counts = count_threat_levels(updated)

    print("Threat Distribution After Patrol")
    print("Critical :", counts.get("Critical", 0))
    print("High     :", counts.get("High", 0))
    print("Medium   :", counts.get("Medium", 0))
    print("Safe     :", counts.get("Safe", 0))

    print()
    print(f"Top {TOP_THREATS_TO_SHOW} Remaining Threats")

    for index, sector in enumerate(updated[:TOP_THREATS_TO_SHOW], start=1):
        print(
            f"{index:02d}. "
            f"{sector['sector_id']} | "
            f"Score: {sector['threat_score']} | "
            f"Level: {sector['threat_level']} | "
            f"Patrol Gap: {sector['last_patrol_hours']} hrs"
        )

    return updated, counts


def calculate_mission_statistics(assignments, mission_log, neutralization_report):
    total_cost = sum(
        assignment["cost"]
        for assignment in assignments
    )

    average_cost = (
        total_cost / len(assignments)
        if assignments
        else 0
    )

    total_route_steps = sum(
        len(assignment["path"])
        for assignment in assignments
    )

    total_alerts_cleared = sum(
        report["alerts_cleared"]
        for report in neutralization_report
    )

    return {
        "patrols_deployed": len(assignments),
        "sectors_secured": len(neutralization_report),
        "total_cost": round(total_cost, 2),
        "average_cost": round(average_cost, 2),
        "movement_log_entries": len(mission_log),
        "route_steps": total_route_steps,
        "alerts_cleared": total_alerts_cleared,
    }


def show_final_report(assignments, mission_log, neutralization_report, counts):
    section("FINAL MISSION REPORT")

    stats = calculate_mission_statistics(
        assignments,
        mission_log,
        neutralization_report
    )

    print("Mission Statistics")
    print("Patrols Deployed      :", stats["patrols_deployed"])
    print("Sectors Secured       :", stats["sectors_secured"])
    print("Total Travel Cost     :", stats["total_cost"])
    print("Average Travel Cost   :", stats["average_cost"])
    print("Movement Log Entries  :", stats["movement_log_entries"])
    print("Route Steps Covered   :", stats["route_steps"])
    print("Alerts Cleared        :", stats["alerts_cleared"])

    print()
    print("Remaining Threat Distribution")
    print("Critical :", counts.get("Critical", 0))
    print("High     :", counts.get("High", 0))
    print("Medium   :", counts.get("Medium", 0))
    print("Safe     :", counts.get("Safe", 0))

    print()
    print("Patrol Summary")

    for assignment in assignments:
        print()
        print("Patrol :", assignment["patrol"]["patrol_id"])
        print("Target :", assignment["sector"])
        print("Route  :", format_route(assignment["path"]))
        print("Cost   :", assignment["cost"])
        print("Status : SUCCESS")

    print()
    line("=")
    print("ABSIP SIMULATION COMPLETED SUCCESSFULLY")
    line("=")
    print("✓ Graph built")
    print("✓ Threats ranked")
    print("✓ Patrols assigned")
    print("✓ Dijkstra routes computed")
    print("✓ Patrol movement simulated")
    print("✓ Threats neutralized")
    print("✓ Post-mission analytics generated")

def run_simulation():
    section("ABSIP BORDER SURVEILLANCE SIMULATOR")

    sectors, alerts = load_intelligence_data()

    graph = create_graph(sectors)

    ranked = show_initial_threat_ranking(graph)

    assignments = dispatch_initial_patrols(
        graph,
        ranked
    )

    if not assignments:
        print("No assignments generated. Simulation stopped.")
        return

    patrol_state = create_patrol_state(
        assignments
    )

    mission_log = simulate_patrol_movement(
        patrol_state
    )

    neutralization_report = execute_threat_response(
        graph,
        assignments
    )

    updated_ranking, counts = show_post_mission_ranking(
        graph
    )

    show_final_report(
        assignments,
        mission_log,
        neutralization_report,
        counts
    )


if __name__ == "__main__":
    run_simulation()
