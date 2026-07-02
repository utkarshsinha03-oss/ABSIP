import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Shield, Radio, Eye, Hexagon, ChevronRight, ArrowRight, ChevronDown,
  Waypoints, Anchor, Crosshair, Star, ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useSectors } from '../../hooks/useSectors';
import { useAlerts } from '../../hooks/useAlerts';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import ThreatBadge from '../../components/common/ThreatBadge/ThreatBadge';
import heroArtwork from '../../assets/hero-artwork.jpg';
import styles from './Landing.module.css';

const FEATURES = [
  { icon: Eye,       label: 'Real-time Monitoring',  desc: 'Live sensor telemetry' },
  { icon: Shield,    label: 'AI Threat Detection',    desc: 'Anomaly recognition' },
  { icon: Radio,     label: 'Secure & Reliable',      desc: 'Encrypted & trusted' },
  { icon: Waypoints, label: 'Unified Awareness',      desc: 'Command-center view' },
];

const NAV_LINKS = [
  { label: 'Platform',     hasMenu: true },
  { label: 'Capabilities', hasMenu: true },
  { label: 'Technology',   hasMenu: true },
  { label: 'About',        hasMenu: true },
  { label: 'Contact',      hasMenu: false },
];

const TRUSTED_BY = [
  { icon: Shield,    label: 'DRDO' },
  { icon: Anchor,    label: 'IAF' },
  { icon: Crosshair, label: 'ARMY' },
  { icon: Star,      label: 'BSF' },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/** Fixed particle field — deterministic so it doesn't jump on re-render */
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.6,
  duration: 5 + (i % 5),
}));

