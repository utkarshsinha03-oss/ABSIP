import { useState, useEffect, useCallback } from 'react';
import { getIncidents } from '../api/reportApi';

export function useReports() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getIncidents();
      setIncidents(Array.isArray(data) ? data : data?.incidents ?? []);
    } catch (err) {
      console.warn('[useReports] Backend unreachable');
      setIncidents([]);
      setError('backend_offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    incidents,
    loading,
    error,
    refetch: fetch,
  };
}