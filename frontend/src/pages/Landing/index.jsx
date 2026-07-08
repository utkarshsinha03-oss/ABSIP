import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Shield, Radio, Eye, Hexagon, ChevronRight, ArrowRight, ChevronDown,
  Waypoints, Anchor, Crosshair, Star, ShieldCheck,
  Workflow, Command, Layers, Globe, TrendingUp, Terminal,
  Cpu, Camera, GitMerge, Activity, Lock,
  Mail, MapPin, Clock, Send, Loader2, CheckCircle2,
  MessageCircle, Users, Share2, ArrowUp,
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
  { icon: Eye,       label: 'Live Sensor Feed' },
  { icon: Shield,    label: 'AI Threat Detection' },
  { icon: Radio,     label: 'Encrypted Uplink' },
  { icon: Waypoints, label: 'Unified Command View' },
];

const NAV_LINKS = [
  { label: 'Platform',     id: 'platform' },
  { label: 'Capabilities', id: 'capabilities' },
  { label: 'Technology',   id: 'technology' },
  { label: 'About',        id: 'about' },
  { label: 'Contact',      id: 'contact' },
];

const TRUSTED_BY = [
  { icon: Shield,    label: 'DRDO' },
  { icon: Anchor,    label: 'IAF' },
  { icon: Crosshair, label: 'ARMY' },
  { icon: Star,      label: 'BSF' },
];

const PLATFORM_PILLARS = [
  {
    icon: Waypoints,
    title: 'Unified Sector Grid',
    desc: 'Every border sector rendered as a live tile — threat-scored, sourced, and current to the second.',
  },
  {
    icon: Workflow,
    title: 'Sensor-to-Decision Pipeline',
    desc: 'Raw signal becomes a fused, ranked alert in under three seconds, end to end.',
  },
  {
    icon: Command,
    title: 'One Map, One Truth',
    desc: 'Operators across every post work from the same live picture — no stale reports, no blind spots.',
  },
];

const CAPABILITIES = [
  { icon: Eye,       title: 'Real-time Monitoring',   desc: 'Every sensor feed streamed live to a single operational map, refreshed in under a second.' },
  { icon: Shield,    title: 'AI Threat Detection',     desc: 'Anomaly models trained on frontier-specific patterns flag intrusions before they reach the wire.' },
  { icon: Layers,    title: 'Sensor Fusion',           desc: 'Radar, thermal, acoustic, and seismic inputs merged into one confidence score per track.' },
  { icon: Globe,     title: 'Border Intelligence',     desc: 'Historical patterns and terrain context turn raw alerts into ranked, actionable intelligence.' },
  { icon: TrendingUp, title: 'Predictive Analytics',   desc: 'Forecasts likely crossing points and staffing needs before a shift even begins.' },
  { icon: Terminal,  title: 'Secure Command Center',   desc: 'A hardened, role-based console built for decisions that cannot wait for a refresh.' },
];

const TECH_PIPELINE = [
  {
    icon: Radio,
    title: "Sensor Network",
    metric: "LIVE DATA STREAMS",
  },
  {
    icon: Activity,
    title: "Data Acquisition",
    metric: "REAL-TIME INGESTION",
  },
  {
    icon: Shield,
    title: "Threat Detection",
    metric: "AI ANALYSIS",
  },
  {
    icon: GitMerge,
    title: "Sector Intelligence",
    metric: "PRIORITY CLASSIFICATION",
  },
  {
    icon: Command,
    title: "Decision Support",
    metric: "ACTIONABLE INSIGHTS",
  },
  {
    icon: Globe,
    title: "Command Dashboard",
    metric: "LIVE VISUALIZATION",
  },
];

