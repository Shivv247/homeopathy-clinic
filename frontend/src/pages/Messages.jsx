import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../lib/api';
import { PageLoader } from '../components/ui';

export default function Messages() {
  const [body, setBody] = useState('Namaste {name}, this is a message from Healing Homeopathy Clinic.');
  const [tag, setTag] = useState('');
  const [result, setResult] = useState(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['message-logs'],
    queryFn: async () => (await api.get('/messages/logs')).data.logs,
  });

  const bulkMut = useMutation({
    mutationFn: () => api.post('/messages/bulk', { body, tag: tag || undefined }),
    onSuccess: ({ data }) => {
      setResult(data);
      refetch();
    },
  });

  const remindMut = useMutation({
    mutationFn: () => api.post('/messages/follow-up-reminders', { daysAhead: 3 }),
    onSuccess: ({ data }) => {
      setResult(data);
      refetch();
    },
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl text-sage-900">WhatsApp communication</h1>
        <p className="text-muted text-sm mt-1">
          Messages are logged. Enable WHATSAPP_ENABLED in backend .env for live Cloud API sending.
        </p>
      </div>

      <section className="card-surface p-5 space-y-4">
        <h2 className="font-medium text-sage-900">Bulk message</h2>
        <textarea className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} />
        <p className="text-xs text-muted">Use {'{name}'} to insert patient name</p>
        <select className="input" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All active patients</option>
          <option value="NEW">New only</option>
          <option value="FOLLOW_UP">Follow-up only</option>
          <option value="VIP">VIP only</option>
        </select>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate()}>
            {bulkMut.isPending ? 'Sending…' : 'Send bulk'}
          </button>
          <button type="button" className="btn btn-secondary" disabled={remindMut.isPending} onClick={() => remindMut.mutate()}>
            Send follow-up reminders (3 days)
          </button>
        </div>
        {result && (
          <p className="text-sm text-sage-700 bg-sage-50 rounded-lg px-3 py-2">
            Sent {result.sent ?? 0} / {result.total ?? 0}
          </p>
        )}
      </section>

      <section className="card-surface p-5">
        <h2 className="font-medium text-sage-900 mb-3">Recent message log</h2>
        {isLoading ? <PageLoader /> : (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((l) => (
              <li key={l.id} className="text-sm border-b border-sage-50 pb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{l.phone}</span>
                  <span className={`text-xs ${l.status === 'SENT' ? 'text-sage-700' : 'text-red-600'}`}>{l.status}</span>
                </div>
                <p className="text-muted mt-1 line-clamp-2">{l.body}</p>
                <p className="text-xs text-muted mt-1">{format(new Date(l.createdAt), 'd MMM HH:mm')}</p>
              </li>
            ))}
            {!logs.length && <p className="text-muted text-sm">No messages yet</p>}
          </ul>
        )}
      </section>
    </div>
  );
}
