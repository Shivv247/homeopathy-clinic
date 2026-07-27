import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../lib/api';
import { PageLoader, TagBadge } from '../components/ui';
import { useAuth } from '../store/auth';

function parse(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return v; }
}

export default function CaseView() {
  const { id } = useParams();
  const canClinical = useAuth((s) => s.canEditClinical());

  const { data: caseRecord, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => (await api.get(`/cases/${id}`)).data.case,
  });

  if (isLoading) return <PageLoader />;
  if (!caseRecord) return <p>Case not found</p>;

  const complaints = parse(caseRecord.chiefComplaints) || [];
  const physical = parse(caseRecord.physicalGenerals) || {};
  const mental = parse(caseRecord.mentalGenerals) || {};
  const past = parse(caseRecord.pastHistory) || {};
  const exam = parse(caseRecord.physicalExam) || {};

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            <Link to={`/patients/${caseRecord.patientId}`} className="hover:underline">{caseRecord.patient?.fullName}</Link>
            {' · '}v{caseRecord.version} · {format(new Date(caseRecord.visitDate), 'd MMM yyyy')}
          </p>
          <h1 className="font-display text-2xl text-sage-900 mt-1">
            {caseRecord.provisionalDiagnosis || 'Case record'}
          </h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            <TagBadge tag={caseRecord.visitType} />
            {caseRecord.miasm && <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sage-100 text-sage-800">{caseRecord.miasm}</span>}
            {caseRecord.isLocked && <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600">Locked</span>}
          </div>
        </div>
        {canClinical && (
          <Link to={`/patients/${caseRecord.patientId}/prescribe?case=${caseRecord.id}`} className="btn btn-primary">
            Write prescription
          </Link>
        )}
      </div>

      {caseRecord.improvementStatus && (
        <div className="card-surface p-4 border-l-4 border-sage-500">
          <p className="font-medium">{caseRecord.improvementStatus}
            {caseRecord.improvementPercent != null ? ` — ${caseRecord.improvementPercent}%` : ''}
          </p>
        </div>
      )}

      <Section title="Chief complaints">
        {Array.isArray(complaints) && complaints.length ? complaints.map((c, i) => (
          <div key={i} className="mb-3 last:mb-0 p-3 rounded-xl bg-sage-50">
            <p className="font-medium text-sage-900">{c.description}</p>
            <p className="text-sm text-muted mt-1">
              {[c.location, c.sensation, c.duration].filter(Boolean).join(' · ')}
            </p>
            {(c.modalityAgg?.length > 0 || c.modalityAmel?.length > 0) && (
              <p className="text-xs mt-2 text-sage-700">
                {c.modalityAgg?.length ? `↑ ${c.modalityAgg.join(', ')}` : ''}
                {c.modalityAgg?.length && c.modalityAmel?.length ? ' · ' : ''}
                {c.modalityAmel?.length ? `↓ ${c.modalityAmel.join(', ')}` : ''}
              </p>
            )}
          </div>
        )) : <p className="text-muted text-sm">—</p>}
      </Section>

      <Section title="Physical generals">
        <KV data={{
          Appetite: physical.appetite, Thirst: physical.thirst, Sleep: physical.sleep,
          Thermal: physical.thermal,
          Cravings: physical.cravings?.join?.(', '), Aversions: physical.aversions?.join?.(', '),
        }} />
      </Section>

      <Section title="Mental generals">
        <KV data={{
          Temperament: mental.temperament, Fears: mental.fears?.join?.(', '),
          Consolation: mental.consolation, Mood: mental.mood,
        }} />
      </Section>

      <Section title="Past history">
        <KV data={{
          Illnesses: Array.isArray(past.illnesses) ? past.illnesses.join(', ') : past.illnesses,
          Allergies: Array.isArray(past.allergies) ? past.allergies.join(', ') : past.allergies,
          'Family Hx': Array.isArray(past.familyHistory) ? past.familyHistory.join(', ') : past.familyHistory,
        }} />
      </Section>

      <Section title="Examination">
        <KV data={{ BP: exam.bp, Weight: exam.weight, Pulse: exam.pulse }} />
      </Section>

      {caseRecord.doctorObservation && (
        <Section title="Doctor's observation">
          <p className="text-sm text-sage-800 whitespace-pre-wrap">{caseRecord.doctorObservation}</p>
        </Section>
      )}

      <p className="text-xs text-muted">Recorded by {caseRecord.author?.name} · {format(new Date(caseRecord.createdAt), 'd MMM yyyy HH:mm')}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="card-surface p-5">
      <h2 className="font-display text-lg text-sage-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function KV({ data }) {
  const entries = Object.entries(data).filter(([, v]) => v);
  if (!entries.length) return <p className="text-muted text-sm">—</p>;
  return (
    <dl className="grid sm:grid-cols-2 gap-2 text-sm">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-muted text-xs">{k}</dt>
          <dd className="text-sage-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
