import { TrendingUp } from 'lucide-react';
import Skeleton from '../../common/Skeleton/Skeleton';
import ErrorCard from '../../common/ErrorCard/ErrorCard';
import EmptyState from '../../common/EmptyState/EmptyState';
import styles from './ParetoAnalysis.module.css';

const CHART_HEIGHT = 180;
const CHART_TOP_OFFSET = 32;
const COLUMN_WIDTH = 64;
const CHART_MIN_WIDTH = 320;

function computeParetoData(rankedSectors) {
  const totalThreat = (rankedSectors ?? []).reduce(
    (sum, sector) => sum + (sector.threat_score ?? 0),
    0
  );

  let cumulativeThreat = 0;
  const rows = (rankedSectors ?? []).map((sector) => {
    const threatScore = sector.threat_score ?? 0;
    cumulativeThreat += threatScore;
    const cumulativePercentage =
      totalThreat > 0
        ? Math.round((cumulativeThreat / totalThreat) * 1000) / 10
        : 0;

    return {
      sector_id: sector.sector_id,
      threat_score: threatScore,
      cumulativeThreat,
      cumulativePercentage,
    };
  });

  const criticalIndex = rows.findIndex((row) => row.cumulativePercentage >= 80);
  const criticalSectorCount =
    totalThreat === 0 ? 0 : (criticalIndex === -1 ? rows.length : criticalIndex + 1);

  return { totalThreat, rows, criticalSectorCount };
}

function getBarHeight(score, maxScore) {
  if (!maxScore || maxScore <= 0) return 0;
  return Math.round((score / maxScore) * CHART_HEIGHT);
}

function getPointY(cumulativePercentage) {
  const clamped = Math.min(Math.max(cumulativePercentage, 0), 100);
  return CHART_TOP_OFFSET + CHART_HEIGHT - (clamped / 100) * CHART_HEIGHT;
}

function getColumnCenterX(idx, columnWidth) {
  return idx * columnWidth + columnWidth / 2;
}

function SkeletonBody() {
  return (
    <div className={styles.skeletonBody}>
      <div className={styles.skeletonList}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton width={64} height={14} />
            <Skeleton width={40} height={14} />
          </div>
        ))}
      </div>
      <Skeleton width="100%" height={140} style={{ marginTop: 16, borderRadius: 8 }} />
    </div>
  );
}

