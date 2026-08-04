import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Bell, CalendarClock } from 'lucide-react';
import api from '../lib/api';
import { PageLoader } from '../components/ui';
import { useAuth } from '../store/auth';

export default function Messages() {
  const isDoctor = useAuth((s) => s.user?.role === 'DOCTOR');
  const [body, setBody] = useState('Hello {name}, this is a message from Healing Homeopathy Clinic.');
  const [tag, setTag] = useState('');
  const [result, setResult] = useState(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['message-logs'],
    queryFn: async () => (await api.get('/messages/logs')).data.logs,
  });

  const { data: dueData, isLoading: dueLoading } = useQuery({
    queryKey: ['due-follow-ups'],
    queryFn: async () => (await api.get('/messages/due-follow-ups', { params: { days: 15 } })).data,
  });

  const bulkMut = useMutation({
    mutationFn: () => api.post('/messages/bulk', { body, tag: tag || undefined }),
    onSuccess: ({ data }) => {
      setResult(data);
      refetch();
    },
  });

  const remindMut = useMutation({
    mutationFn: (daysAhead) => api.post('/messages/follow-up-reminders', { daysAhead }),
    onSuccess: ({ data }) => {
      setResult(data);
      refetch();
    },
  });

  const dueFollowUps = dueData?.followUps ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl text-sage-900">WhatsApp communication</h1>
        <p className="text-muted text-sm mt-1">
          Auto reminders run every 6 hours for follow-ups due within 1 day. Set{' '}
          <code className="text-xs bg-sage-50 px-1 rounded">WHATSAPP_ENABLED=true</code> in backend .env for live sending.
        </p>
      </div>

      <section className="card-surface p-5 space-y-3 bg-gradient-to-r from-sage-50 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-600 text-white flex items-center justify-center shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="font-medium text-sage-900">15-day follow-up reminders</h2>
            <p className="text-sm text-muted mt-1">
              When you prescribe with &quot;next visit in 15 days&quot;, a follow-up is auto-scheduled. WhatsApp is sent
              automatically 1 day before the due date (or on due day).
            </p>
          </div>
        </div>

        {dueLoading ? <PageLoader /> : (
          <>
            <p className="text-sm font-medium text-sage-800">
              {dueFollowUps.length} patient(s) due in next 15 days
            </p>
            {dueFollowUps.length > 0 && (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {dueFollowUps.slice(0, 10).map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 text-sm border-b border-sage-50 pb-2">
                    <Link to={`/patients/${f.patient.id}`} className="font-medium text-sage-800 hover:text-sage-600">
                      {f.patient.fullName}
                    </Link>
                    <span className="text-muted flex items-center gap-1 shrink-0">
                      <CalendarClock size={14} />
                      {f.nextVisitDue ? format(new Date(f.nextVisitDue), 'd MMM yyyy') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {isDoctor && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={remindMut.isPending}
              onClick={() => remindMut.mutate(1)}
            >
              {remindMut.isPending ? 'Sending…' : 'Send reminders (due tomorrow)'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={remindMut.isPending}
              onClick={() => remindMut.mutate(15)}
            >
              Send reminders (due in 15 days)
            </button>
          </div>
        )}
      </section>

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
