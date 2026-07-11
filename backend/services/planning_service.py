"""
Planning Service — builds and caches the ABSIP threat/patrol graph.

Wraps the DSA team's graph_builder, threat_ranker, and patrol_manager
modules so the FastAPI routers don't touch that logic directly.
"""

from dsa.graph_builder import (
    load_sector_data,
    load_alerts,
    attach_alerts,
    build_absip_graph,
)
from dsa.threat_ranker import rank_threats, get_highest_priority_sector
from dsa.patrol_manager import assign_patrols, PATROLS

# Simple in-memory cache so we don't rebuild the graph on every request
_graph_cache = None


def get_graph(force_refresh: bool = False):
    """
    Returns the cached ABSIP graph, building it if necessary.
    """
    global _graph_cache

    if _graph_cache is None or force_refresh:
        sectors = load_sector_data()
        alerts = load_alerts()
        sectors = attach_alerts(sectors, alerts)
        _graph_cache = build_absip_graph(sectors)

    return _graph_cache


def get_ranked_sectors():
    graph = get_graph()
    return rank_threats(graph)


def get_top_threat(n: int = 1):
    graph = get_graph()
    ranked = rank_threats(graph)
    if n == 1:
        return ranked[0] if ranked else None
    return ranked[:n]


def get_sector_threat(sector_id: str):
    graph = get_graph()
    if sector_id not in graph.nodes:
        return None
    data = graph.nodes[sector_id]
    return {
        "sector_id": sector_id,
        "threat_score": data["threat_score"],
        "threat_level": data["threat_level"],
        "visibility": data["visibility"],
        "weather": data["weather"],
        "historical_risk": data["historical_risk"],
        "last_patrol_hours": data["last_patrol_hours"],
        "alerts": data["alerts"],
        "reasons": data["reasons"],
    }


def get_patrol_assignments():
    graph = get_graph()
    ranked = rank_threats(graph)
    return assign_patrols(graph, ranked, PATROLS)