export default function ParetoAnalysis({ loading, error, rankedSectors }) {
  const hasData = (rankedSectors?.length ?? 0) > 0;

  const { totalThreat, rows: paretoRows, criticalSectorCount } = computeParetoData(rankedSectors);

  const chartRows = paretoRows.slice(0, 8);
  const maxScore = chartRows.length > 0 ? Math.max(...chartRows.map((row) => row.threat_score)) : 0;
  const chartWidth = Math.max(chartRows.length * COLUMN_WIDTH, CHART_MIN_WIDTH);
  const columnWidth = chartRows.length > 0 ? chartWidth / chartRows.length : chartWidth;
  const svgHeight = CHART_TOP_OFFSET + CHART_HEIGHT;
  const thresholdY = getPointY(80);
  const lineStartX = chartRows.length > 0 ? getColumnCenterX(0, columnWidth) : 0;
  const lineEndX = chartRows.length > 0 ? getColumnCenterX(chartRows.length - 1, columnWidth) : chartWidth;
  const polylinePoints = chartRows
    .map((row, idx) => `${getColumnCenterX(idx, columnWidth)},${getPointY(row.cumulativePercentage)}`)
    .join(' ');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <TrendingUp size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>PARETO THREAT ANALYSIS</span>
        </div>
        {!loading && !error && hasData && (
          <span className={styles.count}>{rankedSectors.length} SECTORS</span>
        )}
      </div>

      <div className={styles.body}>
        {loading ? (
          <SkeletonBody />
        ) : error ? (
          <ErrorCard message={error?.message || 'Unable to load Pareto analysis data.'} />
        ) : !hasData ? (
          <EmptyState
            title="No sector data available"
            subtitle="Awaiting threat ranking data from backend."
          />
        ) : (
          <>
            <div className={styles.list}>
              <div className={styles.listHeader}>
                <span className={styles.listHeaderLabel}>Sector</span>
                <span className={styles.listHeaderLabel}>Threat</span>
                <span className={styles.listHeaderLabel}>Cumulative</span>
                <span className={styles.listHeaderLabel}>Cumulative %</span>
              </div>
              {paretoRows.slice(0, 8).map((row, idx) => (
                <div key={row.sector_id ?? idx} className={styles.row}>
                  <span className={styles.sectorId}>{row.sector_id}</span>
                  <span className={styles.score}>{row.threat_score}</span>
                  <span className={styles.score}>{row.cumulativeThreat}</span>
                  <span className={styles.score}>{row.cumulativePercentage}%</span>
                </div>
              ))}
            </div>

            {totalThreat === 0 ? (
              <p className={styles.count}>No threat data available for Pareto analysis.</p>
            ) : (
              <p className={styles.count}>
                Top {criticalSectorCount} sector{criticalSectorCount === 1 ? '' : 's'} account for at least 80% of the total threat.
              </p>
            )}

            <div className={styles.chartSection}>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchBar}`} aria-hidden="true" />
                  <span className={styles.legendLabel}>Threat Score</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchLine}`} aria-hidden="true" />
                  <span className={styles.legendLabel}>Cumulative %</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchThreshold}`} aria-hidden="true" />
                  <span className={styles.legendLabel}>80% Threshold</span>
                </div>
              </div>

              <div className={styles.chartRow}>
                <div className={styles.chartScroll}>
                  <div className={styles.chartPlot} style={{ width: chartWidth }}>
                    <div className={styles.chartOverlayArea} style={{ height: svgHeight }}>
                      <div className={styles.barsRow}>
                        {chartRows.map((row, idx) => (
                          <div
                            key={row.sector_id ?? idx}
                            className={styles.barColumn}
                            style={{ width: columnWidth }}
                          >
                            <span className={styles.barValue}>{row.threat_score}</span>
                            <div className={styles.barTrack} style={{ height: CHART_HEIGHT }}>
                              <div
                                className={styles.bar}
                                style={{ height: getBarHeight(row.threat_score, maxScore) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalThreat > 0 && (
                        <svg
                          className={styles.overlaySvg}
                          width={chartWidth}
                          height={svgHeight}
                          viewBox={`0 0 ${chartWidth} ${svgHeight}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <line
                            x1={lineStartX}
                            y1={CHART_TOP_OFFSET}
                            x2={lineEndX}
                            y2={CHART_TOP_OFFSET}
                            className={styles.guideLine}
                          />
                          <line
                            x1={lineStartX}
                            y1={svgHeight}
                            x2={lineEndX}
                            y2={svgHeight}
                            className={styles.guideLine}
                          />
                          <line
                            x1={lineStartX}
                            y1={thresholdY}
                            x2={lineEndX}
                            y2={thresholdY}
                            className={styles.thresholdLine}
                          />
                          <text
                            x={lineStartX + 4}
                            y={thresholdY - 6}
                            textAnchor="start"
                            className={styles.thresholdText}
                          >
                            80% THRESHOLD
                          </text>
                          <polyline points={polylinePoints} className={styles.cumulativeLine} />
                          {chartRows.map((row, idx) => (
                            <circle
                              key={row.sector_id ?? idx}
                              cx={getColumnCenterX(idx, columnWidth)}
                              cy={getPointY(row.cumulativePercentage)}
                              r={3}
                              className={styles.cumulativePoint}
                            />
                          ))}
                        </svg>
                      )}
                    </div>

                    <div className={styles.barLabelsRow}>
                      {chartRows.map((row, idx) => (
                        <span
                          key={row.sector_id ?? idx}
                          className={styles.barLabel}
                          style={{ width: columnWidth }}
                        >
                          {row.sector_id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.chartAxis} style={{ height: svgHeight }}>
                  <span className={styles.axisLabel} style={{ top: CHART_TOP_OFFSET }}>100%</span>
                  <span className={styles.axisLabel} style={{ top: thresholdY }}>80%</span>
                  <span className={styles.axisLabel} style={{ top: svgHeight }}>0%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