const TIMELINE = [
  {
    year: "01",
    title: "Monitor",
    desc: "Collect live feeds from distributed border surveillance sensors."
  },
  {
    year: "02",
    title: "Detect",
    desc: "AI continuously identifies suspicious activity and potential threats."
  },
  {
    year: "03",
    title: "Analyze",
    desc: "Sector intelligence prioritizes alerts using contextual risk assessment."
  },
  {
    year: "04",
    title: "Respond",
    desc: "Command dashboard enables rapid, informed operational decisions."
  },
];
const CONTACT_INFO = [
  {
    icon: Mail,
    label: "MISSION CONTROL",
    value: "ops@rakshak.mil.in",
  },
  {
    icon: MapPin,
    label: "COMMAND CENTER",
    value: "New Delhi, India",
  },
  {
    icon: Clock,
    label: "OPERATIONS",
    value: "24×7 Monitoring",
  },
  {
    icon: ShieldCheck,
    label: "TECHNICAL SUPPORT",
    value: "Secure Assistance Available",
  },
];

const FOOTER_NAV = {
  platform: [
    { label: 'Overview',     id: 'platform' },
    { label: 'Capabilities', id: 'capabilities' },
    { label: 'Technology',   id: 'technology' },
  ],
  company: [
    { label: 'About',   id: 'about' },
    { label: 'Contact', id: 'contact' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Globe,         label: 'Website' },
  { icon: MessageCircle, label: 'Press & Media' },
  { icon: Users,         label: 'Community' },
  { icon: Share2,        label: 'Share' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

/** Fixed particle field — deterministic so it doesn't jump on re-render */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: (i * 41) % 100,
  top: (i * 59) % 100,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.7,
  duration: 6 + (i % 5),
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
  const bgX = useTransform(springX, (v) => v * -8);
  const bgY = useTransform(springY, (v) => v * -6);
  const contentX = useTransform(springX, (v) => v * 3);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mvX.set(e.clientX / innerWidth - 0.5);
    mvY.set(e.clientY / innerHeight - 0.5);
  };

  // ── Section scroll-spy ──────────────────────────────────────
  // Below-the-hero sections register themselves here so the nav
  // (and footer quick links) can smooth-scroll to them and
  // highlight whichever one is currently in view.
  const sectionRefs = useRef({});
  const [activeSection, setActiveSection] = useState('platform');

  const registerSection = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  const scrollToSection = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const ids = ['platform', 'capabilities', 'technology', 'about', 'contact'];
    const els = ids.map((id) => sectionRefs.current[id]).filter(Boolean);
    if (!els.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Contact form ─────────────────────────────────────────────
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formStatus, setFormStatus] = useState('idle'); // idle | submitting | success

  const handleFormChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name.trim() || data.name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(data.email.trim())) errors.email = 'Enter a valid email address.';
    if (!data.subject.trim() || data.subject.trim().length < 3) errors.subject = 'Add a short subject line.';
    if (!data.message.trim() || data.message.trim().length < 10) errors.message = 'Message should be at least 10 characters.';
    return errors;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormStatus('submitting');
    // Simulated dispatch — swap for a real endpoint when the ops
    // inbox integration lands. Kept local so this component stays
    // dependency-free.
    setTimeout(() => setFormStatus('success'), 1400);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setFormErrors({});
    setFormStatus('idle');
  };

  return (
    <div className={styles.page}>
      {/* ── Top navigation ──────────────────────────────────────── */}
      <motion.header
        className={styles.nav}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className={styles.navLogo}>
          <div className={styles.logoWrap}>
            <Hexagon className={styles.hexIcon} size={24} strokeWidth={1} />
            <div className={styles.hexInner} aria-hidden="true" />
          </div>
          <div className={styles.navBrandText}>
            <span className={styles.brandName}>RAKSHAK</span>
            <span className={styles.brandSub}>AI-POWERED BORDER INTELLIGENCE</span>
          </div>
        </div>

        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              className={`${styles.navLink} ${activeSection === link.id ? styles.navLinkActive : ''}`}
              type="button"
              onClick={() => scrollToSection(link.id)}
            >
              {link.label}
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
          animate={{ scale: 1.05 }}
          transition={{ duration: 26, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
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
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
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
            animate={{ opacity: [0.08, 0.65, 0.08], y: [0, -12, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Mission-lock HUD frame — quiet targeting brackets at the
          hero's corners, reinforcing "under watch" without adding noise. */}
      <div className={styles.hudFrame} aria-hidden="true">
        <span className={styles.hudCornerTL} />
        <span className={styles.hudCornerTR} />
        <span className={styles.hudCornerBL} />
        <span className={styles.hudCornerBR} />
      </div>

      {/* Sat-feed indicator, top of artwork */}
      <motion.div
        className={styles.satFeed}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <span className={styles.satFeedDot} />
        <div className={styles.satFeedText}>
          <span>SAT FEED</span>
          <span className={styles.satFeedSub}>ACTIVE</span>
        </div>
      </motion.div>

      {/* Coordinates readout, bottom right of artwork */}
      <motion.div
        className={styles.coords}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
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
          Total Situational Awareness Across the <span className={styles.subtitleUnderline}>Frontier</span>
        </motion.h2>

        <motion.p
          className={styles.description}
          {...fadeUp}
          transition={{ delay: 0.34, duration: 0.55 }}
        >
          Integrating real-time surveillance, intelligent threat assessment and sector-wise operational awareness into a unified command platform for modern border security.
        </motion.p>

        <motion.div
          className={styles.ctaRow}
          initial={{ opacity: 0, y: 12 }}
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
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <div key={label} className={styles.featureItem}>
              {i > 0 && <span className={styles.featureDivider} aria-hidden="true" />}
              <Icon className={styles.featureIcon} size={16} strokeWidth={1.5} />
              <span className={styles.featureLabel}>{label}</span>
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
        <span>SCROLL</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>
      </div>

      {/* ── Bottom mission-stats bar ─────────────────────────────── */}
      <motion.footer
        className={styles.statsBar}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
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
                <Icon size={14} strokeWidth={1.5} />
              </span>
            ))}
          </div>
        </div>
      </motion.footer>

      {/* ── Platform ─────────────────────────────────────────────── */}
      <section id="platform" ref={registerSection('platform')} className={styles.section}>
        <div className={styles.sectionGlowGold} aria-hidden="true" />
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.sectionEyebrow}>PLATFORM</span>
            <h2 className={styles.sectionHeading}>Unified Border Intelligence Platform</h2>
            <p className={styles.sectionText}>
              RAKSHAK replaces a patchwork of standalone sensors and manual reports with a single
              command layer — built to turn raw signal into a decision an operator can act on immediately.RAKSHAK consolidates live surveillance data, AI-powered threat analysis and sector intelligence into a unified operational platform for border security teams.
            </p>
          </motion.div>

          <div className={styles.platformGrid}>
            {PLATFORM_PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className={styles.card}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className={styles.cardGlyph}>
                  <span className={styles.cardGlyphRingOuter} aria-hidden="true" />
                  <span className={styles.cardGlyphRingInner} aria-hidden="true" />
                  <Icon size={22} strokeWidth={1.5} className={styles.cardIcon} />
                </div>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────────────────── */}
      <section id="capabilities" ref={registerSection('capabilities')} className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.sectionEyebrow}>CAPABILITIES</span>
            <h2 className={styles.sectionHeading}>Built for What the Frontier Actually Demands</h2>
            <p className={styles.sectionText}>
              Six systems working as one — from the first sensor ping to the operator&rsquo;s final call.
            </p>
          </motion.div>

          <div className={styles.capabilitiesGrid}>
            {CAPABILITIES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className={styles.capabilityCard}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.4, 0, 0.2, 1] }}
              >
                <span className={styles.capCornerTL} aria-hidden="true" />
                <span className={styles.capCornerBR} aria-hidden="true" />
                <Icon size={20} strokeWidth={1.5} className={styles.capabilityIcon} />
                <h3 className={styles.capabilityTitle}>{title}</h3>
                <p className={styles.capabilityDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology ───────────────────────────────────────────── */}
      <section id="technology" ref={registerSection('technology')} className={styles.section}>
        <div className={styles.sectionGlowBlue} aria-hidden="true" />
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.sectionEyebrow}>TECHNOLOGY</span>
            <h2 className={styles.sectionHeading}>Operational Intelligence Workflow</h2>
            <p className={styles.sectionText}>
              Every surveillance event follows a structured intelligence workflow—from data acquisition to actionable operational insights.
            </p>
          </motion.div>

          <div className={styles.pipelineWrap}>
            <div className={styles.pipelineTrack}>
              <div className={styles.pipelineLine} aria-hidden="true">
                <span className={styles.pipelinePacket} style={{ animationDelay: '0s' }} />
                <span className={styles.pipelinePacket} style={{ animationDelay: '1.3s' }} />
                <span className={styles.pipelinePacket} style={{ animationDelay: '2.6s' }} />
              </div>
              {TECH_PIPELINE.map(({ icon: Icon, title, metric }, i) => (
                <motion.div
                  key={title}
                  className={styles.pipelineNode}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className={styles.pipelineHex}>
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <span className={styles.pipelineLabel}>{title}</span>
                  <span className={styles.pipelineMetric}>{metric}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────── */}
      <section id="about" ref={registerSection('about')} className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.sectionEyebrow}>ABOUT</span>
            <h2 className={styles.sectionHeading}>Why RAKSHAK Exists</h2>
          </motion.div>

          <div className={styles.aboutGrid}>
            <motion.div
              className={styles.aboutText}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.missionBlock}>
                <span className={styles.missionLabel}>MISSION</span>
                <p className={styles.missionText}>
                  RAKSHAK provides India's border forces with a unified, real-time operational picture of the frontier—ensuring every critical signal is detected, analyzed, and acted upon without delays caused by fragmented systems.
                </p>
              </div>
              <div className={styles.missionBlock}>
                <span className={styles.missionLabel}>VISION</span>
                <p className={styles.missionText}>
                  A frontier where every sensor, post, and analyst works from the same live truth —
                  and where the time between a signal and a decision is measured in seconds, not shifts.
                </p>
              </div>

              <div className={styles.aboutStats}>
                <div className={styles.aboutStat}>
                  <span className={styles.aboutStatValue}>Multi-Sector
