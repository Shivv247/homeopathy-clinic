import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { IndianRupee, UserPlus, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { PageLoader, StatusBadge } from '../components/ui';
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

  if (oLoading || aLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <h1 className="font-display text-2xl md:text-3xl text-sage-900 mt-1">
          Namaste, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted mt-1">Search a patient or check today&apos;s list.</p>
      </div>

      <PatientSearch autoFocus className="max-w-2xl" />

      <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-2xl">
        <div className="card-surface p-4">
          <p className="text-2xl font-semibold text-sage-900">{overview?.todayPatients ?? 0}</p>
          <p className="text-sm text-muted">Today&apos;s patients</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-2xl font-semibold text-sage-900">₹{overview?.todayCollection ?? 0}</p>
          <p className="text-sm text-muted flex items-center gap-1"><IndianRupee size={14} /> Collection</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Today&apos;s Patients</h2>
          <Link to="/patients/new" className="btn btn-secondary text-sm py-2 min-h-10">
            <UserPlus size={16} /> New patient
          </Link>
        </div>

        {appointments.length === 0 ? (
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
                    <StatusBadge status={a.status} />
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