export default function LandingPage() {
  const navigate = useNavigate();

  // Live data — same hooks the dashboard uses, so the hero stats bar
  // reflects real state (with graceful mock fallback when offline).
  const { sectors, loading: sLoad } = useSectors();
  const { alerts,  loading: aLoad } = useAlerts();
  const backendStatus = useBackendStatus();

  const highestThreatSector = useMemo(() => {
    if (!sectors.length) return null;
    const order = ['critical', 'high', 'medium', 'low'];
    let best = sectors[0];
    let bestRank = order.indexOf(best.threat_level?.toLowerCase()) ?? 3;
    for (const s of sectors) {
      const rank = order.indexOf(s.threat_level?.toLowerCase());
      if (rank !== -1 && rank < bestRank) { best = s; bestRank = rank; }
    }
    return best;
  }, [sectors]);

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.threat_level?.toLowerCase() === 'critical').length,
    [alerts]
  );

  const isOnline = backendStatus === 'online';
  const statusLabel = backendStatus === 'checking'
    ? 'LINKING UPLINK…'
    : isOnline ? 'ALL SYSTEMS OPERATIONAL' : 'CACHED SIMULATION MODE';

  const animatedSectors = useAnimatedCounter(sLoad ? 0 : sectors.length);
  const animatedAlerts  = useAnimatedCounter(aLoad ? 0 : alerts.length);

  // Subtle pointer-driven parallax — background drifts opposite to cursor
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mvY, { stiffness: 40, damping: 20 });
  const bgX = useTransform(springX, (v) => v * -10);
  const bgY = useTransform(springY, (v) => v * -8);
  const contentX = useTransform(springX, (v) => v * 4);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mvX.set(e.clientX / innerWidth - 0.5);
    mvY.set(e.clientY / innerHeight - 0.5);
  };

  return (
    <div className={styles.page}>
      {/* ── Top navigation ──────────────────────────────────────── */}
      <motion.header
        className={styles.nav}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className={styles.navLogo}>
          <div className={styles.logoWrap}>
            <Hexagon className={styles.hexIcon} size={26} strokeWidth={1} />
            <div className={styles.hexInner} aria-hidden="true" />
          </div>
          <div className={styles.navBrandText}>
            <span className={styles.brandName}>RAKSHAK</span>
            <span className={styles.brandSub}>AI-POWERED BORDER INTELLIGENCE</span>
          </div>
        </div>

        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <button key={link.label} className={styles.navLink} type="button">
              {link.label}
              {link.hasMenu && <ChevronDown size={12} strokeWidth={2} />}
            </button>
          ))}
        </nav>

        <div className={styles.navActions}>
          <div className={styles.statusPill}>
            <span className={`${styles.statusDot} ${isOnline ? styles.statusDotOn : styles.statusDotWarn}`} />
            <span className={styles.statusText}>
              <span className={styles.statusLabel}>SYSTEM STATUS</span>
              <span className={styles.statusValue}>{statusLabel}</span>
            </span>
          </div>
          <button className={styles.navCta} onClick={() => navigate(ROUTES.DASHBOARD)}>
            <span>LAUNCH PLATFORM</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className={styles.hero} onMouseMove={handleMouseMove}>
      {/* ── Full-bleed background artwork ─────────────────────── */}
      <motion.div
        className={styles.bgLayer}
        style={{ x: bgX, y: bgY }}
      >
        <motion.img
          src={heroArtwork}
          alt="RAKSHAK orbital surveillance network"
          className={styles.bgImage}
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 24, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        {/* Luminous bloom seated on the artwork's own light source, blended
            additively so the "sun" reads brighter without touching pixels. */}
        <div className={styles.artworkBloom} aria-hidden="true" />
      </motion.div>

      {/* Cinematic depth stack — vignette first (frames the whole frame),
          then the directional read-side wash, then the grid + grain. */}
      <div className={styles.gradientVignette} aria-hidden="true" />
      <div className={styles.gradientLR} aria-hidden="true" />
      <div className={styles.gradientBottom} aria-hidden="true" />

      {/* Grid texture */}
      <div className={styles.gridOverlay} aria-hidden="true" />

      {/* Film grain for premium, non-flat texture */}
      <div className={styles.grainOverlay} aria-hidden="true" />

      {/* Radar sweep, anchored on the artwork's light source */}
      <motion.div
        className={styles.radarSweep}
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      />
      <div className={styles.radarRing} aria-hidden="true" />

      {/* Floating particles */}
      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className={styles.particle}
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
            animate={{ opacity: [0.1, 0.8, 0.1], y: [0, -14, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Sat-feed indicator, top of artwork */}
      <motion.div
        className={styles.satFeed}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <span className={styles.satFeedDot} />
        <div className={styles.satFeedText}>
          <span>SAT FEED</span>
          <span className={styles.satFeedSub}>ACTIVE</span>
        </div>
      </motion.div>

      {/* Left-edge scroll rail */}
      <div className={styles.sideRail} aria-hidden="true">
        <span className={styles.railDot} />
        <span className={styles.railLine} />
        <span className={styles.railDotGhost} />
        <span className={styles.railDotGhost} />
      </div>
      <motion.span
        className={styles.railLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        SCROLL TO EXPLORE
      </motion.span>

      {/* Coordinates readout, bottom right of artwork */}
      <motion.div
        className={styles.coords}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <div className={styles.coordsBlock}>
          <span className={styles.coordsLabel}>COORDINATES</span>
          <span className={styles.coordsValue}>27.1764° N, 78.0081° E</span>
        </div>
        <div className={styles.coordsBlock}>
          <span className={styles.coordsLabel}>ELEVATION</span>
          <span className={styles.coordsValue}>356 M</span>
        </div>
      </motion.div>

      {/* ── Foreground content ─────────────────────────────────── */}
      <motion.div className={styles.content} style={{ x: contentX }}>
        <motion.span
          className={styles.classification}
          {...fadeUp}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          AI-POWERED // BORDER COMMAND
        </motion.span>

        <motion.h1
          className={styles.title}
          {...fadeUp}
          transition={{ delay: 0.18, duration: 0.6 }}
        >
          RAKSHAK
        </motion.h1>

        <motion.h2
          className={styles.subtitle}
          {...fadeUp}
          transition={{ delay: 0.26, duration: 0.55 }}
        >
          AI-Powered <span className={styles.subtitleUnderline}>Border</span> Surveillance
          <br />
          Intelligence Platform
        </motion.h2>

        <motion.p
          className={styles.description}
          {...fadeUp}
          transition={{ delay: 0.34, duration: 0.55 }}
        >
          Real-time sensor telemetry, AI-driven threat detection, and unified
          situational awareness for the entire border perimeter.
        </motion.p>

        <motion.div
          className={styles.ctaRow}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.5 }}
        >
          <button className={styles.enterBtn} onClick={() => navigate(ROUTES.DASHBOARD)}>
            <span>LAUNCH DASHBOARD</span>
            <ChevronRight size={16} />
          </button>
          <button className={styles.learnBtn} onClick={() => navigate(ROUTES.DASHBOARD)}>
            <span>EXPLORE PLATFORM</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>

        <motion.div
          className={styles.features}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62, duration: 0.5 }}
        >
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className={styles.featureItem}>
              {i > 0 && <span className={styles.featureDivider} aria-hidden="true" />}
              <span className={styles.featureIconRing}>
                <Icon size={16} strokeWidth={1.5} />
              </span>
              <div className={styles.featureText}>
                <span className={styles.featureLabel}>{label}</span>
                <span className={styles.featureDesc}>{desc}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} />
        </motion.div>
        <span>SCROLL</span>
      </motion.div>
      </div>

      {/* ── Bottom mission-stats bar ─────────────────────────────── */}
      <motion.footer
        className={styles.statsBar}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>ACTIVE SECTORS</span>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{sLoad ? '—' : animatedSectors}</span>
            <MiniSpark tone="blue" />
          </div>
          <span className={styles.statDelta}>+{sLoad ? '—' : Math.max(sectors.length - 116, 0)} today</span>
        </div>

        <span className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statBlock}>
          <span className={styles.statLabel}>TOTAL ALERTS</span>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{aLoad ? '—' : animatedAlerts}</span>
            <MiniSpark tone="gold" />
          </div>
          <span className={styles.statDelta}>+{aLoad ? '—' : criticalCount} critical</span>
        </div>

        <span className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statBlock}>
          <span className={styles.statLabel}>HIGHEST THREAT</span>
          <span className={styles.statValueSector}>
            {sLoad ? '—' : (highestThreatSector?.id ?? 'NONE')}
          </span>
          {!sLoad && highestThreatSector && <ThreatBadge level={highestThreatSector.threat_level} size="sm" />}
        </div>

        <span className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statBlock}>
          <span className={styles.statLabel}>SYSTEM UPTIME</span>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{isOnline ? '99.98%' : '99.20%'}</span>
            <ShieldCheck size={14} strokeWidth={1.75} className={isOnline ? styles.iconOk : styles.iconWarn} />
          </div>
          <span className={`${styles.statDelta} ${isOnline ? styles.deltaGood : styles.deltaWarn}`}>
            {isOnline ? 'OPERATIONAL' : 'DEGRADED'}
          </span>
        </div>

        <span className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statBlockTrusted}>
          <span className={styles.statLabel}>TRUSTED BY</span>
          <div className={styles.trustedRow}>
            {TRUSTED_BY.map(({ icon: Icon, label }) => (
              <span key={label} className={styles.trustedBadge} title={label}>
                <Icon size={15} strokeWidth={1.5} />
              </span>
            ))}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

function MiniSpark({ tone = 'blue' }) {
  const bars = [4, 7, 5, 9, 6, 10, 8];
  return (
    <span className={`${styles.spark} ${styles['spark_' + tone]}`} aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} className={styles.sparkBar} style={{ height: `${h}px` }} />
      ))}
    </span>
  );
}
