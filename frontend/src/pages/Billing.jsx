import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../lib/api';
import { PageLoader, StatusBadge } from '../components/ui';

export default function Billing() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('today');
  const qc = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', tab, date],
    queryFn: async () => {
      const params = tab === 'outstanding' ? { outstanding: 'true' } : { date };
      return (await api.get('/billing', { params })).data.invoices;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['billing-summary', date],
    queryFn: async () => (await api.get('/billing/summary/daily', { params: { date } })).data.summary,
  });

  const payMut = useMutation({
    mutationFn: ({ id, paidAmount, paymentMode }) => api.patch(`/billing/${id}/payment`, { paidAmount, paymentMode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-sage-900">Billing</h1>
          <p className="text-muted text-sm mt-1">Invoices, dues & daily collection</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>New invoice</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Billed', `₹${summary.billed}`],
            ['Collected', `₹${summary.collected}`],
            ['Outstanding', `₹${summary.outstanding}`],
            ['Invoices', summary.count],
          ].map(([l, v]) => (
            <div key={l} className="card-surface p-4">
              <p className="text-xl font-semibold text-sage-900">{v}</p>
              <p className="text-sm text-muted">{l}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" className={`chip ${tab === 'today' ? 'chip-active' : 'chip-idle'}`} onClick={() => setTab('today')}>By date</button>
        <button type="button" className={`chip ${tab === 'outstanding' ? 'chip-active' : 'chip-idle'}`} onClick={() => setTab('outstanding')}>Outstanding</button>
        {tab === 'today' && (
          <input type="date" className="input w-auto ml-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        )}
      </div>

      {showForm && (
        <InvoiceForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['billing-summary'] }); }}
        />
      )}

      {isLoading ? <PageLoader /> : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="card-surface p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{inv.patient.fullName}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-sm text-muted mt-0.5">
                  {inv.invoiceNo} · ₹{inv.totalAmount} · Paid ₹{inv.paidAmount}
                  {inv.paymentMode ? ` · ${inv.paymentMode}` : ''}
                </p>
              </div>
              {inv.status !== 'PAID' && (
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => payMut.mutate({ id: inv.id, paidAmount: inv.totalAmount, paymentMode: 'UPI' })}
                >
                  Mark paid (UPI)
                </button>
              )}
            </div>
          ))}
          {!invoices.length && <div className="card-surface p-8 text-center text-muted">No invoices</div>}
        </div>
      )}
    </div>
  );
}

function InvoiceForm({ onClose, onSaved }) {
  const [patientQ, setPatientQ] = useState('');
  const [patientId, setPatientId] = useState('');
  const [visitType, setVisitType] = useState('NEW');
  const [medicineCharge, setMedicineCharge] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [error, setError] = useState('');

  const { data: patients = [] } = useQuery({
    queryKey: ['patient-search-bill', patientQ],
    queryFn: async () => (await api.get('/patients', { params: { q: patientQ, limit: 8 } })).data.patients,
    enabled: patientQ.length >= 2,
  });

  const mut = useMutation({
    mutationFn: (body) => api.post('/billing', body),
    onSuccess: onSaved,
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="card-surface p-5 space-y-4">
      <h2 className="font-medium">Create invoice</h2>
      <div className="relative">
        <label className="label">Patient</label>
        <input className="input" value={patientQ} onChange={(e) => { setPatientQ(e.target.value); setPatientId(''); }} placeholder="Search…" />
        {patients.length > 0 && !patientId && (
          <ul className="mt-1 border rounded-xl bg-white overflow-hidden">
            {patients.map((p) => (
              <li key={p.id}>
                <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-sage-50" onClick={() => { setPatientId(p.id); setPatientQ(p.fullName); }}>
                  {p.fullName} · {p.uhid}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Visit type</label>
          <select className="input" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
            <option value="NEW">New</option>
            <option value="FOLLOW_UP">Follow-up</option>
          </select>
        </div>
        <div>
          <label className="label">Medicine ₹</label>
          <input className="input" type="number" value={medicineCharge} onChange={(e) => setMedicineCharge(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Paid now ₹</label>
          <input className="input" type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div>
        <label className="label">Payment mode</label>
        <select className="input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
          <option>CASH</option>
          <option>UPI</option>
          <option>CARD</option>
          <option>PENDING</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!patientId || mut.isPending}
          onClick={() => mut.mutate({
            patientId,
            visitType,
            medicineCharge,
            paidAmount: paidAmount === '' ? 0 : Number(paidAmount),
            paymentMode,
          })}
        >
          Create
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
