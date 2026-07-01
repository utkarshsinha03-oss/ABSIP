import { useState, useEffect, useCallback } from 'react';
import { getSectors } from '../api/sectorApi';

/**
 * Fetches and returns all sectors.
 * Falls back to mock data when the backend is unreachable.
 */
const MOCK_SECTORS = [
  { id: 'SEC-01', threat_score: 87, threat_level: 'critical', visibility: 'Obstructed' },
  { id: 'SEC-02', threat_score: 62, threat_level: 'high',     visibility: 'Clear' },
  { id: 'SEC-03', threat_score: 45, threat_level: 'medium',   visibility: 'Partial' },
  { id: 'SEC-04', threat_score: 18, threat_level: 'low',      visibility: 'Clear' },
  { id: 'SEC-05', threat_score: 73, threat_level: 'high',     visibility: 'Clear' },
  { id: 'SEC-06', threat_score: 31, threat_level: 'low',      visibility: 'Partial' },
];

export function useSectors() {
  const [sectors, setSectors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSectors();
      setSectors(Array.isArray(data) ? data : data?.sectors ?? []);
    } catch (err) {
      // Backend offline – use mock data so the UI is always functional
      console.warn('[useSectors] Backend unreachable, using mock data');
      setSectors(MOCK_SECTORS);
      setError('backend_offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { sectors, loading, error, refetch: fetch };
}
