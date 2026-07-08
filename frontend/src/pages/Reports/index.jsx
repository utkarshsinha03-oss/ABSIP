import { useMemo } from 'react';
import styles from './Reports.module.css';
import { useReports } from '../../hooks/useReports';

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function slugify(value) {
  return (value ?? '').toString().toLowerCase().replace(/\s+/g, '-');
}

function SeverityBadge({ severity }) {
  return (
    <span className={`${styles.badge} ${styles[`badge-${slugify(severity)}`] ?? styles['badge-default']}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[`badge-${slugify(status)}`] ?? styles['badge-default']}`}>
      {status}
    </span>
  );
}

export default function ReportsPage() {
  const { incidents, loading, error, refetch } = useReports();

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter((i) => slugify(i.resolution_status) === 'resolved').length;
    const responseTimes = incidents
      .map((i) => i.response_time_minutes)
      .filter((v) => typeof v === 'number');
    const avgResponse = responseTimes.length
      ? Math.round((responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length) * 10) / 10
      : null;
    const totalCasualties = incidents.reduce((sum, i) => sum + (typeof i.casualties === 'number' ? i.casualties : 0), 0);
    return { total, resolved, avgResponse, totalCasualties };
  }, [incidents]);

  const insights = useMemo(() => {
    const list = [];
    if (!incidents.length) return list;

    const severityCounts = incidents.reduce((acc, i) => {
      if (!i.severity) return acc;
      acc[i.severity] = (acc[i.severity] ?? 0) + 1;
      return acc;
    }, {});
    const severitySummary = Object.entries(severityCounts ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([level, count]) => `${level} (${count})`)
      .join(', ');
    if (severitySummary) {
      list.push(`Severity distribution: ${severitySummary}.`);
    }

    const responseTimes = incidents
      .map((i) => i.response_time_minutes)
      .filter((v) => typeof v === 'number');
    if (responseTimes.length) {
      const avg = Math.round((responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length) * 10) / 10;
      list.push(`Average response time across ${responseTimes.length} incident${responseTimes.length > 1 ? 's' : ''}: ${avg} min.`);
    }

    const sectorCounts = incidents.reduce((acc, i) => {
      if (!i.sector_id) return acc;
      acc[i.sector_id] = (acc[i.sector_id] ?? 0) + 1;
      return acc;
    }, {});
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
    if (topSector) {
      list.push(`${Object.keys(sectorCounts).length} sector${Object.keys(sectorCounts).length > 1 ? 's' : ''} affected — ${topSector[0]} has the most incidents (${topSector[1]}).`);
    }

    const resolved = incidents.filter((i) => slugify(i.resolution_status) === 'resolved').length;
    const unresolved = incidents.filter(
  (i) => slugify(i.resolution_status) !== 'resolved'
).length;
    list.push(`${resolved} resolved, ${unresolved} unresolved of ${incidents.length} total incidents.`);

    return list;
  }, [incidents]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>
            Intelligence Reports{error === 'backend_offline' ? ' — data unavailable' : ''}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={refetch} disabled={loading}>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>

      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Total Incidents</span>
          <span className={styles.overviewValue}>{stats.total}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Resolved Incidents</span>
          <span className={styles.overviewValue}>{stats.resolved}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Avg Response Time</span>
          <span className={styles.overviewValue}>{stats.avgResponse != null ? `${stats.avgResponse}m` : '—'}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Total Casualties</span>
          <span className={styles.overviewValue}>{stats.totalCasualties}</span>
        </div>
      </div>

      {error === 'backend_offline' && !loading && (
        <div className={styles.errorBanner}>
          Unable to reach the incident reporting service. Try refreshing.
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Sector</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Timestamp</th>
              <th>Response Time</th>
              <th>Resolution Status</th>
              <th>Casualties</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((i) => (
              <tr key={i.incident_id}>
                <td className={styles.callsign}>{i.incident_id}</td>
                <td>{i.sector_id}</td>
                <td>{i.incident_type}</td>
                <td><SeverityBadge severity={i.severity} /></td>
                <td className={styles.mono}>{formatDateTime(i.timestamp)}</td>
                <td className={styles.mono}>
                  {typeof i.response_time_minutes === 'number' ? `${i.response_time_minutes}m` : '—'}
                </td>
                <td><StatusBadge status={i.resolution_status} /></td>
                <td className={styles.mono}>
                  {typeof i.casualties === 'number' ? i.casualties : '—'}
                </td>
                <td className={styles.notes}>{i.notes || '—'}</td>
              </tr>
            ))}
            {!loading && incidents.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyRow}>No incident data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {insights.length > 0 && (
        <div className={styles.insightsPanel}>
          <h2 className={styles.insightsTitle}>Operational Insights</h2>
          <ul className={styles.insightsList}>
            {insights.map((line, idx) => (
              <li key={idx} className={styles.insightItem}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}