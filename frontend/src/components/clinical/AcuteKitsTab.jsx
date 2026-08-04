import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Zap, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { PageLoader } from '../ui';

export default function AcuteKitsTab({ onLoadKit }) {
  const [viewId, setViewId] = useState('');

  const { data: kits = [], isLoading } = useQuery({
    queryKey: ['acute-kits'],
    queryFn: async () => (await api.get('/clinical/acute-kits')).data.kits,
  });

  const { data: kitDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['acute-kit', viewId],
    queryFn: async () => (await api.get(`/clinical/acute-kits/${viewId}`)).data.kit,
    enabled: !!viewId,
  });

  const analyzeMut = useMutation({
    mutationFn: (rubricIds) => api.post('/clinical/repertory/analyze', { rubricIds }),
  });

  if (isLoading) return <PageLoader />;

  if (viewId && kitDetail) {
    const analysis = analyzeMut.data?.data?.analysis;
    return (
      <div className="space-y-4">
        <button type="button" className="text-sm text-sage-600 hover:underline" onClick={() => { setViewId(''); analyzeMut.reset(); }}>
          ← All acute kits
        </button>
        <div className="card-surface p-5 bg-gradient-to-br from-amber-50 to-cream">
          <span className="text-2xl">{kitDetail.icon}</span>
          <h2 className="font-display text-xl text-sage-900 mt-2">{kitDetail.title}</h2>
          <p className="text-sm text-muted">{kitDetail.description}</p>
        </div>

        <div className="card-surface p-4">
          <p className="text-sm font-medium text-sage-800 mb-2">Pre-selected rubrics ({kitDetail.rubrics?.length})</p>
          <ul className="space-y-1 text-sm text-muted max-h-40 overflow-y-auto">
            {kitDetail.rubrics?.map((r) => (
              <li key={r.id}>• [{r.chapter}] {r.rubric}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-primary"
            disabled={analyzeMut.isPending}
            onClick={() => analyzeMut.mutate(kitDetail.rubricIds)}
          >
            {analyzeMut.isPending ? 'Analyzing...' : 'Run repertorization'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onLoadKit(kitDetail.rubrics)}
          >
            Load rubrics to Repertory <ChevronRight size={16} />
          </button>
        </div>

        {analysis && (
          <div className="space-y-2">
            <h3 className="font-medium text-sage-900">Top remedies for {kitDetail.title}</h3>
            {analysis.remedies.slice(0, 5).map((rem, idx) => (
              <div key={rem.name} className="card-surface p-3 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-sage-600 text-white text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                <div>
                  <p className="font-medium text-sm text-sage-900">{rem.name}</p>
                  <p className="text-xs text-muted">Score {rem.totalScore} · {rem.keynotes?.slice(0, 2).join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted">Hint remedies: {kitDetail.hintRemedies?.join(', ')}</p>
      </div>
    );
  }

  if (viewId && detailLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sage-700">
        <Zap size={18} />
        <p className="text-sm">One-click acute prescribing — pre-built rubric sets for common OPD complaints</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kits.map((kit) => (
          <button
            key={kit.id}
            type="button"
            onClick={() => setViewId(kit.id)}
            className="card-surface p-4 text-left hover:border-sage-400 transition-colors"
          >
            <span className="text-2xl">{kit.icon}</span>
            <p className="font-medium text-sage-900 mt-2">{kit.title}</p>
            <p className="text-xs text-muted mt-1 line-clamp-2">{kit.description}</p>
            <p className="text-xs text-sage-600 mt-2">{kit.rubricIds.length} rubrics</p>
          </button>
        ))}
      </div>
    </div>
  );
}
