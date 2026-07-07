import { useState, useEffect, useCallback } from 'react';
import { getPatrolLogs } from '../api/communicationApi';

export function useCommunications() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPatrolLogs();
      setLogs(Array.isArray(data) ? data : data?.logs ?? []);
    } catch (err) {
      console.warn('[useCommunications] Backend unreachable');
      setLogs([]);
      setError('backend_offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    logs,
    loading,
    error,
    refetch: fetch,
  };
}