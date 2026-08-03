import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { useAuth } from './store/auth';
import { PageLoader } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import CaseTaking from './pages/CaseTaking';
import CaseView from './pages/CaseView';
import Prescribe from './pages/Prescribe';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';

const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Messages = lazy(() => import('./pages/Messages'));

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function PrivateRoute({ children, roles }) {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
          <Route path="/patients/new" element={<PrivateRoute roles={['DOCTOR', 'RECEPTIONIST']}><PatientForm /></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><PatientDetail /></PrivateRoute>} />
          <Route path="/patients/:id/case" element={<PrivateRoute roles={['DOCTOR']}><CaseTaking /></PrivateRoute>} />
          <Route path="/patients/:id/prescribe" element={<PrivateRoute roles={['DOCTOR']}><Prescribe /></PrivateRoute>} />
          <Route path="/cases/:id" element={<PrivateRoute><CaseView /></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute roles={['DOCTOR', 'RECEPTIONIST']}><Billing /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute roles={['DOCTOR', 'RECEPTIONIST']}><LazyPage><Inventory /></LazyPage></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute roles={['DOCTOR']}><LazyPage><Reports /></LazyPage></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute roles={['DOCTOR', 'RECEPTIONIST']}><LazyPage><Messages /></LazyPage></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute roles={['DOCTOR']}><LazyPage><Settings /></LazyPage></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
