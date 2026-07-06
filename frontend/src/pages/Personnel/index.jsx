import { useMemo } from 'react';
import styles from './Personnel.module.css';
import { usePatrols } from '../../hooks/usePatrols';

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fuelTier(level) {
  if (level == null) return 'unknown';
  if (level <= 20) return 'critical';
  if (level <= 50) return 'medium';
  return 'high';
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

function FuelIndicator({ level }) {
  const tier = fuelTier(level);
  if (level == null) return <span className={styles.mono}>—</span>;
  return (
    <div className={styles.fuelWrap}>
      <div className={styles.fuelTrack}>
        <div
          className={`${styles.fuelFill} ${styles[`fuel-${tier}`]}`}
          style={{ width: `${Math.max(level, 4)}%` }}
        />
      </div>
      <span className={styles.fuelValue}>{level}%</span>
    </div>
  );
}

export default function PersonnelPage() {
  const { patrols, loading, error, refetch } = usePatrols();

  const stats = useMemo(() => {
    const total = patrols.length;
    const active = patrols.filter((p) => statusClass(p.status) === 'active').length;
    const personnelDeployed = patrols.reduce((sum, p) => sum + (p.team_size ?? 0), 0);
    const fuelValues = patrols
      .map((p) => p.fuel_level_percent)
      .filter((v) => typeof v === 'number');
    const avgFuel = fuelValues.length
      ? Math.round(fuelValues.reduce((sum, v) => sum + v, 0) / fuelValues.length)
      : null;
    return { total, active, personnelDeployed, avgFuel };
  }, [patrols]);

  const insights = useMemo(() => {
    const list = [];

    const lowFuel = patrols.filter(
      (p) => typeof p.fuel_level_percent === 'number' &&
        p.fuel_level_percent <= 20 &&
        statusClass(p.status) !== 'offline'
    );
    if (lowFuel.length) {
      list.push(`${lowFuel.length} patrol${lowFuel.length > 1 ? 's' : ''} critically low on fuel — recall or resupply advised.`);
    }

    const offline = patrols.filter((p) => statusClass(p.status) === 'offline');
    if (offline.length) {
      list.push(`${offline.length} patrol${offline.length > 1 ? 's' : ''} offline — last contact ${formatRelativeTime(offline[0].last_check_in)}.`);
    }

    const staleCheckIn = patrols.filter((p) => {
      if (!p.last_check_in) return false;
      const mins = (Date.now() - new Date(p.last_check_in).getTime()) / 60000;
      return mins > 30 && statusClass(p.status) !== 'offline';
    });
    if (staleCheckIn.length) {
      list.push(`${staleCheckIn.length} patrol${staleCheckIn.length > 1 ? 's' : ''} overdue for check-in (>30m).`);
    }

    const sectorsCovered = new Set(
      patrols
        .filter((p) => statusClass(p.status) === 'active')
        .map((p) => p.assigned_sector)
    ).size;
    if (patrols.length) {
      list.push(`${sectorsCovered} sector${sectorsCovered !== 1 ? 's' : ''} currently covered by active patrols.`);
    }

    return list;
  }, [patrols]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Personnel</h1>
          <p className={styles.subtitle}>
  Patrol Operations{error === 'backend_offline' ? ' — Simulation Mode' : ''}
</p>
        </div>
        <button className={styles.refreshBtn} onClick={refetch} disabled={loading}>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>

      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Total Patrols</span>
          <span className={styles.overviewValue}>{stats.total}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Active</span>
          <span className={styles.overviewValue}>{stats.active}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Personnel Deployed</span>
          <span className={styles.overviewValue}>{stats.personnelDeployed}</span>
        </div>
        <div className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Avg Fuel</span>
          <span className={styles.overviewValue}>{stats.avgFuel != null ? `${stats.avgFuel}%` : '—'}</span>
        </div>
      </div>

      {error === 'backend_offline' && !loading && (
  <div className={styles.errorBanner}>
    Using cached simulation data. Backend currently unavailable.
  </div>
)}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patrol</th>
              <th>Sector</th>
              <th>Vehicle</th>
              <th>Team</th>
              <th>Fuel</th>
              <th>Shift</th>
              <th>Channel</th>
              <th>Last Check-in</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patrols.map((p) => (
              <tr key={p.patrol_id}>
                <td className={styles.callsign}>{p.patrol_name}</td>
                <td>{p.assigned_sector}</td>
                <td>{p.vehicle_type}</td>
                <td>{p.team_size}</td>
                <td><FuelIndicator level={p.fuel_level_percent} /></td>
                <td>{p.shift}</td>
                <td className={styles.mono}>{p.communication_channel}</td>
                <td className={styles.mono}>{p.last_check_in ? formatRelativeTime(p.last_check_in) : '—'}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
            {!loading && patrols.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyRow}>No patrol data available.</td>
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