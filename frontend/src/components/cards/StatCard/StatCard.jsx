import { motion } from 'framer-motion';
import Skeleton from '../../common/Skeleton/Skeleton';
import { useAnimatedCounter } from '../../../hooks/useAnimatedCounter';
import styles from './StatCard.module.css';

export default function StatCard({ icon: Icon, label, value, sub, accent = 'blue', loading = false }) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div
      className={`${styles.card} ${styles[accent]}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {Icon && (
          <span className={styles.iconWrap}>
            <Icon className={styles.icon} size={16} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className={styles.body}>
        {loading ? (
          <>
            <Skeleton width="60%" height="2.2rem" style={{ borderRadius: 4 }} />
            <Skeleton width="80%" height="0.9rem" style={{ marginTop: 6 }} />
          </>
        ) : (
          <>
            <span className={styles.value}>{value == null ? '—' : animatedValue}</span>
            {sub && <span className={styles.sub}>{sub}</span>}
          </>
        )}
      </div>

      <div className={styles.glowBar} aria-hidden="true" />
    </motion.div>
  );
}
