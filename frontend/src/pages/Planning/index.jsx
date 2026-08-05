import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import usePlanning from '../../hooks/usePlanning';
import PlannerSummary from '../../components/planning/PlannerSummary';
import ThreatRanking from '../../components/planning/ThreatRanking';
import PatrolAssignments from '../../components/planning/PatrolAssignments';
import RouteViewer from '../../components/planning/RouteViewer';
import SectorIntelligence from '../../components/planning/SectorIntelligence';
import BorderGraph from '../../components/planning/BorderGraph';
import PlannerAnalytics from '../../components/planning/PlannerAnalytics';
import styles from './Planning.module.css';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function PlanningPage() {
  const {
    loading,
    error,
    topThreats,
    patrolAssignments,
    rankedSectors,
  } = usePlanning();

  const [selectedPatrolId, setSelectedPatrolId] = useState(null);
  const [selectedSectorId, setSelectedSectorId] = useState(null);

  useEffect(() => {
    if (patrolAssignments?.length > 0 && selectedPatrolId === null) {
      setSelectedPatrolId(patrolAssignments[0].patrol.patrol_id);
    }
  }, [patrolAssignments, selectedPatrolId]);

  useEffect(() => {
    if (rankedSectors?.length > 0 && selectedSectorId === null) {
      setSelectedSectorId(rankedSectors[0].sector_id);
    }
  }, [rankedSectors, selectedSectorId]);

  const selectedRoute =
    patrolAssignments?.find(
      (a) => a.patrol?.patrol_id === selectedPatrolId
    )?.path ?? [];

  return (
    <motion.div
      className={styles.page}
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <GitBranch className={styles.titleIcon} size={26} strokeWidth={1.5} aria-hidden="true" />
          <h1 className={styles.title}>Adaptive Path Planning</h1>
        </div>
        <p className={styles.subtitle}>
          AI-assisted patrol route optimization using graph-based path planning
        </p>
      </div>

      <PlannerSummary
        loading={loading}
        error={error}
        topThreats={topThreats}
        patrolAssignments={patrolAssignments}
        rankedSectors={rankedSectors}
      />

      <div className={styles.row}>
        <ThreatRanking
          loading={loading}
          error={error}
          rankedSectors={rankedSectors}
          selectedSectorId={selectedSectorId}
          onSectorSelect={setSelectedSectorId}
        />
        <PatrolAssignments
          loading={loading}
          error={error}
          patrolAssignments={patrolAssignments}
          selectedPatrolId={selectedPatrolId}
          onPatrolSelect={setSelectedPatrolId}
        />
      </div>

      <RouteViewer
        loading={loading}
        error={error}
        patrolAssignments={patrolAssignments}
        selectedPatrolId={selectedPatrolId}
        onPatrolSelect={setSelectedPatrolId}
        selectedRoute={selectedRoute}
      />

      <SectorIntelligence
        loading={loading}
        error={error}
        rankedSectors={rankedSectors}
        selectedSectorId={selectedSectorId}
      />

      <div className={styles.row}>
        <BorderGraph
          loading={loading}
          error={error}
          rankedSectors={rankedSectors}
          selectedSectorId={selectedSectorId}
          selectedRoute={selectedRoute}
        />
        <PlannerAnalytics
          loading={loading}
          error={error}
          rankedSectors={rankedSectors}
          patrolAssignments={patrolAssignments}
        />
      </div>
    </motion.div>
  );
}
