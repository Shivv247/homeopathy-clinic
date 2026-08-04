import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { PageLoader, TagBadge, EmptyState } from '../components/ui';
import { useAuth } from '../store/auth';
import { useDebouncedValue } from '../lib/useDebouncedValue';

const PAGE_SIZE = 20;

export default function Patients() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const canManage = useAuth((s) => s.canManageOps());

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['patients', debouncedQ, tag, page],
    queryFn: async () => (await api.get('/patients', {
      params: { q: debouncedQ || undefined, tag: tag || undefined, page, limit: PAGE_SIZE },
    })).data,
    staleTime: 30_000,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-sage-900">Patients</h1>
          <p className="text-muted text-sm mt-1">Search by name, phone, or UHID</p>
        </div>
        {canManage && (
          <Link to="/patients/new" className="btn btn-primary">
            <Plus size={18} /> Register patient
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
          <input
            className="input-with-icon w-full"
            placeholder="Search name, phone, or ID"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-full sm:w-44 shrink-0" value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }}>
          <option value="">All tags</option>
          <option value="NEW">New</option>
          <option value="FOLLOW_UP">Follow-up</option>
          <option value="VIP">VIP</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {!isLoading && total > 0 && (
        <p className="text-sm text-muted">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} patients
          {isFetching && <span className="text-sage-600"> · updating…</span>}
        </p>
      )}

      {isLoading ? <PageLoader /> : !data?.patients?.length ? (
        <EmptyState title="No patients found" description="Try a different search or register a new patient." />
      ) : (
        <div className="space-y-2">
          {data.patients.map((p) => (
            <Link key={p.id} to={`/patients/${p.id}`} className="card-surface p-4 flex items-center gap-4 hover:border-sage-300 transition-colors block">
              <div className="w-12 h-12 rounded-full bg-sage-100 text-sage-800 flex items-center justify-center font-semibold shrink-0">
                {p.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sage-900">{p.fullName}</span>
                  <TagBadge tag={p.tag} />
                </div>
                <p className="text-sm text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{p.uhid}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Phone size={12} /> {p.phone}</span>
                  {p.ageYears != null && <><span>·</span><span>{p.ageYears}y / {p.gender || '—'}</span></>}
                  {p.family && <><span>·</span><span className="text-sage-600">{p.family.familyId}</span></>}
                </p>
              </div>
              <span className="text-xs text-muted hidden sm:block">{p._count?.caseRecords || 0} visits</span>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            className="btn btn-secondary py-2 min-h-10"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn btn-secondary py-2 min-h-10"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
