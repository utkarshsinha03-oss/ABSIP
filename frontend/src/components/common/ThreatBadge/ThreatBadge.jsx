import { capitalize } from '../../../utils/helpers';
import styles from './ThreatBadge.module.css';

const LEVEL_MAP = {
  critical: styles.critical,
  high:     styles.high,
  medium:   styles.medium,
  low:      styles.low,
};

export default function ThreatBadge({ level, size = 'md' }) {
  const levelKey = (level ?? '').toLowerCase();
  return (
    <span className={`${styles.badge} ${LEVEL_MAP[levelKey] ?? styles.low} ${styles[size]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {capitalize(levelKey)}
    </span>
  );
}
