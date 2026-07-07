import { useState, useEffect, useCallback } from 'react';
import { getPatrols } from '../api/patrolApi';

const MOCK_PATROLS = [
  {
    patrol_id: 'P001',
    patrol_name: 'Patrol Unit 1',
    assigned_sector: 'S006',
    status: 'Active',
    team_size: 7,
    vehicle_type: 'Helicopter',
    fuel_level_percent: 81,
    shift: 'Morning',
    communication_channel: 'CH-5',
    last_check_in: new Date().toISOString(),
  },
];

export function usePatrols() {
  const [patrols, setPatrols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPatrols();
      setPatrols(Array.isArray(data) ? data : data?.patrols ?? []);
    } catch (err) {
      console.warn('[usePatrols] Backend unreachable, using mock data');
      setPatrols(MOCK_PATROLS);
      setError('backend_offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    patrols,
    loading,
    error,
    refetch: fetch,
  };
}