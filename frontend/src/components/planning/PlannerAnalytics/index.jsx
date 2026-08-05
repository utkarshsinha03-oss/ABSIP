import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Layers,
  ShieldAlert,
  Gauge,
  Route as RouteIcon,
  Maximize2,
  Truck,
} from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import styles from './PlannerAnalytics.module.css';

function SkeletonGrid() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton width="60%" height={10} />
          <Skeleton width="40%" height={24} style={{ marginTop: 6, borderRadius: 4 }} />
          <Skeleton width="70%" height={10} style={{ marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function PlannerAnalytics({ loading, error, rankedSectors, patrolAssignments }) {
  const totalRankedSectors = rankedSectors?.length ?? 0;
  const activePatrols = patrolAssignments?.length ?? 0;
  const hasData = totalRankedSectors > 0 || activePatrols > 0;

  const kpis = useMemo(() => {
    const criticalSectors = rankedSectors?.filter((s) => s.threat_level === 'Critical').length ?? 0;

    const avgThreatScore = totalRankedSectors > 0
      ? Math.round(
          rankedSectors.reduce((sum, s) => sum + (s.threat_score ?? 0), 0) / totalRankedSectors,
        )
      : null;

    const avgRouteCost = activePatrols > 0
      ? Math.round(
          patrolAssignments.reduce((sum, a) => sum + (a.cost ?? 0), 0) / activePatrols,
        )
      : null;

    const longestRoute = activePatrols > 0
      ? Math.max(...patrolAssignments.map((a) => a.path?.length ?? 0))
      : null;

    return [
      {
        key: 'total-ranked-sectors',
        icon: Layers,
        label: 'Total Ranked Sectors',
        value: totalRankedSectors,
        subtitle: 'Across all sectors',
      },
      {
        key: 'critical-sectors',
        icon: ShieldAlert,
        label: 'Critical Sectors',
        value: criticalSectors,
        subtitle: 'Highest priority',
      },
      {
        key: 'avg-threat-score',
        icon: Gauge,
        label: 'Average Threat Score',
        value: avgThreatScore ?? '—',
        subtitle: 'Mean across sectors',
      },
      {
        key: 'avg-route-cost',
        icon: RouteIcon,
        label: 'Average Route Cost',
        value: avgRouteCost ?? '—',
        subtitle: 'Mean dispatch cost',
      },
      {
        key: 'longest-route',
        icon: Maximize2,
        label: 'Longest Route',
        value: longestRoute ?? '—',
        subtitle: 'Sectors in longest path',
      },
      {
        key: 'active-patrols',
        icon: Truck,
        label: 'Active Patrols',
        value: activePatrols,
        subtitle: 'Currently deployed',
      },
    ];
  }, [rankedSectors, patrolAssignments, totalRankedSectors, activePatrols]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <BarChart3 size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>PLANNER ANALYTICS</span>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load planner analytics data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No analytics available"
            subtitle="Awaiting sector and patrol telemetry from backend."
          />
        ) : (
          <div className={styles.grid}>
            {kpis.map(({ key, icon: Icon, label, value, subtitle }, idx) => (
              <motion.div
                key={key}
                className={styles.card}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.label}>{label}</span>
                  <span className={styles.iconWrap}>
                    <Icon className={styles.icon} size={16} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>
                <span className={styles.value}>{value}</span>
                <span className={styles.subtitle}>{subtitle}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
