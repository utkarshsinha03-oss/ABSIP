import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Radar, ShieldAlert, Users,
  Radio, FileText, Settings, ChevronLeft, ChevronRight,
  Hexagon, Activity, GitBranch
} from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard',       path: ROUTES.DASHBOARD,        icon: LayoutDashboard },
  { label: 'Surveillance',    path: ROUTES.SURVEILLANCE,     icon: Radar },
  { label: 'Threat Analysis', path: ROUTES.THREAT_ANALYSIS,  icon: ShieldAlert },
  { label: 'Planning',        path: ROUTES.PLANNING,         icon: GitBranch },
  { label: 'Personnel',       path: ROUTES.PERSONNEL,        icon: Users },
  { label: 'Communications',  path: ROUTES.COMMUNICATIONS,   icon: Radio },
  { label: 'Reports',         path: ROUTES.REPORTS,          icon: FileText },
  { label: 'Settings',        path: ROUTES.SETTINGS,         icon: Settings },
];

const sidebarVariants = {
  expanded:  { width: 240 },
  collapsed: { width: 64 },
};

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      className={styles.sidebar}
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className={styles.brand}>
        <Hexagon className={styles.brandIcon} size={28} strokeWidth={1.5} />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className={styles.brandText}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <span className={styles.brandName}>RAKSHAK</span>
              <span className={styles.brandSub}>BSIP v2.4</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Nav */}
      <nav className={styles.nav} role="navigation">
        <ul className={styles.navList} role="list">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <li key={path} role="listitem">
              <NavLink
                to={path}
                className={({ isActive }) =>
                  [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
                }
                title={collapsed ? label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        className={styles.activeIndicator}
                        layoutId="activeIndicator"
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                    <Icon
                      className={styles.navIcon}
                      size={18}
                      strokeWidth={isActive ? 2 : 1.5}
                      aria-hidden="true"
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          className={styles.navLabel}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.15 }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.divider} />
        <div className={styles.systemStatus}>
          <Activity size={14} className={styles.statusDot} aria-hidden="true" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className={styles.statusLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                ALL SYSTEMS NOMINAL
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight size={16} aria-hidden="true" />
            : <ChevronLeft  size={16} aria-hidden="true" />
          }
        </button>
      </div>
    </motion.aside>
  );
}
