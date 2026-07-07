import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import { getThreatColor } from '../../../utils/helpers';
import styles from './SectorTable.module.css';

function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className={styles.skeletonRow}>
      {[140, 80, 100, 100].map((w, j) => (
        <td key={j}><Skeleton width={w} height={14} /></td>
      ))}
    </tr>
  ));
}

function ThreatBar({ score }) {
  const color = getThreatColor(
    score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'
  );
  return (
    <div className={styles.barWrap}>
      <div className={styles.barTrack}>
        <motion.div
          className={styles.barFill}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
      <span className={styles.barValue} style={{ color }}>{score}</span>
    </div>
  );
}

export default function SectorTable({ sectors, loading, error, onRetry, onSectorClick }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <Database size={15} strokeWidth={1.5} />
          <span>SECTOR INTELLIGENCE MATRIX</span>
        </div>
        <span className={styles.count}>
          {!loading && !error && `${sectors.length} SECTORS`}
        </span>
      </div>

      {error && error !== 'backend_offline' ? (
        <div className={styles.stateWrap}>
          <ErrorCard message="Unable to retrieve sector data." onRetry={onRetry} />
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SECTOR ID</th>
                <th>THREAT SCORE</th>
                <th>THREAT LEVEL</th>
                <th>VISIBILITY</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : sectors.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No sectors registered"
                      subtitle="Awaiting sector configuration from backend."
                    />
                  </td>
                </tr>
              ) : (
                sectors.map((s, idx) => (
                  <motion.tr
                    key={s.id ?? idx}
                    className={styles.row}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    onClick={() => onSectorClick?.(s)}
                    role={onSectorClick ? 'button' : undefined}
                    tabIndex={onSectorClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onSectorClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onSectorClick(s);
                      }
                    }}
                  >
                    <td>
                      <span className={styles.sectorId}>{s.id}</span>
                    </td>
                    <td>
                      <ThreatBar score={s.threat_score ?? 0} />
                    </td>
                    <td>
                      <ThreatBadge level={s.threat_level} />
                    </td>
                    <td>
                      <span className={styles.visibility}>{s.visibility ?? '—'}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}