import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: Icon = ShieldCheck,
  title = 'No data available',
  subtitle = 'System operating normally.',
}) {
  return (
    <motion.div
      className={styles.empty}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Icon className={styles.icon} size={32} strokeWidth={1} />
      <span className={styles.title}>{title}</span>
      <span className={styles.subtitle}>{subtitle}</span>
    </motion.div>
  );
}
