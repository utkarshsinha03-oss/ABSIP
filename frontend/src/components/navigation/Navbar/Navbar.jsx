import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Wifi, WifiOff, Shield, Clock, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth';
import { formatTime, formatDate } from '../../../utils/formatDate';
import { useBackendStatus } from '../../../hooks/useBackendStatus';
import { useAlerts } from '../../../hooks/useAlerts';
import styles from './Navbar.module.css';

const ROUTE_TITLES = {
  '/dashboard':        'Command Dashboard',
  '/surveillance':     'Surveillance Grid',
  '/threat-analysis':  'Threat Analysis',
  '/personnel':        'Personnel Registry',
  '/communications':   'Communications Hub',
  '/reports':          'Intelligence Reports',
  '/settings':         'System Configuration',
};

export default function Navbar() {
  const location   = useLocation();
  const navigate = useNavigate();
const { user, logout } = useAuth();

const handleLogout = () => {
  logout();
  navigate('/login', { replace: true });
};
const operatorInitials = user?.username
  ? user.username.slice(0, 2).toUpperCase()
  : 'OP';
  const [now, setNow] = useState(new Date());
  const backendStatus = useBackendStatus();
  const { alerts } = useAlerts();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pageTitle   = ROUTE_TITLES[location.pathname] ?? 'RAKSHAK';
  const alertCount  = alerts.filter((a) => ['critical','high'].includes(a.threat_level?.toLowerCase())).length;
  const isOnline    = backendStatus === 'online';
  const isChecking  = backendStatus === 'checking';

  return (
    <header className={styles.navbar} role="banner">
      {/* Left */}
      <div className={styles.left}>
        <div className={styles.pageInfo}>
          <span className={styles.eyebrow}>BSIP // INDIA BORDER COMMAND</span>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>
      </div>

      {/* Centre – search */}
      <div className={styles.centre}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search sectors, alerts, personnel…"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right */}
      <div className={styles.right}>
        {/* Backend status */}
        <div
          className={`${styles.statusChip} ${isChecking ? styles.statusChecking : isOnline ? styles.statusOnline : styles.statusOffline}`}
          title={`Backend: ${backendStatus}`}
        >
          {isOnline
            ? <Wifi size={12} aria-hidden="true" />
            : <WifiOff size={12} aria-hidden="true" />
          }
          <span className={styles.statusText}>
            {isChecking ? 'CHECKING…' : isOnline ? 'ALL SERVICES ONLINE' : 'BACKEND OFFLINE'}
          </span>
        </div>

        {/* Clearance */}
        <div className={styles.clearanceChip}>
          <Shield size={12} aria-hidden="true" />
          <span>LVL 4</span>
        </div>

        {/* Clock */}
        <div className={styles.clockBlock} aria-label="Current time">
          <Clock size={12} className={styles.clockIcon} aria-hidden="true" />
          <div className={styles.clockStack}>
            <span className={styles.clockTime}>{formatTime(now)}</span>
            <span className={styles.clockDate}>{formatDate(now)}</span>
          </div>
        </div>

        {/* Bell */}
        <button className={styles.bellBtn} aria-label={`${alertCount} high-priority alerts`}>
          <Bell size={16} aria-hidden="true" />
          {alertCount > 0 && (
            <span className={styles.badge} aria-hidden="true">{alertCount}</span>
          )}
        </button>

       {/* Operator */}
<div
  className={styles.avatar}
  aria-label={user?.username ? `Operator ${user.username}` : 'Operator profile'}
  role="img"
  title={user?.username || 'Operator'}
>
  <span className={styles.avatarInitials}>{operatorInitials}</span>
  <div className={styles.avatarOnline} aria-hidden="true" />
</div>

{/* Logout */}
<button
  className={styles.logoutBtn}
  onClick={handleLogout}
  aria-label="Logout"
  title="Logout"
>
  <LogOut size={15} aria-hidden="true" />
</button>
      </div>
    </header>
  );
}
