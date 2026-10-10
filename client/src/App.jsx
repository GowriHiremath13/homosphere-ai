import { Navigate, Route, Routes } from 'react-router-dom';
import TVApp from './pages/TVApp.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import AIPage from './pages/AIPage.jsx';
import TimerPage from './pages/TimerPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MobilePage from './pages/MobilePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tv/dashboard" replace />} />
      <Route path="/tv" element={<TVApp />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="ai" element={<AIPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/mobile" element={<MobilePage />} />
      <Route path="*" element={<Navigate to="/tv/dashboard" replace />} />
    </Routes>
  );
}
