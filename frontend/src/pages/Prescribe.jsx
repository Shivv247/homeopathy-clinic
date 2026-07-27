import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, FileDown, MessageCircle } from 'lucide-react';
import api from '../lib/api';
import { PageLoader } from '../components/ui';

const emptyItem = () => ({
  remedyId: null, remedyName: '', potency: '30C', dosage: '4 pills',
  frequency: 'Once daily', duration: '7 days', instructions: '', quantity: 1,
});

export default function Prescribe() {
  const { id: patientId } = useParams();
  const [search] = useSearchParams();
  const caseId = search.get('case');
  const navigate = useNavigate();

  const [items, setItems] = useState([emptyItem()]);
  const [special, setSpecial] = useState('Avoid coffee and mint. Take away from food.');
  const [nextDays, setNextDays] = useState(15);
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState(null);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await api.get(`/patients/${patientId}`)).data.patient,
  });

  const { data: lastRx } = useQuery({
    queryKey: ['last-rx', patientId],
    queryFn: async () => (await api.get(`/prescriptions/patient/${patientId}/last`)).data.prescription,
  });

  const { data: remedies = [] } = useQuery({
    queryKey: ['remedies', q],
    queryFn: async () => (await api.get('/prescriptions/remedies', { params: { q } })).data.remedies,
    enabled: q.length >= 1,
  });

  useEffect(() => {
    if (lastRx?.items?.length && items.length === 1 && !items[0].remedyName) {
      // offer autofill via button only — don't auto-overwrite
    }
  }, [lastRx]);

  const autofillLast = () => {
    if (!lastRx?.items?.length) return;
    setItems(lastRx.items.map((i) => ({
      remedyId: i.remedyId,
      remedyName: i.remedyName,
      potency: i.potency || '30C',
      dosage: i.dosage || '',
      frequency: i.frequency || '',
      duration: i.duration || '',
      instructions: i.instructions || '',
      quantity: i.quantity || 1,
    })));
    setSpecial(lastRx.specialInstructions || special);
    setNextDays(lastRx.nextVisitDays || 15);
  };

  const updateItem = (idx, key, val) => {
    setItems((list) => list.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  };

  const pickRemedy = (idx, remedy) => {
    updateItem(idx, 'remedyId', remedy.id);
    updateItem(idx, 'remedyName', remedy.name);
    if (remedy.potencies?.[0]) updateItem(idx, 'potency', remedy.potencies[0]);
    setQ('');
  };

  const mut = useMutation({
    mutationFn: (body) => api.post('/prescriptions', body),
    onSuccess: ({ data }) => setSavedId(data.prescription.id),
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const valid = items.filter((i) => i.remedyName.trim());
    if (!valid.length) return setError('Add at least one remedy');
    mut.mutate({
      patientId,
      caseRecordId: caseId || null,
      specialInstructions: special,
      nextVisitDays: Number(nextDays) || null,
      items: valid,
      deductStock: true,
    });
  };

  const genPdf = async () => {
    const { data } = await api.post(`/prescriptions/${savedId}/pdf`);
    window.open(data.pdfUrl, '_blank');
  };

  const sendWa = async () => {
    await api.post(`/prescriptions/${savedId}/whatsapp`);
    alert('Prescription shared via WhatsApp (stub logs message if API not configured)');
  };

  if (isLoading) return <PageLoader />;

  if (savedId) {
    return (
      <div className="max-w-lg mx-auto card-surface p-8 text-center space-y-4">
        <h1 className="font-display text-2xl text-sage-900">Prescription saved</h1>
        <p className="text-muted text-sm">Ready to print or share with the patient.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" className="btn btn-primary" onClick={genPdf}><FileDown size={16} /> Download PDF</button>
          <button type="button" className="btn btn-secondary" onClick={sendWa}><MessageCircle size={16} /> WhatsApp</button>
          <Link to={`/patients/${patientId}`} className="btn btn-secondary">Back to patient</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            <Link to={`/patients/${patientId}`} className="hover:underline">{patient?.fullName}</Link> · {patient?.uhid}
          </p>
          <h1 className="font-display text-2xl text-sage-900 mt-1">Prescription</h1>
        </div>
        {lastRx && (
          <button type="button" className="btn btn-secondary text-xs" onClick={autofillLast}>
            Repeat last prescription
          </button>
        )}
      </div>

      <section className="card-surface p-5 space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-sage-100 bg-sage-50/50 space-y-3 relative">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-sage-700">Remedy {idx + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => setItems((l) => l.filter((_, i) => i !== idx))} className="text-red-600">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="relative">
              <input
                className="input"
                placeholder="Search remedy…"
                value={activeIdx === idx ? (q || item.remedyName) : item.remedyName}
                onFocus={() => { setActiveIdx(idx); setQ(item.remedyName); }}
                onChange={(e) => {
                  setActiveIdx(idx);
                  setQ(e.target.value);
                  updateItem(idx, 'remedyName', e.target.value);
                  updateItem(idx, 'remedyId', null);
                }}
                required
              />
              {activeIdx === idx && q && remedies.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-sage-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                  {remedies.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-sage-50"
                        onClick={() => pickRemedy(idx, r)}
                      >
                        <span className="font-medium">{r.name}</span>
                        {r.commonName && <span className="text-muted"> · {r.commonName}</span>}
                        <span className="text-xs text-sage-600 ml-2">{r.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input className="input" placeholder="Potency" value={item.potency} onChange={(e) => updateItem(idx, 'potency', e.target.value)} />
              <input className="input" placeholder="Dosage" value={item.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)} />
              <input className="input" placeholder="Frequency" value={item.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} />
              <input className="input" placeholder="Duration" value={item.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} />
            </div>
            <input className="input" placeholder="Special instructions for this remedy" value={item.instructions} onChange={(e) => updateItem(idx, 'instructions', e.target.value)} />
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => setItems((l) => [...l, emptyItem()])}>
          <Plus size={16} /> Add remedy
        </button>
      </section>

      <section className="card-surface p-5 space-y-4">
        <div>
          <label className="label">General instructions</label>
          <textarea className="input min-h-20" value={special} onChange={(e) => setSpecial(e.target.value)} />
        </div>
        <div className="max-w-xs">
          <label className="label">Next visit (days)</label>
          <input className="input" type="number" value={nextDays} onChange={(e) => setNextDays(e.target.value)} />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={mut.isPending}>
          {mut.isPending ? 'Saving…' : 'Save prescription'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}
