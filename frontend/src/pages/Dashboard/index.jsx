import { useMemo, useState, useRef } from 'react';
import { Siren, Bell, ShieldAlert, Activity } from 'lucide-react';
import { useSectors } from '../../hooks/useSectors';
import { useAlerts } from '../../hooks/useAlerts';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import StatCard from '../../components/cards/StatCard/StatCard';
import SectorTable from '../../components/tables/SectorTable/SectorTable';
import AlertsPanel from '../../components/alerts/AlertsPanel/AlertsPanel';
import AlertDetailsDrawer from "../../components/alerts/AlertDetailsDrawer";
import SectorDetailsDrawer from "../../components/tables/SectorDetailsDrawer";
import ThreatDistributionChart from '../../components/charts/ThreatDistributionChart/ThreatDistributionChart';
import styles from './Dashboard.module.css';

const MISSION_STATUS = {
  critical: { label: 'Critical Alert', accent: 'critical' },
  high:     { label: 'Heightened',     accent: 'gold' },
  medium:   { label: 'Elevated',       accent: 'gold' },
  low:      { label: 'Nominal',        accent: 'low' },
};
const MISSION_STATUS_DEFAULT = { label: 'Standby', accent: 'low' };

export default function DashboardPage() {
  const { sectors, loading: sLoad, error: sErr, refetch: refetchSectors } = useSectors();
  const { alerts,  loading: aLoad, error: aErr, refetch: refetchAlerts  } = useAlerts();
  const backendStatus = useBackendStatus();
  const alertsSectionRef = useRef(null);
const [alertFilter, setAlertFilter] = useState('all');

const displayedAlerts = useMemo(() => {
  if (alertFilter === 'critical') {
    return alerts.filter(
      (alert) => alert.threat_level?.toLowerCase() === 'critical'
    );
  }

  return alerts;
}, [alerts, alertFilter]);

const showAlerts = (filter) => {
  setAlertFilter(filter);

  setTimeout(() => {
    alertsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 0);
};

  const highestThreat = useMemo(() => {
    const order = ['critical', 'high', 'medium', 'low'];
    if (!sectors.length) return null;
    const levels = sectors.map((s) => s.threat_level?.toLowerCase());
    for (const lvl of order) if (levels.includes(lvl)) return lvl;
    return 'low';
  }, [sectors]);

  const highestThreatSector = useMemo(() => {
    if (!sectors.length || !highestThreat) return null;
    return sectors.find((s) => s.threat_level?.toLowerCase() === highestThreat) ?? null;
  }, [sectors, highestThreat]);

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.threat_level?.toLowerCase() === 'critical').length,
    [alerts]
  );

  const missionStatus = MISSION_STATUS[highestThreat] ?? MISSION_STATUS_DEFAULT;

  const isOnline = backendStatus === 'online';
  const isChecking = backendStatus === 'checking';
  const systemStatusLabel = isChecking ? 'Checking' : isOnline ? 'Nominal' : 'Degraded';
  const systemStatusSub = isChecking
    ? 'LINKING UPLINK…'
    : isOnline ? 'ALL SERVICES ONLINE' : 'BACKEND OFFLINE';
  const systemStatusAccent = isChecking ? 'gold' : isOnline ? 'low' : 'critical';

  const backendOffline = sErr === 'backend_offline' || aErr === 'backend_offline';

  // ── Alert details drawer ────────────────────────────────────
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  // ── Sector details drawer ───────────────────────────────────
  const [selectedSector, setSelectedSector] = useState(null);
  const [sectorDrawerOpen, setSectorDrawerOpen] = useState(false);

  const handleSectorClick = (sector) => {
    setSelectedSector(sector);
    setSectorDrawerOpen(true);
  };

  const closeSectorDrawer = () => setSectorDrawerOpen(false);

  return (
    <div className={styles.page}>
      {/* Offline banner */}
      {backendOffline && (
        <div className={styles.offlineBanner}>
          ⚠ Backend offline — displaying cached simulation data
        </div>
      )}

      {/* KPI cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCardWrap}>
          <StatCard
            icon={Siren}
            label="Critical Alerts"
            value={aLoad ? null : criticalCount}
            sub="REQUIRE IMMEDIATE ACTION"
            accent={criticalCount > 0 ? 'critical' : 'low'}
            loading={aLoad}
            onClick={() => showAlerts('critical')}
          />
        </div>
        <div className={styles.statCardWrap}>
          <StatCard
            icon={Bell}
            label="Active Alerts"
            value={aLoad ? null : alerts.length}
            sub="TOTAL IN QUEUE"
            accent={alerts.length > 0 ? 'gold' : 'low'}
            loading={aLoad}
          />
        </div>
        <div className={styles.statCardWrap}>
          <StatCard
            icon={ShieldAlert}
            label="Mission Status"
            value={sLoad ? null : missionStatus.label}
            sub={
              highestThreatSector
                ? `SECTOR ${highestThreatSector.sector_id ?? highestThreatSector.name ?? '—'}`
                : 'CURRENT ASSESSMENT'
            }
            accent={missionStatus.accent}
            loading={sLoad}
          />
        </div>
        <div className={styles.statCardWrap}>
          <StatCard
            icon={Activity}
            label="System Status"
            value={systemStatusLabel}
            sub={systemStatusSub}
            accent={systemStatusAccent}
            loading={false}
          />
        </div>
      </div>

      {/* Primary — Alerts is the visual anchor of the dashboard */}
      <div className={styles.alertsPrimary} ref={alertsSectionRef}>
        <AlertsPanel
          alerts={displayedAlerts}
          loading={aLoad}
          error={aErr !== 'backend_offline' ? aErr : null}
          onRetry={refetchAlerts}
          onAlertClick={handleAlertClick}
        />
      </div>

      {/* Secondary — sector detail, deliberately smaller than Alerts */}
      <div className={styles.secondaryGrid}>
        <div className={styles.tableCol}>
          <div className={styles.secondaryHead}>
            <span className={styles.secondaryTitle}>Sector Overview</span>
          </div>
          <SectorTable
            sectors={sectors}
            loading={sLoad}
            error={sErr !== 'backend_offline' ? sErr : null}
            onRetry={refetchSectors}
            onSectorClick={handleSectorClick}
          />
        </div>
        <div className={styles.chartCol}>
          <div className={styles.secondaryHead}>
            <span className={styles.secondaryTitle}>Threat Distribution</span>
          </div>
          <ThreatDistributionChart sectors={sectors} loading={sLoad} />
        </div>
      </div>

      <AlertDetailsDrawer
        alert={selectedAlert}
        sector={sectors.find((s) => s.sector_id === selectedAlert?.sector_id) ?? null}
        open={drawerOpen}
        onClose={closeDrawer}
      />
      <SectorDetailsDrawer sector={selectedSector} open={sectorDrawerOpen} onClose={closeSectorDrawer} />
    </div>
  );
}