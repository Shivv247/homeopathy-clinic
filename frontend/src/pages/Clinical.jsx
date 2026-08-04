import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BookOpen, Brain, FlaskConical, Library, Search, Plus, X,
  ChevronRight, Sparkles, BarChart3, Zap, GitCompareArrows, Save,
} from 'lucide-react';
import api from '../lib/api';
import { PageLoader, EmptyState } from '../components/ui';
import AcuteKitsTab from '../components/clinical/AcuteKitsTab';
import CompareTab from '../components/clinical/CompareTab';
import PatientSearch from '../components/PatientSearch';

const TABS = [
  { id: 'acute', label: 'Acute Kits', icon: Zap },
  { id: 'repertory', label: 'Repertory', icon: Search },
  { id: 'analyze', label: 'Repertorize', icon: BarChart3 },
  { id: 'compare', label: 'Compare', icon: GitCompareArrows },
  { id: 'mm', label: 'Materia Medica', icon: FlaskConical },
  { id: 'books', label: 'Library', icon: Library },
];

function StatsBar() {
  const { data: stats } = useQuery({
    queryKey: ['clinical-stats'],
    queryFn: async () => (await api.get('/clinical/stats')).data.stats,
  });
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Rubrics', value: stats.rubrics },
        { label: 'MM Profiles', value: stats.materiaMedicaEntries },
        { label: 'Acute Kits', value: stats.acuteKits },
        { label: 'Remedies', value: stats.remediesInRepertory },
      ].map(({ label, value }) => (
        <div key={label} className="card-surface p-3 text-center">
          <p className="text-xl font-semibold text-sage-800">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

function gradeBadge(grade) {
  if (grade >= 4) return 'bg-sage-700 text-white';
  if (grade >= 3) return 'bg-sage-500 text-white';
  return 'bg-sage-200 text-sage-800';
}

function formatRemedyGrades(remedies, max = 5) {
  return remedies.slice(0, max).map((rem) => ({
    short: rem.name.split(' ')[0],
    grade: rem.grade,
  }));
}

function RepertoryTab({ selected, onToggle }) {
  const [q, setQ] = useState('');
  const [chapter, setChapter] = useState('');

  const { data: chapters = [] } = useQuery({
    queryKey: ['clinical-chapters'],
    queryFn: async () => (await api.get('/clinical/repertory/chapters')).data.chapters,
  });

  const { data: rubrics = [], isLoading } = useQuery({
    queryKey: ['clinical-rubrics', q, chapter],
    queryFn: async () => (await api.get('/clinical/repertory/rubrics', { params: { q, chapter, limit: 40 } })).data.rubrics,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder="Search rubrics — e.g. anxiety, headache, grief..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input sm:w-48" value={chapter} onChange={(e) => setChapter(e.target.value)}>
          <option value="">All chapters</option>
          {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="card-surface p-3">
          <p className="text-sm font-medium text-sage-800 mb-2">Selected rubrics ({selected.length})</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((r) => (
              <button
                key={r.id}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-600 text-white text-xs"
                onClick={() => onToggle(r)}
              >
                {r.rubric}
                <X size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? <PageLoader /> : rubrics.length === 0 ? (
        <EmptyState title="No rubrics found" description="Try a different search term or chapter." />
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {rubrics.map((r) => {
            const isSelected = selected.some((s) => s.id === r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onToggle(r)}
                className={`w-full text-left card-surface p-3 flex items-start gap-3 transition-colors ${isSelected ? 'border-sage-500 bg-sage-50' : 'hover:border-sage-300'}`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-sage-600 border-sage-600 text-white' : 'border-sage-300'}`}>
                  {isSelected && <Plus size={12} className="rotate-45" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-sage-600 font-medium">{r.chapter}</span>
                  <p className="text-sm font-medium text-sage-900">{r.rubric}</p>
                  <p className="text-xs text-muted mt-1 flex flex-wrap gap-1.5 items-center">
                    {formatRemedyGrades(r.remedies, 5).map((rem) => (
                      <span key={rem.short} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${gradeBadge(rem.grade)}`}>
                        {rem.short} <span className="opacity-90">{rem.grade}</span>
                      </span>
                    ))}
                    {r.remedies.length > 5 && <span className="text-muted">+{r.remedies.length - 5}</span>}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnalyzeTab({ selected, onClear, initialSymptoms = '' }) {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [suggested, setSuggested] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialSymptoms) setSymptoms(initialSymptoms);
  }, [initialSymptoms]);

  const analyzeMut = useMutation({
    mutationFn: (rubricIds) => api.post('/clinical/repertory/analyze', { rubricIds }),
  });

  const symptomMut = useMutation({
    mutationFn: (text) => api.post('/clinical/repertory/from-symptoms', { symptoms: text }),
    onSuccess: ({ data }) => setSuggested(data.rubrics),
  });

  const saveMut = useMutation({
    mutationFn: (body) => api.post('/clinical/sessions', body),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const runAnalysis = () => {
    if (!selected.length) return;
    analyzeMut.mutate(selected.map((r) => r.id));
  };

  const analysis = analyzeMut.data?.data?.analysis;

  const saveSession = () => {
    if (!analysis) return;
    saveMut.mutate({
      patientId: patientId || null,
      title: sessionTitle || `Repertorization — ${new Date().toLocaleDateString('en-IN')}`,
      rubricIds: selected.map((r) => r.id),
      topRemedies: analysis.remedies.slice(0, 10),
    });
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-4 bg-gradient-to-br from-sage-50 to-cream">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-sage-600" />
          <h3 className="font-medium text-sage-900">AI-assisted symptom matching</h3>
        </div>
        <p className="text-sm text-muted mb-3">Paste case symptoms to find matching rubrics automatically.</p>
        <textarea
          className="input min-h-20"
          placeholder="e.g. anxiety about health, restlessness, burning pains better from heat, thirst for small sips..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary mt-2"
          disabled={symptoms.length < 3 || symptomMut.isPending}
          onClick={() => symptomMut.mutate(symptoms)}
        >
          {symptomMut.isPending ? 'Matching...' : 'Find matching rubrics'}
        </button>
        {suggested.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted">Suggested rubrics — add them from Repertory tab</p>
            {suggested.slice(0, 6).map((r) => (
              <p key={r.id} className="text-sm text-sage-800">• [{r.chapter}] {r.rubric}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{selected.length} rubric(s) selected for analysis</p>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button type="button" className="btn btn-secondary text-sm" onClick={onClear}>Clear</button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selected.length || analyzeMut.isPending}
            onClick={runAnalysis}
          >
            {analyzeMut.isPending ? 'Analyzing...' : 'Run repertorization'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="space-y-3">
          <div className="card-surface p-4 space-y-3 bg-sage-50/50">
            <p className="text-sm font-medium text-sage-800">Save to patient record</p>
            <input className="input" placeholder="Session title (optional)" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} />
            <PatientSearch
              onSelect={(p) => { setPatientId(p.id); setPatientName(p.fullName); }}
              placeholder="Link to patient (optional)..."
            />
            {patientName && <p className="text-sm text-sage-700">Linked: <strong>{patientName}</strong></p>}
            <button type="button" className="btn btn-secondary text-sm" onClick={saveSession} disabled={saveMut.isPending}>
              <Save size={16} /> {saveMut.isPending ? 'Saving...' : saved ? 'Saved ✓' : 'Save repertorization'}
            </button>
          </div>

          <h3 className="font-display text-lg text-sage-900">Top remedies</h3>
          {analysis.remedies.length === 0 ? (
            <EmptyState title="No matches" description="Select more rubrics for better results." />
          ) : (
            analysis.remedies.map((rem, idx) => (
              <div key={rem.name} className="card-surface p-4 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${idx < 3 ? 'bg-sage-600 text-white' : 'bg-sage-100 text-sage-700'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-sage-900">{rem.name}</p>
                      <p className="text-xs text-muted">Score {rem.totalScore} · in {rem.rubricCount} rubric(s)</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {rem.slug && (
                        <Link to={`/clinical?tab=mm&remedy=${rem.slug}`} className="text-xs text-sage-600 hover:underline">
                          View MM
                        </Link>
                      )}
                      {patientId && (
                        <Link
                          to={`/patients/${patientId}/prescribe?remedy=${encodeURIComponent(rem.name)}`}
                          className="text-xs text-sage-700 font-medium hover:underline"
                        >
                          Prescribe →
                        </Link>
                      )}
                    </div>
                  </div>
                  {rem.keynotes?.length > 0 && (
                    <p className="text-sm text-muted mt-1">{rem.keynotes.join(' · ')}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MateriaMedicaTab({ initialSlug }) {
  const [q, setQ] = useState('');
  const [viewSlug, setViewSlug] = useState(initialSlug || '');

  const { data: remedies = [] } = useQuery({
    queryKey: ['clinical-mm', q],
    queryFn: async () => (await api.get('/clinical/materia-medica', { params: { q, limit: 30 } })).data.remedies,
  });

  const { data: remedy, isLoading } = useQuery({
    queryKey: ['clinical-mm-detail', viewSlug],
    queryFn: async () => (await api.get(`/clinical/materia-medica/${viewSlug}`)).data.remedy,
    enabled: !!viewSlug,
  });

  if (viewSlug && remedy) {
    return (
      <div className="space-y-4">
        <button type="button" className="text-sm text-sage-600 hover:underline" onClick={() => setViewSlug('')}>
          ← Back to list
        </button>
        <div className="card-surface p-5">
          <p className="text-xs text-sage-600">{remedy.sources?.join(' · ')}</p>
          <h2 className="font-display text-2xl text-sage-900">{remedy.name}</h2>
          <p className="text-muted text-sm">{remedy.commonName}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {remedy.keynotes.map((k) => (
              <span key={k} className="text-xs px-2.5 py-1 rounded-lg bg-sage-100 text-sage-800">{k}</span>
            ))}
          </div>
        </div>
        {[
          ['Mental picture', remedy.mental],
          ['Physical picture', remedy.physical],
        ].map(([title, text]) => (
          <div key={title} className="card-surface p-4">
            <h3 className="font-medium text-sage-900 mb-2">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{text}</p>
          </div>
        ))}
        {remedy.modalities && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card-surface p-4">
              <h3 className="font-medium text-red-700 mb-2">Worse from</h3>
              <ul className="text-sm text-muted space-y-1">
                {remedy.modalities.worse.map((w) => <li key={w}>• {w}</li>)}
              </ul>
            </div>
            <div className="card-surface p-4">
              <h3 className="font-medium text-sage-700 mb-2">Better from</h3>
              <ul className="text-sm text-muted space-y-1">
                {remedy.modalities.better.map((b) => <li key={b}>• {b}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewSlug && isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-10"
          placeholder="Search remedies — e.g. Natrum Mur, Sepia, Arsenicum..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {remedies.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => setViewSlug(m.slug)}
            className="card-surface p-4 text-left hover:border-sage-300 transition-colors"
          >
            <p className="font-medium text-sage-900">{m.name}</p>
            <p className="text-xs text-muted">{m.commonName}</p>
            <p className="text-sm text-muted mt-2 line-clamp-2">{m.keynotes.slice(0, 2).join(' · ')}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BooksTab() {
  const [viewSlug, setViewSlug] = useState('');
  const [chapterId, setChapterId] = useState('');

  const { data: books = [] } = useQuery({
    queryKey: ['clinical-books'],
    queryFn: async () => (await api.get('/clinical/books')).data.books,
  });

  const { data: book, isLoading } = useQuery({
    queryKey: ['clinical-book', viewSlug],
    queryFn: async () => (await api.get(`/clinical/books/${viewSlug}`)).data.book,
    enabled: !!viewSlug,
  });

  if (viewSlug && book) {
    const chapter = book.chapters.find((c) => c.id === chapterId) || book.chapters[0];
    return (
      <div className="space-y-4">
        <button type="button" className="text-sm text-sage-600 hover:underline" onClick={() => { setViewSlug(''); setChapterId(''); }}>
          ← Back to library
        </button>
        <div className="card-surface p-5">
          <p className="text-xs text-sage-600">{book.category} · {book.author} ({book.year})</p>
          <h2 className="font-display text-xl text-sage-900">{book.title}</h2>
          <p className="text-sm text-muted mt-1">{book.description}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {book.chapters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChapterId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${chapter?.id === c.id ? 'bg-sage-600 text-white' : 'hover:bg-sage-100 text-sage-800'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
          <div className="md:col-span-2 card-surface p-5">
            <h3 className="font-medium text-sage-900 mb-3">{chapter?.title}</h3>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{chapter?.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewSlug && isLoading) return <PageLoader />;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {books.map((b) => (
        <button
          key={b.slug}
          type="button"
          onClick={() => setViewSlug(b.slug)}
          className="card-surface p-5 text-left hover:border-sage-300 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-sage-600" />
            </div>
            <div>
              <p className="text-xs text-sage-600">{b.category}</p>
              <p className="font-medium text-sage-900 group-hover:text-sage-700">{b.title}</p>
              <p className="text-xs text-muted mt-1">{b.author} · {b.year} · {b.chapterCount} chapters</p>
              <p className="text-sm text-muted mt-2 line-clamp-2">{b.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function Clinical() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'repertory';
  const remedySlug = searchParams.get('remedy') || '';
  const symptomsParam = searchParams.get('symptoms') || '';
  const [selectedRubrics, setSelectedRubrics] = useState([]);

  const setTab = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', id);
    if (id !== 'mm') params.delete('remedy');
    setSearchParams(params);
  };

  const toggleRubric = (r) => {
    setSelectedRubrics((prev) =>
      prev.some((s) => s.id === r.id) ? prev.filter((s) => s.id !== r.id) : [...prev, r]
    );
  };

  const loadKitRubrics = (rubrics) => {
    setSelectedRubrics(rubrics);
    setTab('analyze');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sage-600 text-sm mb-1">
          <Brain size={16} />
          <span>Clinical Suite</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl text-sage-900">Repertory & Materia Medica</h1>
        <p className="text-muted mt-1 text-sm">
          Prescribe smarter — repertorize cases, study remedies, and reference classic texts in one place.
        </p>
      </div>

      <StatsBar />

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-sage-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl whitespace-nowrap transition-colors ${
              tab === id ? 'bg-white text-sage-800 border border-b-0 border-sage-200' : 'text-muted hover:text-sage-700'
            }`}
          >
            <Icon size={16} />
            {label}
            {id === 'analyze' && selectedRubrics.length > 0 && (
              <span className="bg-sage-600 text-white text-xs px-1.5 py-0.5 rounded-full">{selectedRubrics.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card-surface p-4 md:p-5">
        {tab === 'acute' && <AcuteKitsTab onLoadKit={loadKitRubrics} />}
        {tab === 'repertory' && <RepertoryTab selected={selectedRubrics} onToggle={toggleRubric} />}
        {tab === 'analyze' && (
          <AnalyzeTab
            selected={selectedRubrics}
            onClear={() => setSelectedRubrics([])}
            initialSymptoms={symptomsParam}
          />
        )}
        {tab === 'compare' && <CompareTab />}
        {tab === 'mm' && <MateriaMedicaTab initialSlug={remedySlug} />}
        {tab === 'books' && <BooksTab />}
      </div>

      {selectedRubrics.length > 0 && tab === 'repertory' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-80 z-20">
          <button
            type="button"
            className="btn btn-primary w-full shadow-lg"
            onClick={() => setTab('analyze')}
          >
            Repertorize {selectedRubrics.length} rubric(s) <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
