import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import EmptyState from '../../common/EmptyState/EmptyState';
import { capitalize } from '../../../utils/helpers';
import styles from './ThreatDistributionChart.module.css';

const LEVEL_ORDER = ['critical', 'high', 'medium', 'low'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{name}</span>
      <span className={styles.tooltipValue}>{value} sector{value === 1 ? '' : 's'}</span>
    </div>
  );
}

export default function ThreatDistributionChart({ sectors, loading }) {
  const data = useMemo(() => {
    if (!sectors?.length) return [];
    const counts = sectors.reduce((acc, s) => {
      const lvl = (s.threat_level ?? 'low').toLowerCase();
      acc[lvl] = (acc[lvl] ?? 0) + 1;
      return acc;
    }, {});
    return LEVEL_ORDER
      .filter((lvl) => counts[lvl])
      .map((lvl) => ({
        name: capitalize(lvl),
        value: counts[lvl],
        color: getThreatColorHex(lvl),
      }));
  }, [sectors]);

  const total = sectors?.length ?? 0;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <PieIcon size={15} strokeWidth={1.5} />
          <span>THREAT DISTRIBUTION</span>
        </div>
        {!loading && total > 0 && (
          <span className={styles.count}>{total} SECTORS</span>
        )}
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loadingWrap}>
            <Skeleton width={160} height={160} style={{ borderRadius: '50%' }} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No distribution data"
            subtitle="Sector telemetry unavailable."
          />
        ) : (
          <>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                    animationDuration={600}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.centerLabel}>
                <span className={styles.centerValue}>{total}</span>
                <span className={styles.centerSub}>SECTORS</span>
              </div>
            </div>

            <div className={styles.legend}>
              {data.map((d) => (
                <div key={d.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: d.color, boxShadow: `0 0 6px ${d.color}80` }} />
                  <span className={styles.legendLabel}>{d.name}</span>
                  <span className={styles.legendValue}>{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getThreatColorHex(level) {
  const map = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };
  return map[level] ?? '#3b82f6';
}
