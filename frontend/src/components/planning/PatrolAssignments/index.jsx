import { motion } from 'framer-motion';
import { Send, ArrowRight } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import styles from './PatrolAssignments.module.css';

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (idx) => ({
    opacity: 1,
    y: 0,
    transition: { delay: idx * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
};

function SkeletonCards({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.card}>
      <div className={styles.cardHeader}>
        <Skeleton width={70} height={16} />
        <Skeleton width={60} height={18} style={{ borderRadius: 4 }} />
      </div>
      <Skeleton width="90%" height={12} style={{ marginTop: 10 }} />
      <Skeleton width="60%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={24} style={{ marginTop: 12, borderRadius: 4 }} />
    </div>
  ));
}

function PathDisplay({ path, cost }) {
  const list = path ?? [];
  const alreadyAtTarget = list.length === 1 && cost === 0;

  if (alreadyAtTarget) {
    return <span className={styles.pathNote}>Already at target</span>;
  }

  return (
    <div className={styles.pathRow}>
      {list.map((sectorId, idx) => (
        <span key={`${sectorId}-${idx}`} className={styles.pathItem}>
          <span className={styles.pathChip}>{sectorId}</span>
          {idx < list.length - 1 && (
            <ArrowRight className={styles.pathArrow} size={12} strokeWidth={2} aria-hidden="true" />
          )}
        </span>
      ))}
    </div>
  );
}

export default function PatrolAssignments({
  loading,
  error,
  patrolAssignments,
  selectedPatrolId,
  onPatrolSelect,
}) {
  const hasData = (patrolAssignments?.length ?? 0) > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Send size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>PATROL ASSIGNMENTS</span>
        </div>
        {!loading && !error && hasData && (
          <span className={styles.count}>{patrolAssignments.length} DISPATCHED</span>
        )}
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.list}>
            <SkeletonCards />
          </div>
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load patrol assignment data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No patrol assignments"
            subtitle="Awaiting dispatch data from backend."
          />
        ) : (
          <div className={styles.list}>
            {patrolAssignments.map((assignment, idx) => {
              const patrolId = assignment.patrol?.patrol_id;
              const isSelected = selectedPatrolId != null && patrolId === selectedPatrolId;
              return (
              <motion.div
                key={`${patrolId ?? 'patrol'}-${idx}`}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                custom={idx}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                role="button"
                tabIndex={0}
                onClick={() => onPatrolSelect?.(patrolId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPatrolSelect?.(patrolId);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.patrolId}>{patrolId ?? '—'}</span>
                  <ThreatBadge level={assignment.threat_level} size="sm" />
                </div>

                <div className={styles.route}>
                  <span className={styles.sector}>Current: {assignment.patrol?.current_sector ?? '—'}</span>
                  <ArrowRight className={styles.routeArrow} size={14} strokeWidth={2} aria-hidden="true" />
                  <span className={styles.sector}>Target: {assignment.sector ?? '—'}</span>
                </div>

                <div className={styles.statsRow}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Threat Score</span>
                    <span className={styles.statValue}>{assignment.threat_score ?? '—'}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Route Cost</span>
                    <span className={styles.statValue}>
                      {assignment.cost != null ? assignment.cost : '—'}
                    </span>
                  </div>
                </div>

                <div className={styles.pathWrap}>
                  <span className={styles.pathLabel}>Path</span>
                  <PathDisplay path={assignment.path} cost={assignment.cost} />
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
