import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './AlertDetailsDrawer.module.css';

/* score_breakdown keys → display labels, in the order requested */
const SCORE_FIELDS = [
  { key: 'human_detection',  label: 'Human Detection' },
  { key: 'vehicle_detection', label: 'Vehicle Detection' },
  { key: 'visibility',       label: 'Visibility' },
  { key: 'weather',          label: 'Weather' },
  { key: 'patrol_gap',       label: 'Patrol Gap' },
  { key: 'historical_risk',  label: 'Historical Risk' },
];

const ACTION_ACCENTS = {
  'emergency response':  'critical',
  'dispatch patrol':     'gold',
  'notify operator':     'blue',
  'continue monitoring': 'low',
};

const levelAccent = (level) => {
  const l = (level || '').toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'high') return 'gold';
  if (l === 'medium') return 'blue';
  return 'low';
};

/* Scores may arrive as 0–1 or 0–100 depending on the backend —
   normalize to a 0–100 percentage either way. */
const toPercent = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, pct));
};

export default function AlertDetailsDrawer({ alert, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const actionKey = (alert?.recommended_action || '').toLowerCase();
  const actionAccent = ACTION_ACCENTS[actionKey] ?? 'gold';
  const confidencePct = alert ? toPercent(alert.confidence) : null;

  return (
    <AnimatePresence>
      {open && alert && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Alert details"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.drawerHead}>
              <div className={styles.drawerHeadText}>
                <span className={styles.drawerEyebrow}>ALERT DETAILS</span>
                <h2 className={styles.drawerTitle}>{alert.alert_id ?? '—'}</h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close alert details"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Summary */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Alert ID</span>
                  <span className={styles.summaryValue}>{alert.alert_id ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Sector ID</span>
                  <span className={styles.summaryValue}>{alert.sector_id ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Threat Score</span>
                  <span className={styles.summaryValue}>{alert.threat_score ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Threat Level</span>
                  <span className={`${styles.summaryValue} ${styles['accent_' + levelAccent(alert.threat_level)]}`}>
                    {alert.threat_level ?? '—'}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Confidence</span>
                  <span className={styles.summaryValue}>
                    {confidencePct === null ? '—' : `${Math.round(confidencePct)}%`}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Alert Status</span>
                  <span className={styles.summaryValue}>{alert.alert_status ?? '—'}</span>
                </div>
                <div className={`${styles.summaryItem} ${styles.summaryItemFull}`}>
                  <span className={styles.summaryLabel}>Recommended Action</span>
                  <span className={styles.summaryValue}>{alert.recommended_action ?? '—'}</span>
                </div>
                <div className={`${styles.summaryItem} ${styles.summaryItemFull}`}>
                  <span className={styles.summaryLabel}>Timestamp</span>
                  <span className={styles.summaryValue}>{alert.timestamp ?? '—'}</span>
                </div>
              </div>

              {/* AI Threat Analysis */}
              {alert.score_breakdown && (
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>AI Threat Analysis</span>
                  <div className={styles.scoreList}>
                    {SCORE_FIELDS.map(({ key, label }) => {
                      const pct = toPercent(alert.score_breakdown?.[key]);
                      if (pct === null) return null;
                      return (
                        <div key={key} className={styles.scoreRow}>
                          <div className={styles.scoreRowHead}>
                            <span className={styles.scoreLabel}>{label}</span>
                            <span className={styles.scoreValue}>{Math.round(pct)}%</span>
                          </div>
                          <div className={styles.scoreTrack}>
                            <div className={styles.scoreFill} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {Array.isArray(alert.reasons) && alert.reasons.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>AI Reasoning</span>
                  <ul className={styles.reasonList}>
                    {alert.reasons.map((reason, i) => (
                      <li key={i} className={styles.reasonItem}>
                        <span className={styles.reasonBullet} aria-hidden="true" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Operator Recommendation */}
              {alert.recommended_action && (
                <div className={`${styles.recommendationCard} ${styles['recAccent_' + actionAccent]}`}>
                  <span className={styles.recommendationLabel}>OPERATOR RECOMMENDATION</span>
                 <span className={styles.recommendationValue}>
  {alert.recommended_action
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())}
</span>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}