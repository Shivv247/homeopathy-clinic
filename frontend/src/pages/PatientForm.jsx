import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

const empty = {
  fullName: '', phone: '', dateOfBirth: '', ageYears: '', gender: '',
  address: '', city: '',
};

export default function PatientForm() {
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const mut = useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post('/patients', body);
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        await api.post(`/patients/${data.patient.id}/photo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return data;
    },
    onSuccess: (data) => navigate(`/patients/${data.patient.id}`),
    onError: (err) => setError(err.response?.data?.message || 'Failed to save'),
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    mut.mutate({
      ...form,
      ageYears: form.ageYears ? Number(form.ageYears) : null,
      dateOfBirth: form.dateOfBirth || null,
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl text-sage-900">Register patient</h1>
        <p className="text-muted text-sm mt-1">Patient ID will be auto-generated</p>
      </div>

      <form onSubmit={submit} className="card-surface p-5 md:p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Full name *</label>
            <input className="input" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </div>
          <div>
            <label className="label">Age (years)</label>
            <input className="input" type="number" value={form.ageYears} onChange={(e) => set('ageYears', e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <textarea className="input min-h-20" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Photo (optional)</label>
            <input className="input" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save patient'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
