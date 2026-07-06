import { useState, useEffect, useCallback } from 'react';
import { getSensors } from '../api/sensorApi';

export function useSensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSensors();
      setSensors(Array.isArray(data) ? data : data?.sensors ?? []);
    } catch (err) {
      console.warn('[useSensors] Backend unreachable');
      setSensors([]);
      setError('backend_offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    sensors,
    loading,
    error,
    refetch: fetch,
  };
}