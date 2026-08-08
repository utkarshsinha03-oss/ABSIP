import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './SectorDetailsDrawer.module.css';

/* score_breakdown keys → display labels, same set/order as AlertDetailsDrawer */
const SCORE_FIELDS = [
  { key: 'human_detection',  label: 'Human Detection' },
  { key: 'vehicle_detection', label: 'Vehicle Detection' },
  { key: 'visibility',       label: 'Visibility' },
  { key: 'weather',          label: 'Weather' },
  { key: 'patrol_gap',       label: 'Patrol Gap' },
  { key: 'historical_risk',  label: 'Historical Risk' },
];

const levelAccent = (level) => {
  const l = (level || '').toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'high') return 'gold';
  if (l === 'medium') return 'blue';
  return 'low';
};

/* Threat score may arrive as 0–1 or 0–100 depending on the backend —
   normalize to a 0–100 percentage either way (same convention as
   AlertDetailsDrawer's score_breakdown handling). */
const toPercent = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, pct));
};

export default function SectorDetailsDrawer({ sector, open, onClose }) {
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

  const accent = levelAccent(sector?.threat_level);

  return (
    <AnimatePresence>
      {open && sector && (
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
            aria-label="Sector details"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.drawerHead}>
              <div className={styles.drawerHeadText}>
                <span className={styles.drawerEyebrow}>SECTOR DETAILS</span>
                <h2 className={styles.drawerTitle}>{sector.sector_id ?? '—'}</h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close sector details"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Summary */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Sector ID</span>
                  <span className={styles.summaryValue}>{sector.sector_id ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Threat Score</span>
                  <span className={styles.summaryValue}>{sector.threat_score ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Threat Level</span>
                  <span className={`${styles.summaryValue} ${styles['accent_' + accent]}`}>
                    {sector.threat_level ?? '—'}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Visibility</span>
                  <span className={styles.summaryValue}>{sector.visibility ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weather</span>
                  <span className={styles.summaryValue}>{sector.weather ?? '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Historical Risk</span>
                  <span className={styles.summaryValue}>
                    {sector.historical_risk != null ? `${sector.historical_risk}/10` : '—'}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Last Patrol</span>
                  <span className={styles.summaryValue}>
                    {sector.last_patrol_hours != null ? `${sector.last_patrol_hours} hrs ago` : '—'}
                  </span>
                </div>
              </div>

              {/* Threat Factor Breakdown */}
              {sector.score_breakdown && (
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>THREAT ASSESSMENT</span>
                  <div className={styles.scoreList}>
                    {SCORE_FIELDS.map(({ key, label }) => {
                      const pct = toPercent(sector.score_breakdown?.[key]);
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

              {/* Active Alerts */}
              {Array.isArray(sector.alerts) && sector.alerts.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>ACTIVE ALERTS</span>
                  <ul className={styles.reasonList}>
                    {sector.alerts.map((a, i) => (
                      <li key={i} className={styles.reasonItem}>
                        <span className={styles.reasonBullet} aria-hidden="true" />
                        {a.event?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        {' — '}
                        {Math.round(toPercent(a.confidence) ?? 0)}% confidence
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reasons */}
              {Array.isArray(sector.reasons) && sector.reasons.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>REASONS</span>
                  <ul className={styles.reasonList}>
                    {sector.reasons.map((reason, i) => (
                      <li key={i} className={styles.reasonItem}>
                        <span className={styles.reasonBullet} aria-hidden="true" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status Summary */}
              <div className={`${styles.statusCard} ${styles['statusAccent_' + accent]}`}>
                <span className={styles.statusLabel}>CURRENT ASSESSMENT</span>
                <span className={styles.statusValue}>
                  {sector.threat_level ?? '—'} THREAT · VISIBILITY {sector.visibility ?? '—'}
                </span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}