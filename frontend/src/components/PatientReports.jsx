import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { format } from 'date-fns';
import { Camera, Upload, X, Columns2, Presentation, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { Skeleton } from './ui';

const TAG_PRESETS = [
  'Skin — Before treatment',
  'Skin — After treatment',
  'Lab report',
  'X-ray / Scan',
  'Old prescription',
];

function imageUrl(url) {
  if (!url) return '';
  return url;
}

function ReportImage({ src, alt, className = '', style }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`bg-sage-100 flex items-center justify-center text-sage-600 text-sm p-4 ${className}`} style={style}>
        Image unavailable
      </div>
    );
  }
  return (
    <img
      src={imageUrl(src)}
      alt={alt}
      loading="lazy"
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

export default function PatientReports({ patientId }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [tag, setTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [compare, setCompare] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [slider, setSlider] = useState(50);
  const [presentMode, setPresentMode] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['patient-reports', patientId],
    queryFn: async () => (await api.get(`/patients/${patientId}/reports`)).data.reports,
    staleTime: 60_000,
  });

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
      qc.invalidateQueries({ queryKey: ['patient-reports', patientId] });
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
  const currentPresent = reports[presentIndex];

  const openPresent = (startIndex = 0) => {
    setPresentIndex(startIndex);
    setPresentMode(true);
  };

  return (
    <div className="space-y-4">
      {reports.length > 0 && (
        <button
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          onClick={() => openPresent(0)}
        >
          <Presentation size={18} /> Show to patient (fullscreen)
        </button>
      )}

      <div className="card-surface p-4 space-y-3">
        <h3 className="font-medium text-sage-900">Add report image</h3>
        <input
          className="input"
          placeholder="Tag (e.g. Skin — before treatment)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {TAG_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`chip text-xs ${tag === preset ? 'chip-active' : 'chip-idle'}`}
              onClick={() => setTag(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
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
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {uploading && <p className="text-sm text-muted">Compressing & uploading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-muted">Take photo or upload lab reports, skin photos, X-rays. Auto-compressed to ~300KB.</p>
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
                <ReportImage src={img.fileUrl} alt={img.tag || 'Report'} className="w-full rounded-xl object-cover aspect-[4/3]" />
                <p className="text-xs text-muted mt-1">{format(new Date(img.uploadedAt), 'd MMM yyyy')} — {img.tag || 'Report'}</p>
              </div>
            ))}
          </div>
          <div className="relative h-56 rounded-xl overflow-hidden border border-sage-200">
            <ReportImage src={compareImages[0].fileUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${slider}%` }}>
              <ReportImage
                src={compareImages[1].fileUrl}
                alt="After"
                className="w-full h-full object-cover"
                style={{ width: `${100 / (slider / 100)}%`, maxWidth: 'none' }}
              />
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
        isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="card-surface p-6 text-center text-muted text-sm">
            No report images yet. Upload skin photos or lab reports to show progress to patients.
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r, idx) => (
            <div key={r.id} className={`card-surface overflow-hidden ${compare.includes(r.id) ? 'ring-2 ring-sage-600' : ''}`}>
              <button type="button" className="block w-full" onClick={() => setLightbox(r)}>
                <ReportImage src={r.fileUrl} alt={r.tag || 'Report'} className="w-full aspect-[4/3] object-cover" />
              </button>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sage-900 truncate">{r.tag || 'Report'}</p>
                  <p className="text-xs text-muted">{format(new Date(r.uploadedAt), 'd MMM yyyy')}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-lg bg-sage-100 text-sage-700"
                    onClick={() => openPresent(idx)}
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    className={`text-xs px-2 py-1 rounded-lg ${compare.includes(r.id) ? 'bg-sage-700 text-white' : 'bg-sage-100 text-sage-700'}`}
                    onClick={() => toggleCompare(r.id)}
                  >
                    Compare
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute top-4 right-4 text-white z-10" onClick={() => setLightbox(null)} aria-label="Close">
            <X size={28} />
          </button>
          <ReportImage
            src={lightbox.fileUrl}
            alt={lightbox.tag || 'Report'}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-white text-center mt-4 text-sm" onClick={(e) => e.stopPropagation()}>
            <span className="font-medium">{lightbox.tag || 'Report'}</span>
            <span className="text-white/70"> · {format(new Date(lightbox.uploadedAt), 'd MMMM yyyy')}</span>
          </p>
        </div>
      )}

      {presentMode && currentPresent && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
            <button type="button" className="p-2" onClick={() => setPresentMode(false)} aria-label="Close">
              <X size={24} />
            </button>
            <p className="text-sm font-medium text-center flex-1 px-2 truncate">
              {currentPresent.tag || 'Report'}
            </p>
            <span className="text-xs text-white/70 shrink-0">
              {presentIndex + 1} / {reports.length}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <button
              type="button"
              className="absolute left-2 p-3 rounded-full bg-white/10 text-white disabled:opacity-30"
              disabled={presentIndex === 0}
              onClick={() => setPresentIndex((i) => i - 1)}
              aria-label="Previous"
            >
              <ChevronLeft size={28} />
            </button>
            <ReportImage
              src={currentPresent.fileUrl}
              alt={currentPresent.tag || 'Report'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              type="button"
              className="absolute right-2 p-3 rounded-full bg-white/10 text-white disabled:opacity-30"
              disabled={presentIndex >= reports.length - 1}
              onClick={() => setPresentIndex((i) => i + 1)}
              aria-label="Next"
            >
              <ChevronRight size={28} />
            </button>
          </div>
          <p className="text-center text-white/80 text-sm pb-6 px-4">
            {format(new Date(currentPresent.uploadedAt), 'd MMMM yyyy')}
          </p>
        </div>
      )}
    </div>
  );
}
