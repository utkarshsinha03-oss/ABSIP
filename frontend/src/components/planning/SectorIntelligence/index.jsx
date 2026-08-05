import { motion } from 'framer-motion';
import { Radar } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import { capitalize } from '../../../utils/helpers';
import styles from './SectorIntelligence.module.css';

function SkeletonBody() {
  return (
    <div className={styles.skeletonBody}>
      <div className={styles.skeletonHeaderRow}>
        <Skeleton width={80} height={20} />
        <Skeleton width={70} height={22} style={{ borderRadius: 999 }} />
        <Skeleton width={60} height={20} />
      </div>
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} width="100%" height={40} style={{ borderRadius: 6 }} />
        ))}
      </div>
      <Skeleton width="100%" height={60} style={{ marginTop: 12, borderRadius: 6 }} />
      <Skeleton width="100%" height={60} style={{ marginTop: 12, borderRadius: 6 }} />
    </div>
  );
}

export default function SectorIntelligence({ loading, error, rankedSectors, selectedSectorId }) {
  const hasData = (rankedSectors?.length ?? 0) > 0;
  const selected = hasData
    ? (rankedSectors.find((s) => s.sector_id === selectedSectorId) ?? rankedSectors[0])
    : null;

  const alerts = selected?.alerts ?? [];
  const reasons = selected?.reasons ?? [];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Radar size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>SECTOR INTELLIGENCE</span>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <SkeletonBody />
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load sector intelligence data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No sector intelligence available"
            subtitle="Awaiting sector telemetry from backend."
          />
        ) : (
          <motion.div
            className={styles.content}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.sectorHeader}>
              <span className={styles.sectorId}>{selected.sector_id}</span>
              <ThreatBadge level={selected.threat_level} size="md" />
              <div className={styles.scoreBlock}>
                <span className={styles.scoreLabel}>Threat Score</span>
                <span className={styles.scoreValue}>{selected.threat_score ?? '—'}</span>
              </div>
            </div>

            <div className={styles.section}>
              <span className={styles.sectionTitle}>Environmental Data</span>
              <div className={styles.envGrid}>
                <div className={styles.envItem}>
                  <span className={styles.envLabel}>Visibility</span>
                  <span className={styles.envValue}>{selected.visibility ?? '—'}</span>
                </div>
                <div className={styles.envItem}>
                  <span className={styles.envLabel}>Weather</span>
                  <span className={styles.envValue}>{selected.weather ?? '—'}</span>
                </div>
                <div className={styles.envItem}>
                  <span className={styles.envLabel}>Historical Risk</span>
                  <span className={styles.envValue}>
                    {selected.historical_risk != null ? `${selected.historical_risk} / 10` : '—'}
                  </span>
                </div>
                <div className={styles.envItem}>
                  <span className={styles.envLabel}>Last Patrol Hours</span>
                  <span className={styles.envValue}>
                    {selected.last_patrol_hours != null
                      ? `${Number(selected.last_patrol_hours).toFixed(1)} hrs`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <span className={styles.sectionTitle}>Alerts</span>
              {alerts.length === 0 ? (
                <span className={styles.emptyNote}>No active alerts</span>
              ) : (
                <div className={styles.alertsList}>
                  {alerts.map((alert, idx) => (
                    <div key={idx} className={styles.alertRow}>
                      <span className={styles.alertEvent}>
                        {capitalize(alert.event?.replace(/_/g, ' ') ?? '')}
                      </span>
                      <span className={styles.alertConfidence}>
                        {Math.round((alert.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <span className={styles.sectionTitle}>AI Reasoning</span>
              {reasons.length === 0 ? (
                <span className={styles.emptyNote}>No reasoning available</span>
              ) : (
                <ul className={styles.reasonsList}>
                  {reasons.map((reason, idx) => (
                    <li key={idx} className={styles.reasonItem}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
