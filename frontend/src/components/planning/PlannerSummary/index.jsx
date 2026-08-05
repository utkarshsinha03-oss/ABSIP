import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import styles from './PlannerSummary.module.css';

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

function SkeletonGrid() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className={styles.field}>
          <Skeleton width="60%" height={10} />
          <Skeleton width="80%" height={20} style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export default function PlannerSummary({
  loading,
  error,
  topThreats,
  patrolAssignments,
  rankedSectors,
}) {
  const highestThreat = topThreats?.[0] ?? null;
  const topAssignment = patrolAssignments?.[0] ?? null;
  const hasData = (rankedSectors?.length ?? 0) > 0;

  return (
    <motion.div
      className={styles.card}
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <ClipboardList size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>PLANNER SUMMARY</span>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load planner summary data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No planning data available"
            subtitle="Awaiting sector and patrol telemetry from backend."
          />
        ) : (
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>Highest Threat Sector</span>
              <span className={styles.value}>{highestThreat?.sector_id ?? '—'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Threat Score</span>
              <span className={styles.value}>{highestThreat?.threat_score ?? '—'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Threat Level</span>
              <ThreatBadge level={highestThreat?.threat_level} />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Recommended Patrol</span>
              <span className={styles.value}>{topAssignment?.patrol?.patrol_id ?? '—'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Estimated Route Cost</span>
              <span className={styles.value}>{topAssignment?.cost ?? '—'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Planner Status</span>
              <span className={styles.value}>
                {patrolAssignments?.length > 0 ? 'Dispatch Ready' : 'Standby'}
              </span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Total Ranked Sectors</span>
              <span className={styles.value}>{rankedSectors?.length ?? 0}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
