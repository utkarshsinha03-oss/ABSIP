import { motion } from 'framer-motion';
import { AlertCircle, BellRing } from 'lucide-react';
import ThreatBadge from '../../common/ThreatBadge/ThreatBadge';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import { timeAgo } from '../../../utils/formatDate';
import { getThreatColor } from '../../../utils/helpers';
import styles from './AlertsPanel.module.css';

function SkeletonItems({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.skeletonItem}>
      <Skeleton width={28} height={28} style={{ borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width="70%" height={12} />
        <Skeleton width="45%" height={10} />
      </div>
      <Skeleton width={60} height={18} style={{ borderRadius: 3 }} />
    </div>
  ));
}

export default function AlertsPanel({
  alerts,
  loading,
  error,
  onRetry,
  onAlertClick,
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <BellRing size={15} strokeWidth={1.5} />
          <span>RECENT ALERTS</span>
        </div>

        {!loading && !error && (
          <span className={styles.count}>{alerts.length} ACTIVE</span>
        )}
      </div>

      <div className={styles.list}>
        {error && error !== 'backend_offline' ? (
          <div className={styles.stateWrap}>
            <ErrorCard
              message="Unable to retrieve alert data."
              onRetry={onRetry}
            />
          </div>
        ) : loading ? (
          <SkeletonItems />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No alerts detected"
            subtitle="System operating normally."
          />
        ) : (
          alerts.slice(0, 8).map((alert, idx) => {
            const color = getThreatColor(alert.threat_level);

            return (
              <motion.div
                key={alert.id ?? idx}
                className={styles.item}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                onClick={() => onAlertClick?.(alert)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAlertClick?.(alert);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={styles.severityBar}
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}80`,
                  }}
                  aria-hidden="true"
                />

                <div
                  className={styles.itemIcon}
                  style={{ borderColor: `${color}40` }}
                >
                  <AlertCircle
                    size={14}
                    style={{ color }}
                    strokeWidth={2}
                  />
                </div>

                <div className={styles.itemBody}>
                  <span className={styles.itemTitle}>{alert.title}</span>

                  <span className={styles.itemMeta}>
                    <span className={styles.sector}>{alert.sector}</span>
                    <span className={styles.dot} aria-hidden="true">·</span>
                    <span className={styles.time}>
                      {timeAgo(alert.timestamp)}
                    </span>
                  </span>
                </div>

                <ThreatBadge level={alert.threat_level} size="sm" />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}