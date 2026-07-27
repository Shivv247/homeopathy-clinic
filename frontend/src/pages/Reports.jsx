import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import api from '../lib/api';
import { PageLoader } from '../components/ui';

export default function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/dashboard/analytics')).data.analytics,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-sage-900">Reports & analytics</h1>
        <p className="text-muted text-sm mt-1">Patient trends, revenue, and prescribing patterns</p>
      </div>

      <section className="card-surface p-5">
        <h2 className="font-display text-lg text-sage-900 mb-4">Monthly patients & revenue</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c8dbc9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="patients" stroke="#3a6343" strokeWidth={2} name="New patients" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#b45309" strokeWidth={2} name="Revenue ₹" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="card-surface p-5">
          <h2 className="font-display text-lg text-sage-900 mb-4">Top remedies</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topRemedies || []} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c8dbc9" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4d7c56" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!data?.topRemedies?.length && <p className="text-sm text-muted">No prescription data yet</p>}
        </section>

        <section className="card-surface p-5">
          <h2 className="font-display text-lg text-sage-900 mb-4">Common diagnoses</h2>
          <ul className="space-y-2">
            {(data?.topComplaints || []).map((c) => (
              <li key={c.name} className="flex justify-between text-sm py-2 border-b border-sage-100 last:border-0">
                <span className="text-sage-900">{c.name}</span>
                <span className="font-semibold text-sage-700">{c.count}</span>
              </li>
            ))}
            {!data?.topComplaints?.length && <p className="text-sm text-muted">No diagnosis data yet</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
