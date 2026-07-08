import { useState, useEffect, useCallback } from 'react';
import { getAlerts } from '../api/alertApi';

const MOCK_ALERTS = [
  { id: 'ALT-001', title: 'Unidentified Drone Detected',     sector: 'SEC-01', threat_level: 'critical', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: 'ALT-002', title: 'Seismic Anomaly — Perimeter B',   sector: 'SEC-03', threat_level: 'high',     timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 'ALT-003', title: 'Vehicle Tracks: North Corridor',  sector: 'SEC-02', threat_level: 'high',     timestamp: new Date(Date.now() - 28 * 60000).toISOString() },
  { id: 'ALT-004', title: 'Acoustic Trigger: Fence Line 7',  sector: 'SEC-05', threat_level: 'medium',   timestamp: new Date(Date.now() - 55 * 60000).toISOString() },
  { id: 'ALT-005', title: 'Cyber Probe on BSIP Gateway',     sector: 'SEC-01', threat_level: 'critical', timestamp: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 'ALT-006', title: 'Low-visibility Condition: Fog',   sector: 'SEC-04', threat_level: 'low',      timestamp: new Date(Date.now() - 120 * 60000).toISOString() },
];

export function useAlerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts();
      setAlerts(Array.isArray(data) ? data : data?.alerts ?? []);
    } catch (err) {
      console.warn('[useAlerts] Backend unreachable, using mock data');
      setAlerts(MOCK_ALERTS);
      setError('backend_offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { alerts, loading, error, refetch: fetch };
}