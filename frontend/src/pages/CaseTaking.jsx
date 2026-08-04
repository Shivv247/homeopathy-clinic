import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Brain } from 'lucide-react';
import api from '../lib/api';
import { ChipSelect, PageLoader } from '../components/ui';

const MODALITIES = ['Heat', 'Cold', 'Pressure', 'Motion', 'Rest', 'Morning', 'Evening', 'Night', 'Open air', 'Warmth of bed', 'Eating', 'Lying down'];
const THERMAL = ['Chilly', 'Hot', 'Ambithermal'];
const MIASMS = ['Psoric', 'Sycotic', 'Syphilitic', 'Tubercular'];
const IMPROVEMENT = ['Improved', 'Same', 'Worse'];
const CRAVINGS = ['Salt', 'Sweets', 'Spicy', 'Sour', 'Fat', 'Cold drinks', 'Warm drinks', 'Milk'];
const FEARS = ['Dark', 'Alone', 'Death', 'Failure', 'Crowds', 'Heights', 'Dogs', 'Thunder'];

const emptyComplaint = () => ({
  description: '', location: '', sensation: '',
  modalityAgg: [], modalityAmel: [], duration: '', concomitants: '',
});

export default function CaseTaking() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await api.get(`/patients/${patientId}`)).data.patient,
  });

  const [visitType, setVisitType] = useState('NEW');
  const [complaints, setComplaints] = useState([emptyComplaint()]);
  const [physical, setPhysical] = useState({
    appetite: '', thirst: '', sleep: '', dreams: '', stool: '', urine: '',
    perspiration: '', thermal: '', cravings: [], aversions: [], menstrual: '',
  });
  const [mental, setMental] = useState({
    temperament: '', fears: [], anger: '', likes: '', dislikes: '',
    consolation: '', memory: '', mood: '',
  });
  const [past, setPast] = useState({
    illnesses: '', surgeries: '', allergies: '', familyHistory: '',
  });
  const [exam, setExam] = useState({ bp: '', weight: '', pulse: '' });
  const [diagnosis, setDiagnosis] = useState('');
  const [miasm, setMiasm] = useState('');
  const [observation, setObservation] = useState('');
  const [improvementStatus, setImprovementStatus] = useState('');
  const [improvementPercent, setImprovementPercent] = useState('');

  const mut = useMutation({
    mutationFn: (body) => api.post('/cases', body),
    onSuccess: ({ data }) => navigate(`/cases/${data.case.id}`),
    onError: (err) => setError(err.response?.data?.message || 'Failed to save case'),
  });

  const updateComplaint = (idx, key, val) => {
    setComplaints((list) => list.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
  };

  const buildSymptomText = () => {
    const parts = [];
    complaints.forEach((c) => {
      if (!c.description.trim()) return;
      parts.push(c.description);
      if (c.sensation) parts.push(c.sensation);
      if (c.modalityAgg?.length) parts.push(`worse from ${c.modalityAgg.join(', ')}`);
      if (c.modalityAmel?.length) parts.push(`better from ${c.modalityAmel.join(', ')}`);
    });
    if (mental.temperament) parts.push(mental.temperament);
    if (mental.fears?.length) parts.push(`fear of ${mental.fears.join(', ')}`);
    if (mental.mood) parts.push(mental.mood);
    if (physical.thermal) parts.push(physical.thermal);
    if (physical.cravings?.length) parts.push(`craves ${physical.cravings.join(', ')}`);
    if (miasm) parts.push(`${miasm} miasm`);
    return parts.join(', ');
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    mut.mutate({
      patientId,
      visitType,
      chiefComplaints: complaints.filter((c) => c.description.trim()),
      physicalGenerals: physical,
      mentalGenerals: mental,
      pastHistory: {
        illnesses: past.illnesses ? past.illnesses.split(',').map((s) => s.trim()) : [],
        surgeries: past.surgeries ? past.surgeries.split(',').map((s) => s.trim()) : [],
        allergies: past.allergies ? past.allergies.split(',').map((s) => s.trim()) : [],
        familyHistory: past.familyHistory ? past.familyHistory.split(',').map((s) => s.trim()) : [],
      },
      physicalExam: exam,
      provisionalDiagnosis: diagnosis || null,
      miasm: miasm || null,
      doctorObservation: observation || null,
      improvementStatus: visitType === 'FOLLOW_UP' ? improvementStatus || null : null,
      improvementPercent: visitType === 'FOLLOW_UP' && improvementPercent !== '' ? Number(improvementPercent) : null,
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            <Link to={`/patients/${patientId}`} className="hover:underline">{patient?.fullName}</Link> · {patient?.uhid}
          </p>
          <h1 className="font-display text-2xl text-sage-900 mt-1">Case taking</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['NEW', 'FOLLOW_UP'].map((t) => (
            <button key={t} type="button" className={`chip ${visitType === t ? 'chip-active' : 'chip-idle'}`} onClick={() => setVisitType(t)}>
              {t === 'NEW' ? 'New case' : 'Follow-up'}
            </button>
          ))}
          <Link
            to={`/clinical?tab=analyze&symptoms=${encodeURIComponent(buildSymptomText())}`}
            className="btn btn-secondary text-xs py-2 min-h-10"
          >
            <Brain size={16} /> Analyze in Repertory
          </Link>
        </div>
      </div>

      {visitType === 'FOLLOW_UP' && (
        <section className="card-surface p-5 space-y-4">
          <h2 className="font-display text-lg text-sage-900">Improvement since last visit</h2>
          <ChipSelect options={IMPROVEMENT} value={improvementStatus} onChange={setImprovementStatus} />
          <div className="max-w-xs">
            <label className="label">Improvement %</label>
            <input className="input" type="number" min={0} max={100} value={improvementPercent} onChange={(e) => setImprovementPercent(e.target.value)} placeholder="0–100" />
          </div>
        </section>
      )}

      {/* Chief complaints */}
      <section className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-sage-900">Chief complaints</h2>
          <button type="button" className="btn btn-secondary text-xs py-2 min-h-10" onClick={() => setComplaints((c) => [...c, emptyComplaint()])}>
            <Plus size={16} /> Add
          </button>
        </div>
        {complaints.map((c, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-sage-50/80 border border-sage-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-sage-700">Complaint {idx + 1}</span>
              {complaints.length > 1 && (
                <button type="button" className="text-red-600 p-1" onClick={() => setComplaints((list) => list.filter((_, i) => i !== idx))}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <input className="input" placeholder="Description *" value={c.description} onChange={(e) => updateComplaint(idx, 'description', e.target.value)} required={idx === 0} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="input" placeholder="Location" value={c.location} onChange={(e) => updateComplaint(idx, 'location', e.target.value)} />
              <input className="input" placeholder="Sensation" value={c.sensation} onChange={(e) => updateComplaint(idx, 'sensation', e.target.value)} />
              <input className="input" placeholder="Duration / Onset" value={c.duration} onChange={(e) => updateComplaint(idx, 'duration', e.target.value)} />
              <input className="input" placeholder="Concomitants" value={c.concomitants} onChange={(e) => updateComplaint(idx, 'concomitants', e.target.value)} />
            </div>
            <div>
              <p className="label">Aggravates (worse from)</p>
              <ChipSelect options={MODALITIES} value={c.modalityAgg} onChange={(v) => updateComplaint(idx, 'modalityAgg', v)} multi />
            </div>
            <div>
              <p className="label">Ameliorates (better from)</p>
              <ChipSelect options={MODALITIES} value={c.modalityAmel} onChange={(v) => updateComplaint(idx, 'modalityAmel', v)} multi />
            </div>
          </div>
        ))}
      </section>

      {/* Physical generals */}
      <section className="card-surface p-5 space-y-4">
        <h2 className="font-display text-lg text-sage-900">Physical generals</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {['appetite', 'thirst', 'sleep', 'dreams', 'stool', 'urine', 'perspiration'].map((k) => (
            <div key={k}>
              <label className="label capitalize">{k}</label>
              <input className="input" value={physical[k]} onChange={(e) => setPhysical((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div>
          <p className="label">Thermal reaction</p>
          <ChipSelect options={THERMAL} value={physical.thermal} onChange={(v) => setPhysical((p) => ({ ...p, thermal: v }))} />
        </div>
        <div>
          <p className="label">Cravings</p>
          <ChipSelect options={CRAVINGS} value={physical.cravings} onChange={(v) => setPhysical((p) => ({ ...p, cravings: v }))} multi />
        </div>
        <div>
          <p className="label">Aversions</p>
          <ChipSelect options={CRAVINGS} value={physical.aversions} onChange={(v) => setPhysical((p) => ({ ...p, aversions: v }))} multi />
        </div>
        {patient?.gender === 'Female' && (
          <div>
            <label className="label">Menstrual history</label>
            <textarea className="input min-h-20" value={physical.menstrual} onChange={(e) => setPhysical((p) => ({ ...p, menstrual: e.target.value }))} />
          </div>
        )}
      </section>

      {/* Mental generals */}
      <section className="card-surface p-5 space-y-4">
        <h2 className="font-display text-lg text-sage-900">Mental generals</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Temperament</label>
            <input className="input" value={mental.temperament} onChange={(e) => setMental((m) => ({ ...m, temperament: e.target.value }))} />
          </div>
          <div>
            <label className="label">Anger</label>
            <input className="input" value={mental.anger} onChange={(e) => setMental((m) => ({ ...m, anger: e.target.value }))} placeholder="Suppressed / Explosive…" />
          </div>
          <div>
            <label className="label">Reaction to consolation</label>
            <input className="input" value={mental.consolation} onChange={(e) => setMental((m) => ({ ...m, consolation: e.target.value }))} />
          </div>
          <div>
            <label className="label">Memory</label>
            <input className="input" value={mental.memory} onChange={(e) => setMental((m) => ({ ...m, memory: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Mood patterns</label>
            <input className="input" value={mental.mood} onChange={(e) => setMental((m) => ({ ...m, mood: e.target.value }))} />
          </div>
        </div>
        <div>
          <p className="label">Fears</p>
          <ChipSelect options={FEARS} value={mental.fears} onChange={(v) => setMental((m) => ({ ...m, fears: v }))} multi />
        </div>
      </section>

      {/* Past history & exam */}
      <section className="card-surface p-5 space-y-4">
        <h2 className="font-display text-lg text-sage-900">Past & family history</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Previous illnesses (comma-separated)</label>
            <input className="input" value={past.illnesses} onChange={(e) => setPast((p) => ({ ...p, illnesses: e.target.value }))} />
          </div>
          <div>
            <label className="label">Surgeries</label>
            <input className="input" value={past.surgeries} onChange={(e) => setPast((p) => ({ ...p, surgeries: e.target.value }))} />
          </div>
          <div>
            <label className="label">Allergies</label>
            <input className="input" value={past.allergies} onChange={(e) => setPast((p) => ({ ...p, allergies: e.target.value }))} />
          </div>
          <div>
            <label className="label">Family history (DM, TB, Ca, Asthma…)</label>
            <input className="input" value={past.familyHistory} onChange={(e) => setPast((p) => ({ ...p, familyHistory: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className="card-surface p-5 space-y-4">
        <h2 className="font-display text-lg text-sage-900">Physical examination</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">BP</label>
            <input className="input" placeholder="120/80" value={exam.bp} onChange={(e) => setExam((x) => ({ ...x, bp: e.target.value }))} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" value={exam.weight} onChange={(e) => setExam((x) => ({ ...x, weight: e.target.value }))} />
          </div>
          <div>
            <label className="label">Pulse</label>
            <input className="input" value={exam.pulse} onChange={(e) => setExam((x) => ({ ...x, pulse: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className="card-surface p-5 space-y-4">
        <h2 className="font-display text-lg text-sage-900">Assessment</h2>
        <div>
          <label className="label">Provisional diagnosis</label>
          <input className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </div>
        <div>
          <p className="label">Miasm</p>
          <ChipSelect options={MIASMS} value={miasm} onChange={setMiasm} />
        </div>
        <div>
          <label className="label">Doctor&apos;s observation</label>
          <textarea className="input min-h-28" value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Appearance, manner, notable observations…" />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 sticky bottom-4 bg-cream/90 backdrop-blur p-3 rounded-2xl border border-sage-100 shadow-lg">
        <button type="submit" className="btn btn-primary flex-1" disabled={mut.isPending}>
          {mut.isPending ? 'Saving…' : 'Save & lock case'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
      </div>
      <p className="text-xs text-muted text-center pb-4">Saved cases are locked. Further edits create a new version (audit trail).</p>
    </form>
  );
}
