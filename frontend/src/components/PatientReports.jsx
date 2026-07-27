import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { format } from 'date-fns';
import { Camera, Upload, X, Columns2 } from 'lucide-react';
import api from '../lib/api';

function imageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return url;
}

export default function PatientReports({ patientId, reports = [] }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [tag, setTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [compare, setCompare] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [slider, setSlider] = useState(50);

  const uploadMut = useMutation({
    mutationFn: async (file) => {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1500,
        useWebWorker: true,
      });
      const form = new FormData();
      form.append('image', compressed, file.name);
      if (tag.trim()) form.append('tag', tag.trim());
      return api.post(`/patients/${patientId}/reports`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient', patientId] });
      setTag('');
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Upload failed'),
    onSettled: () => setUploading(false),
  });

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      await uploadMut.mutateAsync(file);
    }
  };

  const toggleCompare = (id) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareImages = compare.map((id) => reports.find((r) => r.id === id)).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="card-surface p-4 space-y-3">
        <h3 className="font-medium text-sage-900">Add report image</h3>
        <input
          className="input"
          placeholder="Tag (e.g. Skin — before treatment)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} /> Gallery
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera size={16} /> Camera
          </button>
          {compare.length === 2 && (
            <span className="text-sm text-sage-700 flex items-center gap-1 px-3">
              <Columns2 size={16} /> Before/After ready
            </span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {uploading && <p className="text-sm text-muted">Compressing & uploading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-muted">Images are compressed to ~300KB before upload.</p>
      </div>

      {compareImages.length === 2 && (
        <div className="card-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sage-900">Before / After comparison</h3>
            <button type="button" className="text-sm text-muted" onClick={() => setCompare([])}>Clear</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {compareImages.map((img) => (
              <div key={img.id}>
                <img src={imageUrl(img.fileUrl)} alt={img.tag || 'Report'} className="w-full rounded-xl object-cover aspect-[4/3]" />
                <p className="text-xs text-muted mt-1">{format(new Date(img.uploadedAt), 'd MMM yyyy')} — {img.tag || 'Report'}</p>
              </div>
            ))}
          </div>
          <div className="relative h-56 rounded-xl overflow-hidden border border-sage-200">
            <img src={imageUrl(compareImages[0].fileUrl)} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${slider}%` }}>
              <img src={imageUrl(compareImages[1].fileUrl)} alt="After" className="w-full h-full object-cover" style={{ width: `${100 / (slider / 100)}%`, maxWidth: 'none' }} />
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4/5 accent-sage-700"
            />
          </div>
        </div>
      )}

      {!reports.length ? (
        <div className="card-surface p-6 text-center text-muted text-sm">No report images yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => (
            <div key={r.id} className={`card-surface overflow-hidden ${compare.includes(r.id) ? 'ring-2 ring-sage-600' : ''}`}>
              <button type="button" className="block w-full" onClick={() => setLightbox(r)}>
                <img src={imageUrl(r.fileUrl)} alt={r.tag || 'Report'} className="w-full aspect-[4/3] object-cover" />
              </button>
              <div className="p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-sage-900">{r.tag || 'Report'}</p>
                  <p className="text-xs text-muted">{format(new Date(r.uploadedAt), 'd MMM yyyy')}</p>
                </div>
                <button
                  type="button"
                  className={`text-xs px-2 py-1 rounded-lg ${compare.includes(r.id) ? 'bg-sage-700 text-white' : 'bg-sage-100 text-sage-700'}`}
                  onClick={() => toggleCompare(r.id)}
                >
                  Compare
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)} aria-label="Close">
            <X size={28} />
          </button>
          <img src={imageUrl(lightbox.fileUrl)} alt={lightbox.tag || 'Report'} className="max-w-full max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
