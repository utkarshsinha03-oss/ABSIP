// Communications/index.jsx
import { useMemo } from 'react';
import styles from './Communications.module.css';
import { useCommunications } from '../../hooks/useCommunications';

const OUTCOME_STYLES = {
  clear: styles.badgeClear,
  successful: styles.badgeClear,
  completed: styles.badgeClear,
  suspicious: styles.badgeWarning,
  incident: styles.badgeCritical,
  breach: styles.badgeCritical,
};

function getOutcomeClass(outcome) {
  if (!outcome) return styles.badgeNeutral;
  const key = String(outcome).toLowerCase();
  return OUTCOME_STYLES[key] || styles.badgeNeutral;
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) return '—';
  const mins = Number(minutes);
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CommunicationsPage() {
  const { logs, loading, error, refetch } = useCommunications();

  const stats = useMemo(() => {
    const total = logs.length;

    const durations = logs
  .map((l) => Number(l.duration_minutes))
  .filter((v) => !Number.isNaN(v));

const avgDuration =
  durations.length
    ? durations.reduce((sum, value) => sum + value, 0) / durations.length
    : 0;

    const sectors = new Set(logs.map((l) => l.sector_id).filter(Boolean));

    const successful = logs.filter((l) => {
      const outcome = String(l.patrol_outcome || '').toLowerCase();
      return outcome === 'clear' || outcome === 'successful' || outcome === 'completed';
    }).length;

    return {
      total,
      avgDuration: avgDuration.toFixed(1),
      sectorCount: sectors.size,
      successful,
    };
  }, [logs]);

  const insights = useMemo(() => {
    if (logs.length === 0) return [];

    const outcomeCounts = logs.reduce((acc, l) => {
      const key = l.patrol_outcome || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const outcomeDistribution = Object.entries(outcomeCounts ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([outcome, count]) => `${outcome}: ${count}`)
      .join(' · ');

    const sectorCounts = logs.reduce((acc, l) => {
      const key = l.sector_id || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];

    const completed = logs.filter((l) => l.departure_time).length;

    return [
      `Outcome distribution — ${outcomeDistribution}`,
      `Highest activity sector — ${topSector ? `${topSector[0]} (${topSector[1]} logs)` : 'N/A'}`,
      `Completed patrol logs — ${completed} of ${logs.length}`,
      `Average patrol duration — ${stats.avgDuration} min`,
    ];
  }, [logs, stats.avgDuration]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Communications</h1>
          <p className={styles.subtitle}>Patrol log relay // sector traffic overview</p>
        </div>
        <button className={styles.refreshBtn} onClick={refetch} disabled={loading}>
          {loading ? 'SYNCING…' : 'REFRESH'}
        </button>
      </div>

      
       {error === 'backend_offline' && !loading && (
  <div className={styles.offlineBanner}>
    <span className={styles.offlineDot} />
    BACKEND UNREACHABLE — displaying last known state
  </div>
)}

      <div className={styles.overviewGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Patrol Logs</span>
          <span className={styles.cardValue}>{loading ? '—' : stats.total}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Avg Patrol Duration</span>
          <span className={styles.cardValue}>{loading ? '—' : `${stats.avgDuration}m`}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Sectors Covered</span>
          <span className={styles.cardValue}>{loading ? '—' : stats.sectorCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Successful / Clear</span>
          <span className={styles.cardValue}>{loading ? '—' : stats.successful}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Patrol ID</th>
              <th>Sector</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Duration</th>
              <th>Outcome</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className={styles.stateRow}>Loading patrol logs…</td>
              </tr>
            )}
            {!loading && logs.length === 0 && !error && (
              <tr>
                <td colSpan={8} className={styles.stateRow}>No patrol logs available.</td>
              </tr>
            )}
            {!loading &&
              logs.map((log) => (
                <tr key={log.log_id}>
                  <td>{log.log_id}</td>
                  <td>{log.patrol_id}</td>
                  <td>{log.sector_id}</td>
                  <td>{formatTime(log.arrival_time)}</td>
                  <td>{formatTime(log.departure_time)}</td>
                  <td>{formatDuration(log.duration_minutes)}</td>
                  <td>
                    <span className={`${styles.badge} ${getOutcomeClass(log.patrol_outcome)}`}>
                      {log.patrol_outcome || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className={styles.remarks}>{log.remarks || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.insightsPanel}>
        <h2 className={styles.insightsTitle}>Operational Insights</h2>
        {insights.length === 0 ? (
          <p className={styles.subtitle}>No data available for analysis.</p>
        ) : (
          <ul className={styles.insightsList}>
            {insights.map((insight, idx) => (
              <li key={idx} className={styles.insightItem}>{insight}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}