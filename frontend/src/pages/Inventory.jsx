import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus } from 'lucide-react';
import api from '../lib/api';
import { PageLoader } from '../components/ui';

export default function Inventory() {
  const [lowOnly, setLowOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', lowOnly],
    queryFn: async () => (await api.get('/inventory', { params: lowOnly ? { lowStock: 'true' } : {} })).data.items,
  });

  const restockMut = useMutation({
    mutationFn: ({ id, quantity }) => api.post(`/inventory/${id}/restock`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-sage-900">Medicine inventory</h1>
          <p className="text-muted text-sm mt-1">Mother tinctures, dilutions, biochemics</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`chip ${lowOnly ? 'chip-active' : 'chip-idle'}`} onClick={() => setLowOnly(!lowOnly)}>
            <AlertTriangle size={14} /> Low stock
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add item</button>
        </div>
      </div>

      {showAdd && <AddItem onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['inventory'] }); }} />}

      {isLoading ? <PageLoader /> : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sage-50 text-left text-sage-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Medicine</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Potency</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-sage-100">
                    <td className="px-4 py-3 font-medium text-sage-900">{item.name}</td>
                    <td className="px-4 py-3 text-muted">{item.category}</td>
                    <td className="px-4 py-3">{item.potency || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={item.quantity <= item.reorderLevel ? 'text-amber-700 font-semibold' : ''}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-sage-700 font-medium hover:underline"
                        onClick={() => {
                          const q = prompt('Restock quantity?', '10');
                          if (q) restockMut.mutate({ id: item.id, quantity: Number(q) });
                        }}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && <p className="p-8 text-center text-muted">No inventory items</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function AddItem({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', category: 'DILUTION', potency: '30C', quantity: 20, reorderLevel: 5 });
  const mut = useMutation({
    mutationFn: (body) => api.post('/inventory', body),
    onSuccess: onSaved,
  });

  return (
    <div className="card-surface p-5 space-y-3">
      <h2 className="font-medium">Add stock item</h2>
      <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="DILUTION">Dilution</option>
          <option value="MOTHER_TINCTURE">Mother tincture</option>
          <option value="BIOCHEMIC">Biochemic</option>
          <option value="GLOBULES">Globules</option>
          <option value="OTHER">Other</option>
        </select>
        <input className="input" placeholder="Potency" value={form.potency} onChange={(e) => setForm({ ...form, potency: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" disabled={!form.name || mut.isPending} onClick={() => mut.mutate(form)}>Save</button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
