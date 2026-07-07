import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './ErrorCard.module.css';

export default function ErrorCard({ message = 'Unable to connect to backend', onRetry }) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertTriangle className={styles.icon} size={22} strokeWidth={1.5} />
      <div className={styles.body}>
        <span className={styles.title}>SERVICE DEGRADED</span>
        <span className={styles.message}>{message}</span>
      </div>
      {onRetry && (
        <button className={styles.retry} onClick={onRetry} aria-label="Retry">
          <RefreshCw size={14} />
          <span>RETRY</span>
        </button>
      )}
    </motion.div>
  );
}
