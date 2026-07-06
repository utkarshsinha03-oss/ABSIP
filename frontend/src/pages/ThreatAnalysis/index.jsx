import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Siren,
  AlertTriangle,
  ActivitySquare,
  ShieldCheck,
  User,
  Truck,
  Eye,
  CloudRain,
  Clock3,
  History,
  Radio,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import { useSectors } from '../../hooks/useSectors';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import StatCard from '../../components/cards/StatCard/StatCard';
import ThreatBadge from '../../components/common/ThreatBadge/ThreatBadge';
import ErrorCard from '../../components/common/ErrorCard/ErrorCard';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Skeleton from '../../components/common/Skeleton/Skeleton';
import { getThreatColor } from '../../utils/helpers';
import styles from './ThreatAnalysis.module.css';

/* score_breakdown keys → display labels + icons, same field set used by AlertDetailsDrawer */
const SCORE_FIELDS = [
  { key: 'human_detection',  label: 'Human Detection',  icon: User },
  { key: 'vehicle_detection', label: 'Vehicle Detection', icon: Truck },
  { key: 'visibility',       label: 'Visibility',        icon: Eye },
  { key: 'weather',          label: 'Weather',           icon: CloudRain },
  { key: 'patrol_gap',       label: 'Patrol Gap',        icon: Clock3 },
  { key: 'historical_risk',  label: 'Historical Risk',   icon: History },
];

/* recommended_action → display group, same taxonomy used by AlertDetailsDrawer's ACTION_ACCENTS */
const ACTION_GROUPS = [
  { key: 'emergency response',  label: 'Emergency Response',  icon: Siren,  accent: 'critical' },
  { key: 'dispatch patrol',     label: 'Dispatch Patrol',      icon: Truck,  accent: 'gold' },
  { key: 'notify operator',     label: 'Notify Operator',      icon: Radio,  accent: 'blue' },
  { key: 'continue monitoring', label: 'Continue Monitoring',  icon: ShieldCheck, accent: 'low' },
];

const OVERVIEW_LEVELS = [
  { key: 'critical', label: 'Critical', icon: Siren,          accent: 'critical' },
  { key: 'high',     label: 'High',     icon: AlertTriangle,  accent: 'gold' },
  { key: 'medium',   label: 'Medium',   icon: ActivitySquare, accent: 'gold' },
  { key: 'low',      label: 'Safe',     icon: ShieldCheck,    accent: 'low' },
];

const levelAccent = (level) => {
  const l = (level || '').toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'high') return 'gold';
  if (l === 'medium') return 'blue';
  return 'low';
};

/* Scores may arrive as 0–1 or 0–100 — normalize to a 0–100 percentage either way. */
const toPercent = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, pct));
};

