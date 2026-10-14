import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ToastProvider } from './toast';
import Login from './Login';
import Candidats from './components/Candidats';
import CreateJob from './components/CreateJob';
import DashboardCandidat from './components/DashboardCandidat';
import DashboardRecruteur from './components/DashboardRecruteur';
import EditJob from './components/EditJob';
import JobDetails from './components/JobDetails';
import MesCandidatures from './components/MesCandidatures';
import Rapports from './components/Rapports';
import Sauvegardees from './components/Sauvegardees';

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <Login />;

  if (user.role === 'RECRUTEUR') {
    return (
      <Routes>
        <Route path="/" element={<DashboardRecruteur />} />
        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/edit-job/:id" element={<EditJob />} />
        <Route path="/candidats" element={<Candidats />} />
        <Route path="/job/:id/candidatures" element={<Candidats />} />
        <Route path="/rapports" element={<Rapports />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardCandidat />} />
      <Route path="/candidat/sauvegardees" element={<Sauvegardees />} />
      <Route path="/candidat/candidatures" element={<MesCandidatures />} />
      <Route path="/job/:id" element={<JobDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
