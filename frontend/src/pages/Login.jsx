import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../store/auth';

export default function Login() {
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-sage-700 text-white items-center justify-center mb-4 shadow-lg shadow-sage-700/20">
            <Stethoscope size={32} />
          </div>
          <h1 className="font-display text-3xl text-sage-900">Healing Clinic</h1>
          <p className="text-muted mt-2">Homeopathy practice management</p>
        </div>

        <form onSubmit={submit} className="card-surface p-6 md:p-8 space-y-5">
          <div>
            <label className="label" htmlFor="phone">Phone number</label>
            <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit phone" autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-center text-muted pt-2">
            Demo: Doctor <span className="font-medium text-sage-700">9876543210</span> / password123
          </p>
        </form>
      </div>
    </div>
  );
}
