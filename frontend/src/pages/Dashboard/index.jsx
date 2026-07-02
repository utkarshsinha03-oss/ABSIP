import { useMemo } from 'react';
import { Layers, Bell, ShieldAlert, Activity } from 'lucide-react';
import { useSectors } from '../../hooks/useSectors';
import { useAlerts } from '../../hooks/useAlerts';
import StatCard from '../../components/cards/StatCard/StatCard';
import SectorTable from '../../components/tables/SectorTable/SectorTable';
import AlertsPanel from '../../components/alerts/AlertsPanel/AlertsPanel';
import ThreatDistributionChart from '../../components/charts/ThreatDistributionChart/ThreatDistributionChart';
import { capitalize } from '../../utils/helpers';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { sectors, loading: sLoad, error: sErr, refetch: refetchSectors } = useSectors();
  const { alerts,  loading: aLoad, error: aErr, refetch: refetchAlerts  } = useAlerts();

  const highestThreat = useMemo(() => {
    const order = ['critical', 'high', 'medium', 'low'];
    if (!sectors.length) return null;
    const levels = sectors.map((s) => s.threat_level?.toLowerCase());
    for (const lvl of order) if (levels.includes(lvl)) return lvl;
    return 'low';
  }, [sectors]);

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.threat_level?.toLowerCase() === 'critical').length,
    [alerts]
  );

  const backendOffline = sErr === 'backend_offline' || aErr === 'backend_offline';

  return (
    <div className={styles.page}>
      {/* Offline banner */}
      {backendOffline && (
        <div className={styles.offlineBanner}>
          ⚠ Backend offline — displaying cached simulation data
        </div>
      )}

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={Layers}
          label="Total Sectors"
          value={sLoad ? null : sectors.length}
          sub="REGISTERED ZONES"
          accent="blue"
          loading={sLoad}
        />
        <StatCard
          icon={Bell}
          label="Active Alerts"
          value={aLoad ? null : alerts.length}
          sub={`${criticalCount} CRITICAL`}
          accent={criticalCount > 0 ? 'critical' : 'gold'}
          loading={aLoad}
        />
        <StatCard
          icon={ShieldAlert}
          label="Highest Threat"
          value={sLoad ? null : (highestThreat ? capitalize(highestThreat) : 'None')}
          sub="CURRENT ASSESSMENT"
          accent={highestThreat === 'critical' ? 'critical' : highestThreat === 'low' ? 'low' : 'gold'}
          loading={sLoad}
        />
        <StatCard
          icon={Activity}
          label="System Status"
          value={backendOffline ? 'Degraded' : 'Nominal'}
          sub={backendOffline ? 'BACKEND OFFLINE' : 'ALL SERVICES ONLINE'}
          accent={backendOffline ? 'critical' : 'low'}
          loading={false}
        />
      </div>

      {/* Main content */}
      <div className={styles.mainGrid}>
        <div className={styles.tableCol}>
          <SectorTable
            sectors={sectors}
            loading={sLoad}
            error={sErr !== 'backend_offline' ? sErr : null}
            onRetry={refetchSectors}
          />
        </div>
        <div className={styles.alertsCol}>
          <div className={styles.alertsPanelWrap}>
            <AlertsPanel
              alerts={alerts}
              loading={aLoad}
              error={aErr !== 'backend_offline' ? aErr : null}
              onRetry={refetchAlerts}
            />
          </div>
          <div className={styles.chartWrap}>
            <ThreatDistributionChart sectors={sectors} loading={sLoad} />
          </div>
        </div>
      </div>
    </div>
  );
}
