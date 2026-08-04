import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { IndianRupee, UserPlus, ChevronRight, Brain, Users, TrendingUp, AlertCircle, CalendarClock } from 'lucide-react';
import api from '../lib/api';
import { StatSkeleton } from '../components/ui';
import { useAuth } from '../store/auth';
import PatientSearch from '../components/PatientSearch';

export default function Dashboard() {
  const user = useAuth((s) => s.user);

  const { data: overview, isLoading: oLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get('/dashboard/overview')).data.overview,
  });

  const { data: appointments = [], isLoading: aLoading } = useQuery({
    queryKey: ['appointments-today'],
    queryFn: async () => (await api.get('/appointments/today')).data.appointments,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <h1 className="font-display text-2xl md:text-3xl text-sage-900 mt-1">
          Hello, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted mt-1">Search a patient or check today&apos;s list.</p>
      </div>

      <PatientSearch autoFocus className="w-full max-w-2xl" />

      {user?.role === 'DOCTOR' && (
        <Link
          to="/clinical"
          className="card-surface p-4 flex items-center gap-4 hover:border-sage-400 transition-colors max-w-2xl bg-gradient-to-r from-sage-50 to-white"
        >
          <div className="w-12 h-12 rounded-xl bg-sage-600 text-white flex items-center justify-center shrink-0">
            <Brain size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sage-900">Clinical Suite</p>
            <p className="text-sm text-muted">Repertory · Materia Medica · Classic books · Repertorization</p>
          </div>
          <ChevronRight className="text-sage-500 shrink-0" size={20} />
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl">
        {oLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="card-surface p-4">
              <p className="text-2xl font-semibold text-sage-900">{overview?.todayPatients ?? 0}</p>
              <p className="text-sm text-muted">Today&apos;s patients</p>
            </div>
            <div className="card-surface p-4">
              <p className="text-2xl font-semibold text-sage-900">₹{overview?.todayCollection ?? 0}</p>
              <p className="text-sm text-muted flex items-center gap-1"><IndianRupee size={14} /> Today</p>
            </div>
            {user?.role === 'DOCTOR' && (
              <>
                <div className="card-surface p-4">
                  <p className="text-2xl font-semibold text-sage-900">₹{overview?.monthRevenue ?? 0}</p>
                  <p className="text-sm text-muted flex items-center gap-1"><TrendingUp size={14} /> This month</p>
                </div>
                <div className="card-surface p-4">
                  <p className="text-2xl font-semibold text-sage-900">{overview?.totalPatients ?? 0}</p>
                  <p className="text-sm text-muted flex items-center gap-1"><Users size={14} /> Total patients</p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {user?.role === 'DOCTOR' && !oLoading && (overview?.pendingInvoices > 0 || overview?.lowStockCount > 0 || overview?.dueFollowUps > 0) && (
        <div className="flex flex-wrap gap-3 max-w-4xl">
          {overview.dueFollowUps > 0 && (
            <Link to="/messages" className="card-surface px-4 py-3 flex items-center gap-2 text-sm text-sage-800 bg-sage-50 border-sage-200 hover:border-sage-300">
              <CalendarClock size={16} /> {overview.dueFollowUps} follow-up(s) due in 15 days
            </Link>
          )}
          {overview.pendingInvoices > 0 && (
            <Link to="/billing" className="card-surface px-4 py-3 flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border-amber-200 hover:border-amber-300">
              <AlertCircle size={16} /> {overview.pendingInvoices} pending invoice(s)
            </Link>
          )}
          {overview.lowStockCount > 0 && (
            <Link to="/inventory" className="card-surface px-4 py-3 flex items-center gap-2 text-sm text-red-800 bg-red-50 border-red-200 hover:border-red-300">
              <AlertCircle size={16} /> {overview.lowStockCount} low-stock item(s)
            </Link>
          )}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Today&apos;s Patients</h2>
          <Link to="/patients/new" className="btn btn-secondary text-sm py-2 min-h-10">
            <UserPlus size={16} /> New patient
          </Link>
        </div>

        {aLoading ? (
          <div className="space-y-2">
            <StatSkeleton className="h-20" />
            <StatSkeleton className="h-20" />
            <StatSkeleton className="h-20" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="card-surface p-8 text-center text-muted">
            No patients scheduled yet. Search above or register a new patient.
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <Link
                key={a.id}
                to={`/patients/${a.patient.id}`}
                className="card-surface p-4 flex items-center gap-3 hover:border-sage-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center font-semibold text-lg shrink-0">
                  {a.tokenNumber || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sage-900">{a.patient.fullName}</span>
                  </div>
                  <p className="text-sm text-muted mt-0.5">
                    {a.patient.uhid} · {a.patient.ageYears || '—'} / {a.patient.gender || '—'}
                  </p>
                </div>
                <ChevronRight className="text-sage-500 shrink-0" size={20} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
