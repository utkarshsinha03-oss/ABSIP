import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone, Target } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import styles from './RouteViewer.module.css';

function SkeletonBody() {
  return (
    <div className={styles.skeletonBody}>
      <div className={styles.skeletonPills}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} width={44} height={26} style={{ borderRadius: 999 }} />
        ))}
      </div>

      <div className={styles.skeletonGrid}>
        <div className={styles.skeletonCol}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={`m-${i}`} width="100%" height={12} style={{ marginTop: i === 0 ? 0 : 10 }} />
          ))}
          <div className={styles.skeletonMetrics}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={`k-${i}`} width="100%" height={48} style={{ borderRadius: 6 }} />
            ))}
          </div>
        </div>
        <div className={styles.skeletonCol}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={`t-${i}`} width="80%" height={16} style={{ marginTop: i === 0 ? 0 : 10 }} />
          ))}
        </div>
      </div>

      <Skeleton width="100%" height={12} style={{ marginTop: 16, borderRadius: 4 }} />
    </div>
  );
}

function WaypointNode({ sectorId, idx, total }) {
  const isLast = idx === total - 1;
  const isFirst = idx === 0 && !isLast;
  const waypointNumber = Math.max(idx, 1);
  const role = isLast
    ? 'Target Sector'
    : isFirst
      ? 'Current Position'
      : `Waypoint ${waypointNumber}`;
  const variantClass = isLast ? styles.nodeLast : isFirst ? styles.nodeFirst : styles.nodeMid;

  return (
    <div className={`${styles.waypoint} ${variantClass}`}>
      <span className={styles.waypointDot} aria-hidden="true" />
      <div className={styles.waypointBody}>
        <span className={styles.waypointSector}>{sectorId}</span>
        <span className={styles.waypointRole}>{role}</span>
      </div>
      {isLast && (
        <Target className={styles.targetIcon} size={14} strokeWidth={2} aria-hidden="true" />
      )}
    </div>
  );
}

export default function RouteViewer({
  loading,
  error,
  patrolAssignments,
  selectedPatrolId,
  onPatrolSelect,
}) {
  const hasData = (patrolAssignments?.length ?? 0) > 0;
  const selected = hasData
    ? (patrolAssignments.find((a) => a.patrol?.patrol_id === selectedPatrolId) ?? patrolAssignments[0])
    : null;
  const path = selected?.path ?? [];
  const alreadyAtTarget = path.length === 1 && selected?.cost === 0;

  const origin = selected?.patrol?.current_sector ?? '—';
  const destination = path.length > 0 ? path[path.length - 1] : '—';
  const hops = Math.max(path.length - 1, 0);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Milestone size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>ROUTE VIEWER</span>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <SkeletonBody />
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load route data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No routes available"
            subtitle="Awaiting patrol dispatch data from backend."
          />
        ) : (
          <>
            <div className={styles.pillRow} role="tablist" aria-label="Select patrol">
              {patrolAssignments.map((assignment, idx) => {
                const patrolId = assignment.patrol?.patrol_id;
                const isActive = patrolId === selected?.patrol?.patrol_id;
                return (
                  <button
                    key={patrolId ?? idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
                    onClick={() => onPatrolSelect?.(patrolId)}
                  >
                    {patrolId ?? `P${idx + 1}`}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected?.patrol?.patrol_id}
                className={styles.routeDetail}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className={styles.routeGrid}>
                  <div className={styles.leftCol}>
                    <div className={styles.missionBlock}>
                      <div className={styles.missionRow}>
                        <span className={styles.missionLabel}>Mission</span>
                        <span className={styles.missionValue}>{selected?.patrol?.patrol_id ?? '—'}</span>
                      </div>
                      <div className={styles.missionRow}>
                        <span className={styles.missionLabel}>Origin</span>
                        <span className={styles.missionValue}>{origin}</span>
                      </div>
                      <div className={styles.missionRow}>
                        <span className={styles.missionLabel}>Destination</span>
                        <span className={styles.missionValue}>{destination}</span>
                      </div>
                      <div className={styles.missionRow}>
                        <span className={styles.missionLabel}>Status</span>
                        <span className={`${styles.statusPill} ${alreadyAtTarget ? styles.statusAtTarget : styles.statusReady}`}>
                          {alreadyAtTarget ? 'At Target' : 'Dispatch Ready'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.metricsGrid}>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Threat Level</span>
                        <ThreatBadge level={selected?.threat_level} size="sm" />
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Threat Score</span>
                        <span className={styles.metricValue}>{selected?.threat_score ?? '—'}</span>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Route Cost</span>
                        <span className={styles.metricValue}>
                          {selected?.cost != null ? selected.cost : '—'}
                        </span>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Route Hops</span>
                        <span className={styles.metricValue}>{hops}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.rightCol}>
                    {alreadyAtTarget ? (
                      <div className={styles.timeline}>
                        <WaypointNode sectorId={path[0]} idx={0} total={1} />
                        <span className={styles.alreadyAtTargetNote}>
                          Patrol already positioned at target sector
                        </span>
                      </div>
                    ) : (
                      <div className={styles.timeline}>
                        {path.map((sectorId, idx) => (
                          <Fragment key={`${sectorId}-${idx}`}>
                            {idx > 0 && <div className={styles.connector} aria-hidden="true" />}
                            <WaypointNode sectorId={sectorId} idx={idx} total={path.length} />
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.summaryFooter}>
                  <span className={styles.footerRoute}>{origin} → {destination}</span>
                  <span className={styles.footerStat}>Total Nodes: {path.length}</span>
                  <span className={styles.footerStat}>Total Hops: {hops}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
