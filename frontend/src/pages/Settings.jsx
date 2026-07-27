import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { PageLoader } from '../components/ui';

export default function Settings() {
  const qc = useQueryClient();
  const { data: clinic, isLoading } = useQuery({
    queryKey: ['clinic'],
    queryFn: async () => (await api.get('/clinic')).data.clinic,
  });

  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name || '',
        address: clinic.address || '',
        city: clinic.city || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        doctorName: clinic.doctorName || '',
        doctorRegNumber: clinic.doctorRegNumber || '',
        consultationFeeNew: clinic.consultationFeeNew ?? 500,
        consultationFeeFollowUp: clinic.consultationFeeFollowUp ?? 300,
        whatsappNumber: clinic.whatsappNumber || '',
      });
    }
  }, [clinic]);

  const mut = useMutation({
    mutationFn: (body) => api.put('/clinic', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic'] });
      setMsg('Settings saved');
      setTimeout(() => setMsg(''), 2500);
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => (await api.get('/clinic/activity')).data.logs,
  });

  if (isLoading || !form) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl text-sage-900">Clinic settings</h1>
        <p className="text-muted text-sm mt-1">Letterhead, fees, and practice details</p>
      </div>

      <form
        className="card-surface p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate({
            ...form,
            consultationFeeNew: Number(form.consultationFeeNew),
            consultationFeeFollowUp: Number(form.consultationFeeFollowUp),
          });
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ['name', 'Clinic name'],
            ['doctorName', "Doctor's name"],
            ['doctorRegNumber', 'Registration number'],
            ['phone', 'Phone'],
            ['email', 'Email'],
            ['city', 'City'],
            ['whatsappNumber', 'WhatsApp number'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <textarea className="input min-h-20" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">New consultation fee (₹)</label>
            <input className="input" type="number" value={form.consultationFeeNew} onChange={(e) => setForm({ ...form, consultationFeeNew: e.target.value })} />
          </div>
          <div>
            <label className="label">Follow-up fee (₹)</label>
            <input className="input" type="number" value={form.consultationFeeFollowUp} onChange={(e) => setForm({ ...form, consultationFeeFollowUp: e.target.value })} />
          </div>
        </div>
        {msg && <p className="text-sm text-sage-700">{msg}</p>}
        <button type="submit" className="btn btn-primary" disabled={mut.isPending}>
          {mut.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <section className="card-surface p-5">
        <h2 className="font-display text-lg text-sage-900 mb-3">Activity log</h2>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {(logs || []).slice(0, 30).map((l) => (
            <li key={l.id} className="text-sm flex justify-between gap-3 border-b border-sage-50 pb-2">
              <span>
                <span className="font-medium">{l.action}</span>
                {l.user && <span className="text-muted"> · {l.user.name}</span>}
              </span>
              <span className="text-xs text-muted whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface p-5 bg-sage-50/50">
        <h2 className="font-display text-lg text-sage-900 mb-2">Phase 2 — future scope</h2>
        <ul className="text-sm text-muted space-y-1 list-disc pl-5">
          <li>Kent / Boericke repertory & materia medica quick search</li>
          <li>Rubric-based repertorization tool</li>
          <li>Patient self-service portal for Rx history & booking</li>
          <li>Telemedicine / video consult</li>
          <li>Hindi + English language toggle</li>
        </ul>
      </section>
    </div>
  );
}
