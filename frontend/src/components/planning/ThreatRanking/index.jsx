import { motion } from 'framer-motion';
import { ListOrdered } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import { getThreatColor } from '../../../utils/helpers';
import styles from './ThreatRanking.module.css';

function SkeletonRows({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.skeletonRow}>
      <Skeleton width={20} height={14} />
      <Skeleton width={64} height={14} />
      <Skeleton width="100%" height={6} style={{ borderRadius: 3, flex: 1 }} />
      <Skeleton width={32} height={14} />
      <Skeleton width={70} height={20} style={{ borderRadius: 4 }} />
    </div>
  ));
}

function ThreatBar({ score, level }) {
  const color = getThreatColor((level ?? '').toLowerCase());
  return (
    <div className={styles.barTrack}>
      <motion.div
        className={styles.barFill}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  );
}

export default function ThreatRanking({
  loading,
  error,
  rankedSectors,
  selectedSectorId,
  onSectorSelect,
}) {
  const hasData = (rankedSectors?.length ?? 0) > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <ListOrdered size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>THREAT RANKING</span>
        </div>
        {!loading && !error && hasData && (
          <span className={styles.count}>{rankedSectors.length} SECTORS</span>
        )}
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.list}>
            <SkeletonRows />
          </div>
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load threat ranking data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No ranked sectors"
            subtitle="Awaiting threat ranking data from backend."
          />
        ) : (
          <div className={styles.list}>
            {rankedSectors.map((sector, idx) => {
              const isSelected = selectedSectorId != null && sector.sector_id === selectedSectorId;
              return (
                <motion.div
                  key={sector.sector_id ?? idx}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.25 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSectorSelect?.(sector.sector_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSectorSelect?.(sector.sector_id);
                    }
                  }}
                >
                  <span className={styles.rank}>{idx + 1}</span>
                  <span className={styles.sectorId}>{sector.sector_id}</span>
                  <ThreatBar score={sector.threat_score ?? 0} level={sector.threat_level} />
                  <span className={styles.score}>{sector.threat_score}</span>
                  <ThreatBadge level={sector.threat_level} size="sm" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
