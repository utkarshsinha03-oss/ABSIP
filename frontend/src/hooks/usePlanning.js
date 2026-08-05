import { useState, useEffect, useCallback } from 'react';
import {
  getRankedSectors,
  getTopThreats,
  getPatrolAssignments,
  getAllSectors,
} from '../api/planningApi';

/**
 * Fetches ranked sectors, top threats, patrol assignments, and all
 * sectors in parallel for the Planning module.
 */
export default function usePlanning() {
  const [rankedSectors, setRankedSectors] = useState([]);
  const [topThreats, setTopThreats] = useState([]);
  const [patrolAssignments, setPatrolAssignments] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rankedData, topThreatsData, patrolData, sectorsData] = await Promise.all([
        getRankedSectors(),
        getTopThreats(),
        getPatrolAssignments(),
        getAllSectors(),
      ]);
      setRankedSectors(rankedData);
      setTopThreats(topThreatsData);
      setPatrolAssignments(patrolData);
      setSectors(sectorsData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    loading,
    error,
    rankedSectors,
    topThreats,
    patrolAssignments,
    sectors,
    refetch: fetch,
  };
}
