import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import styles from './BorderGraph.module.css';

const MAX_NODES = 12;
const COLUMNS = 4;

function SkeletonGrid() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: MAX_NODES }, (_, i) => (
        <div key={i} className={styles.skeletonNode}>
          <Skeleton width="60%" height={10} />
          <Skeleton width={50} height={16} style={{ marginTop: 8, borderRadius: 4 }} />
          <Skeleton width="40%" height={10} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

export default function BorderGraph({ loading, error, rankedSectors, selectedSectorId, selectedRoute }) {
  const nodes = rankedSectors?.slice(0, MAX_NODES) ?? [];
  const hasData = nodes.length > 0;

  const totalSectors = rankedSectors?.length ?? 0;
  const criticalCount = rankedSectors?.filter((s) => s.threat_level === 'Critical').length ?? 0;
  const highestScore = rankedSectors?.[0]?.threat_score ?? '—';

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Network size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>BORDER GRAPH</span>
        </div>
        {!loading && !error && hasData && (
          <div className={styles.legend} aria-label="Threat level legend">
            <ThreatBadge level="Critical" size="sm" />
            <ThreatBadge level="High" size="sm" />
            <ThreatBadge level="Medium" size="sm" />
            <ThreatBadge level="Safe" size="sm" />
          </div>
        )}
      </div>

      <div className={styles.body}>
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load border graph data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No sector graph available"
            subtitle="Awaiting sector telemetry from backend."
          />
        ) : (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryStat}>Nodes: {totalSectors}</span>
              <span className={styles.summaryStat}>Critical: {criticalCount}</span>
              <span className={styles.summaryStat}>Highest Score: {highestScore}</span>
            </div>

            <div className={styles.grid}>
              {nodes.map((sector, idx) => {
                const isPrimary = idx === 0;
                const isSelected = selectedSectorId != null && sector.sector_id === selectedSectorId;
                const isOnRoute =
                  selectedRoute?.includes(sector.sector_id);
                const showRight = idx % COLUMNS !== COLUMNS - 1 && idx !== nodes.length - 1;
                const showDown = idx + COLUMNS < nodes.length;
                return (
                  <motion.div
                    key={sector.sector_id ?? idx}
                    className={`${styles.nodeSlot} ${isPrimary ? styles.nodeSlotPrimary : ''} ${showRight ? styles.connectorRight : ''} ${showDown ? styles.connectorDown : ''}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, scale: isPrimary ? 1.06 : 1 }}
                    transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div
                      className={`${styles.node} ${isPrimary ? styles.nodePrimary : ''} ${isSelected ? styles.nodeSelected : ''} ${isOnRoute ? styles.nodeRoute : ''}`}
                    >
                      {(isPrimary || isOnRoute) && (
                        <div className={styles.badgeRow}>
                          {isPrimary && (
                            <span className={styles.primaryLabel}>PRIMARY TARGET</span>
                          )}
                          {isOnRoute && (
                            <span className={styles.routeLabel}>ROUTE</span>
                          )}
                        </div>
                      )}
                      <span className={styles.nodeId}>{sector.sector_id}</span>
                      <ThreatBadge level={sector.threat_level} size="sm" />
                      <span className={styles.nodeScore}>{sector.threat_score}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
