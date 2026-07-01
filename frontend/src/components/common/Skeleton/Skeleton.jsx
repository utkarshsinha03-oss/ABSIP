import styles from './Skeleton.module.css';

/**
 * Generic skeleton placeholder.
 * @param {{ width?: string, height?: string, className?: string, style?: object }} props
 */
export default function Skeleton({ width, height, className = '', style = {} }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}
