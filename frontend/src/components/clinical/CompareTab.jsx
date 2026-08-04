import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GitCompareArrows } from 'lucide-react';
import api from '../../lib/api';
import { PageLoader } from '../ui';

export default function CompareTab() {
  const [selected, setSelected] = useState([]);

  const { data: allRemedies = [] } = useQuery({
    queryKey: ['clinical-mm-all'],
    queryFn: async () => (await api.get('/clinical/materia-medica/list/all')).data.remedies,
  });

  const compareMut = useMutation({
    mutationFn: (slugs) => api.post('/clinical/materia-medica/compare', { slugs }),
  });

  const toggle = (slug) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  };

  const remedies = compareMut.data?.data?.remedies || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sage-700">
        <GitCompareArrows size={18} />
        <p className="text-sm">Select 2–3 remedies for side-by-side differential diagnosis</p>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {selected.map((slug) => {
            const r = allRemedies.find((m) => m.slug === slug);
            return (
              <span key={slug} className="px-3 py-1.5 rounded-lg bg-sage-600 text-white text-sm">
                {r?.name || slug}
              </span>
            );
          })}
          <button
            type="button"
            className="btn btn-primary text-sm py-2"
            disabled={selected.length < 2 || compareMut.isPending}
            onClick={() => compareMut.mutate(selected)}
          >
            {compareMut.isPending ? 'Comparing...' : 'Compare'}
          </button>
          <button type="button" className="text-sm text-muted hover:underline" onClick={() => { setSelected([]); compareMut.reset(); }}>
            Clear
          </button>
        </div>
      )}

      {remedies.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-sage-200">
                <th className="text-left p-3 text-muted font-medium w-28">Aspect</th>
                {remedies.map((r) => (
                  <th key={r.slug} className="text-left p-3 font-medium text-sage-900">{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Common name', (r) => r.commonName],
                ['Keynotes', (r) => r.keynotes?.join(', ')],
                ['Mental', (r) => r.mental],
                ['Physical', (r) => r.physical],
                ['Worse', (r) => r.modalities?.worse?.join(', ')],
                ['Better', (r) => r.modalities?.better?.join(', ')],
              ].map(([label, fn]) => (
                <tr key={label} className="border-b border-sage-100 align-top">
                  <td className="p-3 text-muted font-medium">{label}</td>
                  {remedies.map((r) => (
                    <td key={r.slug} className="p-3 text-sage-800">{fn(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!allRemedies.length ? <PageLoader /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {allRemedies.map((m) => {
            const isOn = selected.includes(m.slug);
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => toggle(m.slug)}
                className={`p-3 rounded-xl text-left text-sm border transition-colors ${isOn ? 'border-sage-600 bg-sage-50' : 'border-sage-100 hover:border-sage-300'}`}
              >
                <p className="font-medium text-sage-900">{m.name}</p>
                <p className="text-xs text-muted line-clamp-1">{m.keynotes?.join(' · ')}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