Coverage</span>
              
                </div>
                <div className={styles.aboutStat}>
                  <span className={styles.aboutStatValue}>24/7</span>
                  <span className={styles.aboutStatLabel}>LIVE OPERATIONS</span>
                </div>
                <div className={styles.aboutStat}>
                  <span className={styles.aboutStatValue}>AI assisted THREAT DETECTION</span>
                  <span className={styles.aboutStatLabel}>SIGNAL TO ALERT</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className={styles.timeline}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              {TIMELINE.map((item) => (
                <div key={item.year} className={styles.timelineItem}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <span className={styles.timelineYear}>{item.year}</span>
                  <h4 className={styles.timelineTitle}>{item.title}</h4>
                  <p className={styles.timelineDesc}>{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section id="contact" ref={registerSection('contact')} className={styles.section}>
        <div className={styles.sectionGlowGold} aria-hidden="true" />
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.sectionEyebrow}>CONTACT</span>
            <h2 className={styles.sectionHeading}>Talk to the Command Team</h2>
            <p className={styles.sectionText}>
              For deployment briefings, technical evaluations, or active-incident support.
            </p>
          </motion.div>

          <div className={styles.contactGrid}>
            <motion.div
              className={styles.contactInfoGrid}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                <div key={label} className={styles.contactInfoCard}>
                  <Icon size={18} strokeWidth={1.5} className={styles.contactInfoIcon} />
                  <span className={styles.contactInfoLabel}>{label}</span>
                  <span className={styles.contactInfoValue}>{value}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              className={styles.formPanel}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              {formStatus === 'success' ? (
                <div className={styles.formSuccess}>
                  <CheckCircle2 size={32} strokeWidth={1.5} className={styles.formSuccessIcon} />
                  <h3 className={styles.formSuccessTitle}>Message Received</h3>
                  <p className={styles.formSuccessText}>
                    Our command team will respond within 4 operational hours.
                  </p>
                  <button type="button" className={styles.learnBtn} onClick={resetForm}>
                    <span>SEND ANOTHER MESSAGE</span>
                  </button>
                </div>
              ) : (
                <form className={styles.formGrid} onSubmit={handleFormSubmit} noValidate>
                  <div className={styles.formField}>
                    <label className={styles.formLabel} htmlFor="rk-name">Name</label>
                    <div className={styles.formFieldBar}>
                      <input
                        id="rk-name"
                        type="text"
                        className={styles.formInput}
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleFormChange('name')}
                      />
                    </div>
                    {formErrors.name && <span className={styles.formError}>{formErrors.name}</span>}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel} htmlFor="rk-email">Email</label>
                    <div className={styles.formFieldBar}>
                      <input
                        id="rk-email"
                        type="email"
                        className={styles.formInput}
                        placeholder="you@organisation.in"
                        value={formData.email}
                        onChange={handleFormChange('email')}
                      />
                    </div>
                    {formErrors.email && <span className={styles.formError}>{formErrors.email}</span>}
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.formLabel} htmlFor="rk-subject">Subject</label>
                    <div className={styles.formFieldBar}>
                      <input
                        id="rk-subject"
                        type="text"
                        className={styles.formInput}
                        placeholder="What is this regarding?"
                        value={formData.subject}
                        onChange={handleFormChange('subject')}
                      />
                    </div>
                    {formErrors.subject && <span className={styles.formError}>{formErrors.subject}</span>}
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.formLabel} htmlFor="rk-message">Message</label>
                    <div className={styles.formFieldBar}>
                      <textarea
                        id="rk-message"
                        className={styles.formTextarea}
                        placeholder="Tell us what you need"
                        rows={5}
                        value={formData.message}
                        onChange={handleFormChange('message')}
                      />
                    </div>
                    {formErrors.message && <span className={styles.formError}>{formErrors.message}</span>}
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <button type="submit" className={styles.enterBtn} disabled={formStatus === 'submitting'}>
                      {formStatus === 'submitting' ? (
                        <>
                          <Loader2 size={16} className={styles.spinIcon} />
                          <span>SENDING…</span>
                        </>
                      ) : (
                        <>
                          <span>SEND MESSAGE</span>
                          <Send size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className={styles.siteFooter}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandRow}>
              <Hexagon size={22} strokeWidth={1} className={styles.footerHex} />
              <span className={styles.footerBrandName}>RAKSHAK</span>
            </div>
            <p className={styles.footerTagline}>
              Command-grade situational awareness for the entire frontier.
            </p>
            <div className={styles.footerSocial}>
              {SOCIAL_LINKS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className={styles.footerSocialLink}
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>PLATFORM</span>
              {FOOTER_NAV.platform.map((l) => (
                <button key={l.id} type="button" className={styles.footerLink} onClick={() => scrollToSection(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>COMPANY</span>
              {FOOTER_NAV.company.map((l) => (
                <button key={l.id} type="button" className={styles.footerLink} onClick={() => scrollToSection(l.id)}>
                  {l.label}
                </button>
              ))}
              <button type="button" className={styles.footerLink} onClick={() => navigate(ROUTES.DASHBOARD)}>
                Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© 2026 RAKSHAK. All rights reserved.</span>
          <button
            type="button"
            className={styles.footerBackTop}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp size={12} />
            <span>BACK TO TOP</span>
          </button>
        </div>
      </footer>
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