function useThreatAnalysis(alerts, sectors) {
  return useMemo(() => {
    // ── Threat Score Overview ──────────────────────────────
    const levelCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach((a) => {
      const lvl = a.threat_level?.toLowerCase();
      if (lvl && lvl in levelCounts) levelCounts[lvl] += 1;
    });

    // ── Threat Factor Breakdown ─────────────────────────────
    const factorAverages = {};
    SCORE_FIELDS.forEach(({ key }) => {
      const values = alerts
        .map((a) => toPercent(a.score_breakdown?.[key]))
        .filter((v) => v !== null);
      factorAverages[key] = values.length
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : null;
    });

    // ── Highest Risk Sectors ────────────────────────────────
    const rankedSectors = [...sectors]
      .filter((s) => Number.isFinite(Number(s.threat_score)))
      .sort((a, b) => Number(b.threat_score) - Number(a.threat_score))
      .slice(0, 6);

    // ── Recommended Actions Summary ─────────────────────────
    const actionCounts = {};
    ACTION_GROUPS.forEach(({ key }) => { actionCounts[key] = 0; });
    alerts.forEach((a) => {
      const key = (a.recommended_action || '').toLowerCase();
      if (key in actionCounts) actionCounts[key] += 1;
    });

    // ── AI Insights ──────────────────────────────────────────
    const insights = [];
    const factorEntries = Object.entries(factorAverages).filter(([, v]) => v !== null);
    if (factorEntries.length) {
      const [topKey, topVal] = factorEntries.reduce((a, b) => (b[1] > a[1] ? b : a));
      const label = SCORE_FIELDS.find((f) => f.key === topKey)?.label ?? topKey;
      insights.push(
        `${label} is contributing the most to current alerts, averaging ${Math.round(topVal)}% across active detections.`
      );
    }
    if (factorAverages.weather !== null && factorAverages.weather >= 50) {
      insights.push('Weather conditions are elevating overall threat scores across the sector network.');
    }
    if (factorAverages.patrol_gap !== null && factorAverages.patrol_gap >= 50) {
      insights.push('Multiple sectors show significant patrol gaps, increasing exposure risk.');
    }
    const criticalSectorCount = sectors.filter((s) => s.threat_level?.toLowerCase() === 'critical').length;
    if (criticalSectorCount > 0) {
      insights.push(
        `${criticalSectorCount} sector${criticalSectorCount > 1 ? 's are' : ' is'} currently at critical threat level and require immediate attention.`
      );
    }
    const reasonSet = new Set();
    alerts
      .filter((a) => ['critical', 'high'].includes(a.threat_level?.toLowerCase()))
      .forEach((a) => (Array.isArray(a.reasons) ? a.reasons : []).forEach((r) => reasonSet.add(r)));
    Array.from(reasonSet).slice(0, 4).forEach((r) => insights.push(r));

    return {
      levelCounts,
      factorAverages,
      rankedSectors,
      actionCounts,
      insights: insights.slice(0, 8),
    };
  }, [alerts, sectors]);
}

