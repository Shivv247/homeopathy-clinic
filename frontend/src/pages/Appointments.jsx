import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import { PageLoader, StatusBadge, TagBadge } from '../components/ui';
import { useAuth } from '../store/auth';

export default function Appointments() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAdd, setShowAdd] = useState(false);
  const [searchParams] = useSearchParams();
  const prePatient = searchParams.get('patient') || '';
  const canManage = useAuth((s) => s.canManageOps());
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', date],
    queryFn: async () => (await api.get('/appointments', { params: { date } })).data.appointments,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-sage-900">Queue & Appointments</h1>
          <p className="text-muted text-sm mt-1">Daily OPD list by token</p>
        </div>
        <div className="flex gap-2">
          <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
          {canManage && (
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add / Walk-in
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <AddAppointment
          date={date}
          prePatient={prePatient}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ['appointments'] });
          }}
        />
      )}

      {isLoading ? <PageLoader /> : appointments.length === 0 ? (
        <div className="card-surface p-8 text-center text-muted">No appointments for this day.</div>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a.id} className="card-surface p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center font-semibold text-lg shrink-0">
                {a.tokenNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/patients/${a.patient.id}`} className="font-medium hover:underline">{a.patient.fullName}</Link>
                  <TagBadge tag={a.patient.tag} />
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-muted">{a.patient.uhid} · {a.type.replace('_', ' ')} {a.timeSlot ? `· ${a.timeSlot}` : ''}</p>
              </div>
              {canManage && (
                <select
                  className="input w-auto text-sm min-h-10"
                  value={a.status}
                  onChange={(e) => statusMut.mutate({ id: a.id, status: e.target.value })}
                >
                  {['SCHEDULED', 'ARRIVED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddAppointment({ date, prePatient, onClose, onSaved }) {
  const [patientQ, setPatientQ] = useState('');
  const [patientId, setPatientId] = useState(prePatient);
  const [type, setType] = useState(prePatient ? 'FOLLOW_UP' : 'WALK_IN');
  const [timeSlot, setTimeSlot] = useState('');
  const [error, setError] = useState('');

  const { data: patients = [] } = useQuery({
    queryKey: ['patient-search', patientQ],
    queryFn: async () => (await api.get('/patients', { params: { q: patientQ, limit: 8 } })).data.patients,
    enabled: patientQ.length >= 2 && !prePatient,
  });

  const { data: preloaded } = useQuery({
    queryKey: ['patient', prePatient],
    queryFn: async () => (await api.get(`/patients/${prePatient}`)).data.patient,
    enabled: !!prePatient,
  });

  const mut = useMutation({
    mutationFn: (body) => api.post('/appointments', body),
    onSuccess: onSaved,
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="card-surface p-5 space-y-4">
      <h2 className="font-medium text-sage-900">New appointment / walk-in</h2>
      {!prePatient ? (
        <div className="relative">
          <label className="label">Patient</label>
          <input className="input" placeholder="Search patient…" value={patientQ} onChange={(e) => { setPatientQ(e.target.value); setPatientId(''); }} />
          {patients.length > 0 && !patientId && (
            <ul className="mt-1 border border-sage-200 rounded-xl bg-white overflow-hidden">
              {patients.map((p) => (
                <li key={p.id}>
                  <button type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-sage-50" onClick={() => { setPatientId(p.id); setPatientQ(p.fullName); }}>
                    {p.fullName} · {p.uhid} · {p.phone}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm">Patient: <strong>{preloaded?.fullName}</strong></p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="WALK_IN">Walk-in</option>
            <option value="NEW">New appointment</option>
            <option value="FOLLOW_UP">Follow-up</option>
          </select>
        </div>
        <div>
          <label className="label">Time slot</label>
          <input className="input" placeholder="e.g. 11:00" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!patientId || mut.isPending}
          onClick={() => mut.mutate({ patientId, date: `${date}T10:00:00`, type, timeSlot: timeSlot || null })}
        >
          {mut.isPending ? 'Saving…' : 'Add to queue'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
