import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Hexagon, ShieldCheck, Eye, EyeOff, Lock, User, Loader2, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import heroArtwork from '../../assets/hero-artwork.jpg';
import styles from './Login.module.css';

/** Fixed particle field — deterministic so it doesn't jump on re-render */
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: (i * 47) % 100,
  top: (i * 61) % 100,
  size: 1 + (i % 3),
  delay: (i % 6) * 0.7,
  duration: 6 + (i % 5),
}));

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const usernameRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Subtle pointer-driven parallax on the background artwork, matching
  // the landing hero's feel.
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mvY, { stiffness: 40, damping: 20 });
  const bgX = useTransform(springX, (v) => v * -8);
  const bgY = useTransform(springY, (v) => v * -6);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mvX.set(e.clientX / innerWidth - 0.5);
    mvY.set(e.clientY / innerHeight - 0.5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage('Enter both username and password.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 401) {
        setErrorMessage('Invalid username or password.');
      } else {
        setErrorMessage('Unable to sign in. Please try again.');
      }
      usernameRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page} onMouseMove={handleMouseMove}>
      {/* ── Background artwork layer ──────────────────────────── */}
      <motion.div className={styles.bgLayer} style={{ x: bgX, y: bgY }}>
        <motion.img
          src={heroArtwork}
          alt=""
          aria-hidden="true"
          className={styles.bgImage}
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 26, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <div className={styles.artworkBloom} aria-hidden="true" />
      </motion.div>

      <div className={styles.gradientVignette} aria-hidden="true" />
      <div className={styles.gradientLR} aria-hidden="true" />
      <div className={styles.gradientBottom} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />
      <div className={styles.grainOverlay} aria-hidden="true" />

      <motion.div
        className={styles.radarSweep}
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      />
      <div className={styles.radarRing} aria-hidden="true" />

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

      <div className={styles.hudFrame} aria-hidden="true">
        <span className={styles.hudCornerTL} />
        <span className={styles.hudCornerTR} />
        <span className={styles.hudCornerBL} />
        <span className={styles.hudCornerBR} />
      </div>

      {/* ── Foreground content ───────────────────────────────── */}
      <div className={styles.content}>
        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.panelHead}>
            <div className={styles.logoWrap}>
              <Hexagon className={styles.hexIcon} size={26} strokeWidth={1} />
              <div className={styles.hexInner} aria-hidden="true" />
            </div>
            <div className={styles.navBrandText}>
              <span className={styles.brandName}>RAKSHAK</span>
              <span className={styles.brandSub}>AI-POWERED BORDER INTELLIGENCE</span>
            </div>
          </div>

          <motion.span
            className={styles.classification}
            {...fadeUp}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <ShieldCheck size={12} strokeWidth={2} />
            SECURE ACCESS // AUTHORIZED PERSONNEL ONLY
          </motion.span>

          <motion.h1
            className={styles.title}
            {...fadeUp}
            transition={{ delay: 0.16, duration: 0.55 }}
          >
            Sign In
          </motion.h1>
          <motion.p
            className={styles.subtitle}
            {...fadeUp}
            transition={{ delay: 0.22, duration: 0.5 }}
          >
            Enter your credentials to access the command console.
          </motion.p>

          <motion.form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="login-username">
                Username
              </label>
              <div className={styles.formFieldBar}>
                <User size={15} strokeWidth={1.5} className={styles.formFieldIcon} aria-hidden="true" />
                <input
                  id="login-username"
                  ref={usernameRef}
                  type="text"
                  className={styles.formInput}
                  placeholder="Enter your username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="login-password">
                Password
              </label>
              <div className={styles.formFieldBar}>
                <Lock size={15} strokeWidth={1.5} className={styles.formFieldIcon} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div id="login-error" className={styles.formErrorBox} role="alert">
                <AlertTriangle size={14} strokeWidth={2} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.enterBtn}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className={styles.spinIcon} />
                  <span>SIGNING IN…</span>
                </>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </motion.form>

          <div className={styles.panelFootNote}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span>CONNECTION ENCRYPTED &amp; MONITORED</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}