// Settings/index.jsx
import { useState } from 'react';
import styles from './Settings.module.css';
import { useBackendStatus } from '../../hooks/useBackendStatus';

const FRONTEND_VERSION = '2.4.0';
const BACKEND_ENDPOINT = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const DEFAULT_SETTINGS = {
  display: {
    compactMode: false,
    animations: true,
    highContrast: false,
  },
  alerts: {
    criticalAlerts: true,
    highAlerts: true,
    soundNotifications: true,
    desktopNotifications: false,
  },
  dashboard: {
    autoRefresh: true,
    refreshInterval: '30',
    defaultLandingPage: 'dashboard',
  },
};

function Toggle({ label, checked, onChange }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const backendStatus = useBackendStatus();
  const [settings, setSettings] = useState(() => structuredClone(DEFAULT_SETTINGS));
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);

  const updateSection = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setDirty(true);
  };

  const handleSave = () => {
    setSavedAt(new Date());
    setDirty(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setDirty(true);
    setSavedAt(null);
  };

  const statusClass =
    backendStatus === 'online'
      ? styles.statusOnline
      : backendStatus === 'offline'
      ? styles.statusOffline
      : styles.statusChecking;

  const statusLabel =
    backendStatus === 'online' ? 'ONLINE' : backendStatus === 'offline' ? 'OFFLINE' : 'CHECKING…';

  const healthLabel =
    backendStatus === 'online' ? 'NOMINAL' : backendStatus === 'offline' ? 'DEGRADED' : 'ASSESSING…';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>System configuration // local operator preferences</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.resetBtn} onClick={handleReset}>RESET DEFAULTS</button>
          <button className={styles.saveBtn} onClick={handleSave}>SAVE SETTINGS</button>
        </div>
      </div>

      {savedAt && !dirty && (
        <div className={styles.savedBanner}>
          <span className={styles.savedDot} />
          Settings saved at {savedAt.toLocaleTimeString()}
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>System</h2>
        <div className={styles.panel}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Backend Status</span>
            <span className={`${styles.statusBadge} ${statusClass}`}>
              <span className={styles.statusDot} />
              {statusLabel}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Backend Endpoint</span>
            <span className={styles.readonlyValue}>{BACKEND_ENDPOINT}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Frontend Version</span>
            <span className={styles.readonlyValue}>v{FRONTEND_VERSION}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>System Health</span>
            <span className={`${styles.statusBadge} ${statusClass}`}>
              <span className={styles.statusDot} />
              {healthLabel}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Display</h2>
        <div className={styles.panel}>
          <Toggle
            label="Compact Mode"
            checked={settings.display.compactMode}
            onChange={(v) => updateSection('display', 'compactMode', v)}
          />
          <Toggle
            label="Animations"
            checked={settings.display.animations}
            onChange={(v) => updateSection('display', 'animations', v)}
          />
          <Toggle
            label="High Contrast Mode"
            checked={settings.display.highContrast}
            onChange={(v) => updateSection('display', 'highContrast', v)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Alerts</h2>
        <div className={styles.panel}>
          <Toggle
            label="Critical Alerts"
            checked={settings.alerts.criticalAlerts}
            onChange={(v) => updateSection('alerts', 'criticalAlerts', v)}
          />
          <Toggle
            label="High Alerts"
            checked={settings.alerts.highAlerts}
            onChange={(v) => updateSection('alerts', 'highAlerts', v)}
          />
          <Toggle
            label="Sound Notifications"
            checked={settings.alerts.soundNotifications}
            onChange={(v) => updateSection('alerts', 'soundNotifications', v)}
          />
          <Toggle
            label="Desktop Notifications"
            checked={settings.alerts.desktopNotifications}
            onChange={(v) => updateSection('alerts', 'desktopNotifications', v)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dashboard</h2>
        <div className={styles.panel}>
          <Toggle
            label="Auto Refresh"
            checked={settings.dashboard.autoRefresh}
            onChange={(v) => updateSection('dashboard', 'autoRefresh', v)}
          />
          <Select
            label="Refresh Interval"
            value={settings.dashboard.refreshInterval}
            onChange={(v) => updateSection('dashboard', 'refreshInterval', v)}
            options={[
              { value: '10', label: '10 seconds' },
              { value: '30', label: '30 seconds' },
              { value: '60', label: '1 minute' },
              { value: '300', label: '5 minutes' },
            ]}
          />
          <Select
            label="Default Landing Page"
            value={settings.dashboard.defaultLandingPage}
            onChange={(v) => updateSection('dashboard', 'defaultLandingPage', v)}
            options={[
              { value: 'dashboard', label: 'Dashboard' },
              { value: 'threat-analysis', label: 'Threat Analysis' },
              { value: 'personnel', label: 'Personnel' },
              { value: 'surveillance', label: 'Surveillance' },
              { value: 'reports', label: 'Reports' },
              { value: 'communications', label: 'Communications' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}