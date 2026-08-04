import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Phone, Pill, FileDown, IndianRupee } from 'lucide-react';
import api from '../lib/api';
import { PageLoader, Skeleton, StatusBadge } from '../components/ui';
import { useAuth } from '../store/auth';
import PatientReports from '../components/PatientReports';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'clinical', label: 'Repertorization' },
  { id: 'reports', label: 'Reports' },
  { id: 'billing', label: 'Billing' },
];

export default function PatientDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('overview');
  const canClinical = useAuth((s) => s.canEditClinical());

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => (await api.get(`/patients/${id}`)).data.patient,
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline', id],
    queryFn: async () => (await api.get(`/patients/${id}/timeline`)).data.timeline,
    enabled: tab === 'overview',
  });

  const { data: prescriptions = [], isLoading: rxLoading } = useQuery({
    queryKey: ['patient-prescriptions', id],
    queryFn: async () => (await api.get(`/patients/${id}/prescriptions`)).data.prescriptions,
    enabled: tab === 'prescriptions',
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: async () => (await api.get(`/patients/${id}/invoices`)).data.invoices,
    enabled: tab === 'billing',
  });

  const { data: clinicalSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['clinical-sessions', id],
    queryFn: async () => (await api.get('/clinical/sessions', { params: { patientId: id } })).data.sessions,
    enabled: tab === 'clinical' && canClinical,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p>Patient not found</p>;

  const counts = data._count || {};
  const visits = (timelineData || []).filter((t) => t.type === 'PRESCRIPTION' || t.type === 'CASE');

  const downloadPdf = async (rxId) => {
    const { data: res } = await api.post(`/prescriptions/${rxId}/pdf`);
    window.open(res.pdfUrl, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex gap-4">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center text-2xl font-semibold shrink-0">
                {data.fullName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl text-sage-900">{data.fullName}</h1>
              <p className="text-muted text-sm mt-1">
                {data.uhid} · {data.ageYears || '—'}y / {data.gender || '—'}
                {data.dateOfBirth ? ` · DOB ${format(new Date(data.dateOfBirth), 'd MMM yyyy')}` : ''}
              </p>
              <p className="text-sm mt-2 flex items-center gap-2 text-sage-700">
                <Phone size={14} /> {data.phone}
              </p>
              {data.address && <p className="text-sm text-muted mt-1">{data.address}{data.city ? `, ${data.city}` : ''}</p>}
            </div>
          </div>
          {canClinical && (
            <Link to={`/patients/${id}/prescribe`} className="btn btn-primary">
              <Pill size={16} /> New prescription
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip whitespace-nowrap ${tab === t.id ? 'chip-active' : 'chip-idle'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card-surface p-4">
            <h3 className="font-medium text-sage-900 mb-3">Visit history</h3>
            {timelineLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : !visits.length ? (
              <p className="text-sm text-muted">No visits yet.</p>
            ) : (
              <ul className="space-y-2">
                {visits.map((v, idx) => (
                  <li key={`${v.type}-${idx}`} className="flex justify-between text-sm border-b border-sage-100 pb-2 last:border-0">
                    <span>{v.type === 'PRESCRIPTION' ? 'Prescription' : 'Visit'}</span>
                    <span className="text-muted">{format(new Date(v.date), 'd MMM yyyy')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="card-surface p-4 text-center">
              <p className="text-2xl font-semibold text-sage-900">{counts.prescriptions || 0}</p>
              <p className="text-sm text-muted">Prescriptions</p>
            </div>
            <div className="card-surface p-4 text-center">
              <p className="text-2xl font-semibold text-sage-900">{counts.attachments || 0}</p>
              <p className="text-sm text-muted">Report images</p>
            </div>
            <div className="card-surface p-4 text-center">
              <p className="text-2xl font-semibold text-sage-900">{counts.invoices || 0}</p>
              <p className="text-sm text-muted">Bills</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-3">
          {rxLoading ? (
            <Skeleton className="h-28" />
          ) : !prescriptions.length ? (
            <div className="card-surface p-6 text-muted text-sm">No prescriptions yet.</div>
          ) : (
            prescriptions.map((rx) => (
              <div key={rx.id} className="card-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sage-900">{rx.prescriptionNo}</p>
                    <p className="text-sm text-muted">{format(new Date(rx.visitDate), 'd MMM yyyy')}</p>
                  </div>
                  <button type="button" className="btn btn-secondary text-xs py-2 min-h-9" onClick={() => downloadPdf(rx.id)}>
                    <FileDown size={14} /> PDF
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {(rx.items || []).map((item) => (
                    <li key={item.id} className="text-sage-800">
                      {item.remedyName} {item.potency} — {item.dosage}, {item.frequency}
                    </li>
                  ))}
                </ul>
                {rx.specialInstructions && <p className="text-sm text-muted mt-2">{rx.specialInstructions}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reports' && (
        <PatientReports patientId={id} />
      )}

      {tab === 'clinical' && canClinical && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted">Saved repertorization sessions for this patient</p>
            <Link to={`/clinical?tab=analyze`} className="btn btn-secondary text-xs py-2 min-h-9">New analysis</Link>
          </div>
          {sessionsLoading ? (
            <Skeleton className="h-24" />
          ) : !clinicalSessions.length ? (
            <div className="card-surface p-6 text-muted text-sm">No repertorization saved yet. Analyze from Clinical Suite and link to this patient.</div>
          ) : (
            clinicalSessions.map((s) => {
              const top = s.topRemedies ? JSON.parse(s.topRemedies) : [];
              return (
                <div key={s.id} className="card-surface p-4">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-sage-900">{s.title || 'Repertorization'}</p>
                    <p className="text-xs text-muted">{format(new Date(s.createdAt), 'd MMM yyyy')}</p>
                  </div>
                  {top.length > 0 && (
                    <p className="text-sm text-muted mt-2">
                      Top: {top.slice(0, 3).map((r) => r.name).join(' · ')}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-3">
          {invLoading ? (
            <Skeleton className="h-20" />
          ) : !invoices.length ? (
            <div className="card-surface p-6 text-muted text-sm">No billing records yet.</div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="card-surface p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <IndianRupee size={16} className="text-sage-600" />
                    <span className="font-medium">₹{inv.totalAmount}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {format(new Date(inv.visitDate), 'd MMM yyyy')} · {inv.paymentMode || '—'}
                  </p>
                </div>
                <p className="text-sm text-sage-700">{inv.invoiceNo}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
