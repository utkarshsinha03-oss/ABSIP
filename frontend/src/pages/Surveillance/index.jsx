import { useMemo } from 'react';
import styles from './Surveillance.module.css';
import { useSensors } from '../../hooks/useSensors';

// Maintenance older than this is flagged as overdue in insights.
// Not a backend field — a display-only threshold since the schema
// has no explicit maintenance-interval field.
const MAINTENANCE_OVERDUE_DAYS = 90;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function statusClass(status) {
  return (status ?? '').toLowerCase().replace(/\s+/g, '-');
}

function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[`badge-${statusClass(status)}`] ?? styles['badge-default']}`}>
      {status}
    </span>
  );
}

export default function SurveillancePage() {
  const { sensors, loading, error, refetch } = useSensors();

  const stats = useMemo(() => {
    const total = sensors.length;
    const active = sensors.filter((s) => statusClass(s.operational_status) === 'active').length;
    const typeSet = new Set(sensors.map((s) => s.sensor_type).filter(Boolean));
    const ranges = sensors
      .map((s) => s.detection_range_m)
      .filter((v) => typeof v === 'number');
    const avgRange = ranges.length
      ? Math.round(ranges.reduce((sum, v) => sum + v, 0) / ranges.length)
      : null;
    return { total, active, typeCount: typeSet.size, avgRange };
  }, [sensors]);

  const insights = useMemo(() => {
    const list = [];
    if (!sensors.length) return list;

    const active = sensors.filter((s) => statusClass(s.operational_status) === 'active').length;
    list.push(`${active} of ${sensors.length} sensors currently active.`);

    const sectorsCovered = new Set(sensors.map((s) => s.sector_id).filter(Boolean)).size;
    list.push(`${sectorsCovered} sector${sectorsCovered !== 1 ? 's' : ''} covered by deployed sensors.`);
    const typeCounts = sensors.reduce((acc, s) => {
    
      if (!s.sensor_type) return acc;
      acc[s.sensor_type] = (acc[s.sensor_type] ?? 0) + 1;
      return acc;
    }, {});
    const typeSummary = Object.entries(typeCounts ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');
    if (typeSummary) {
      list.push(`Sensor type distribution: ${typeSummary}.`);
    }

    const overdue = sensors.filter((s) => {
      const days = daysSince(s.last_maintenance_date);
      return days != null && days > MAINTENANCE_OVERDUE_DAYS;
    });
    if (overdue.length) {
      list.push(`${overdue.length} sensor${overdue.length > 1 ? 's' : ''} overdue for maintenance (>${MAINTENANCE_OVERDUE_DAYS} days since last service).`);
    }

    return list;
  }, [sensors]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Surveillance</h1>
          <p className={styles.subtitle}>
            Sensor Command Center{error === 'backend_offline' ? ' — data unavailable' : ''}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={refetch} disabled={loading}>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>

      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Total Sensors</span>
          <span className={styles.overviewValue}>{stats.total}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Active Sensors</span>
          <span className={styles.overviewValue}>{stats.active}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Sensor Types</span>
          <span className={styles.overviewValue}>{stats.typeCount}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Avg Detection Range</span>
          <span className={styles.overviewValue}>{stats.avgRange != null ? `${stats.avgRange}m` : '—'}</span>
        </div>
      </div>

      {error === 'backend_offline' && !loading && (
        <div className={styles.errorBanner}>
          Unable to reach the sensor service. Try refreshing.
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sensor ID</th>
              <th>Sector</th>
              <th>Sensor Type</th>
              <th>Status</th>
              <th>Detection Range</th>
              <th>Installed</th>
              <th>Last Maintenance</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s) => (
              <tr key={s.sensor_id}>
                <td className={styles.callsign}>{s.sensor_id}</td>
                <td>{s.sector_id}</td>
                <td>{s.sensor_type}</td>
                <td><StatusBadge status={s.operational_status} /></td>
                <td className={styles.mono}>
                  {typeof s.detection_range_m === 'number' ? `${s.detection_range_m}m` : '—'}
                </td>
                <td className={styles.mono}>{formatDate(s.installed_date)}</td>
                <td className={styles.mono}>{formatDate(s.last_maintenance_date)}</td>
              </tr>
            ))}
            {!loading && sensors.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>No sensor data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {insights.length > 0 && (
        <div className={styles.insightsPanel}>
          <h2 className={styles.insightsTitle}>Operational Insights</h2>
          <ul className={styles.insightsList}>
            {insights.map((line, i) => (
              <li key={i} className={styles.insightItem}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}