function FactorBar({ label, Icon, pct }) {
  const color = pct === null ? 'var(--text-muted)' : getThreatColor(
    pct >= 75 ? 'critical' : pct >= 50 ? 'high' : pct >= 25 ? 'medium' : 'low'
  );
  return (
    <div className={styles.factorRow}>
      <div className={styles.factorHead}>
        <span className={styles.factorLabel}>
          <Icon size={13} strokeWidth={1.75} />
          {label}
        </span>
        <span className={styles.factorValue}>{pct === null ? '—' : `${Math.round(pct)}%`}</span>
      </div>
      <div className={styles.factorTrack}>
        <motion.div
          className={styles.factorFill}
          initial={{ width: 0 }}
          animate={{ width: `${pct ?? 0}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: color, boxShadow: pct ? `0 0 8px ${color}60` : 'none' }}
        />
      </div>
    </div>
  );
}

function RankedSectorRow({ sector, rank }) {
  const score = Number(sector.threat_score) || 0;
  const color = getThreatColor(
    score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'
  );
  return (
    <motion.div
      className={styles.sectorRow}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05, duration: 0.25 }}
    >
      <span className={styles.sectorRank}>{String(rank + 1).padStart(2, '0')}</span>
      <span className={styles.sectorRowId}>
        <MapPin size={13} strokeWidth={1.75} />
        {sector.id}
      </span>
      <div className={styles.sectorRowBar}>
        <div className={styles.sectorRowTrack}>
          <motion.div
            className={styles.sectorRowFill}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
          />
        </div>
        <span className={styles.sectorRowScore} style={{ color }}>{score}</span>
      </div>
      <ThreatBadge level={sector.threat_level} />
    </motion.div>
  );
}

export default function ThreatAnalysisPage() {
  const { alerts,  loading: aLoad, error: aErr, refetch: refetchAlerts }  = useAlerts();
  const { sectors, loading: sLoad, error: sErr, refetch: refetchSectors } = useSectors();
  const backendStatus = useBackendStatus();

  const loading = aLoad || sLoad;
  const backendOffline = aErr === 'backend_offline' || sErr === 'backend_offline';
  const hardError = (aErr && aErr !== 'backend_offline') || (sErr && sErr !== 'backend_offline');

  const { levelCounts, factorAverages, rankedSectors, actionCounts, insights } =
    useThreatAnalysis(alerts, sectors);

  const isChecking = backendStatus === 'checking';

  return (
    <div className={styles.page}>
      {backendOffline && (
        <div className={styles.offlineBanner}>
          ⚠ Backend offline — displaying cached simulation data
        </div>
      )}

      <header className={styles.pageHead}>
        <h1 className={styles.title}>Threat Analysis</h1>
        <p className={styles.subtitle}>
          AI-generated reasoning behind current threat assessments
          {isChecking ? ' · LINKING UPLINK…' : ''}
        </p>
      </header>

      {hardError ? (
        <ErrorCard
          message="Unable to retrieve threat intelligence data."
          onRetry={() => { refetchAlerts(); refetchSectors(); }}
        />
      ) : (
        <>
          {/* 1. Threat Score Overview */}
          <section className={styles.overviewGrid}>
            {OVERVIEW_LEVELS.map(({ key, label, icon, accent }) => (
              <div className={styles.statCardWrap} key={key}>
                <StatCard
                  icon={icon}
                  label={label}
                  value={loading ? null : levelCounts[key]}
                  sub="ACTIVE ALERTS"
                  accent={levelCounts[key] > 0 && key !== 'low' ? accent : (key === 'low' ? 'low' : accent)}
                  loading={loading}
                />
              </div>
            ))}
          </section>

          <div className={styles.mainGrid}>
            {/* Left column */}
            <div className={styles.col}>
              {/* 2. Threat Factor Breakdown */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>
                    <ActivitySquare size={15} strokeWidth={1.5} />
                    <span>THREAT FACTOR BREAKDOWN</span>
                  </div>
                </div>
                <div className={styles.panelBody}>
                  {loading ? (
                    <div className={styles.skeletonStack}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} width="100%" height={34} />
                      ))}
                    </div>
                  ) : alerts.length === 0 ? (
                    <EmptyState title="No factor data" subtitle="Awaiting alert telemetry from backend." />
                  ) : (
                    <div className={styles.factorList}>
                      {SCORE_FIELDS.map(({ key, label, icon }) => (
                        <FactorBar key={key} label={label} Icon={icon} pct={factorAverages[key]} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Highest Risk Sectors */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>
                    <MapPin size={15} strokeWidth={1.5} />
                    <span>HIGHEST RISK SECTORS</span>
                  </div>
                  <span className={styles.count}>{!loading && `${rankedSectors.length} SHOWN`}</span>
                </div>
                <div className={styles.panelBody}>
                  {loading ? (
                    <div className={styles.skeletonStack}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} width="100%" height={30} />
                      ))}
                    </div>
                  ) : rankedSectors.length === 0 ? (
                    <EmptyState title="No sectors registered" subtitle="Awaiting sector configuration from backend." />
                  ) : (
                    <div className={styles.sectorList}>
                      {rankedSectors.map((s, idx) => (
                        <RankedSectorRow key={s.id ?? idx} sector={s} rank={idx} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className={styles.col}>
              {/* 4. Recommended Actions Summary */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>
                    <Siren size={15} strokeWidth={1.5} />
                    <span>RECOMMENDED ACTIONS</span>
                  </div>
                </div>
                <div className={styles.panelBody}>
                  {loading ? (
                    <div className={styles.actionGrid}>
                      {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} width="100%" height={72} />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.actionGrid}>
                      {ACTION_GROUPS.map(({ key, label, icon: Icon, accent }) => (
                        <div key={key} className={`${styles.actionCard} ${styles['actionAccent_' + accent]}`}>
                          <Icon size={16} strokeWidth={1.75} />
                          <span className={styles.actionCount}>{actionCounts[key]}</span>
                          <span className={styles.actionLabel}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. AI Insights */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>
                    <Sparkles size={15} strokeWidth={1.5} />
                    <span>AI INSIGHTS</span>
                  </div>
                </div>
                <div className={styles.panelBody}>
                  {loading ? (
                    <div className={styles.skeletonStack}>
                      {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} width="100%" height={16} />
                      ))}
                    </div>
                  ) : insights.length === 0 ? (
                    <EmptyState title="No insights available" subtitle="Not enough alert data to generate insights." />
                  ) : (
                    <ul className={styles.insightList}>
                      {insights.map((insight, i) => (
                        <li key={i} className={styles.insightItem}>
                          <Sparkles size={12} strokeWidth={1.75} className={styles.insightIcon} />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}