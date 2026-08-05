import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import ProtectedRoute from './auth/ProtectedRoute';

import LandingPage        from './pages/Landing/index';
import LoginPage          from './pages/Login/index';
import DashboardPage      from './pages/Dashboard/index';
import SurveillancePage   from './pages/Surveillance/index';
import ThreatAnalysisPage from './pages/ThreatAnalysis/index';
import PlanningPage       from './pages/Planning/index';
import PersonnelPage      from './pages/Personnel/index';
import CommunicationsPage from './pages/Communications/index';
import ReportsPage        from './pages/Reports/index';
import SettingsPage       from './pages/Settings/index';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected application */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.SURVEILLANCE} element={<SurveillancePage />} />
            <Route path={ROUTES.THREAT_ANALYSIS} element={<ThreatAnalysisPage />} />
            <Route path={ROUTES.PLANNING} element={<PlanningPage />} />
            <Route path={ROUTES.PERSONNEL} element={<PersonnelPage />} />
            <Route path={ROUTES.COMMUNICATIONS} element={<CommunicationsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  );
}