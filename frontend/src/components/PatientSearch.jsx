import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function PatientSearch({ autoFocus = false, className = '' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['patient-search', q],
    queryFn: async () => (await api.get('/patients', { params: { q, limit: 8 } })).data.patients,
    enabled: q.trim().length >= 2,
  });

  const results = data || [];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (id) => {
    setQ('');
    setOpen(false);
    navigate(`/patients/${id}`);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-500" size={20} />
        <input
          className="input pl-12 pr-4 py-3.5 text-base w-full"
          placeholder="Search by name, phone, or patient ID…"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 top-full mt-2 w-full card-surface shadow-lg max-h-80 overflow-y-auto">
          {isFetching ? (
            <p className="p-4 text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              No patients found.
              <button
                type="button"
                className="mt-2 flex items-center gap-2 text-sage-700 font-medium"
                onClick={() => { setOpen(false); navigate('/patients/new'); }}
              >
                <UserPlus size={16} /> Register new patient
              </button>
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-sage-50 border-b border-sage-100 last:border-0"
                onClick={() => pick(p.id)}
              >
                <p className="font-medium text-sage-900">{p.fullName}</p>
                <p className="text-sm text-muted">{p.uhid} · {p.phone} · {p.ageYears || '—'}y / {p.gender || '—'}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
