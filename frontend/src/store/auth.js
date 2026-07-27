import { create } from 'zustand';

export const useAuth = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  isDoctor: () => useAuth.getState().user?.role === 'DOCTOR',
  canEditClinical: () => useAuth.getState().user?.role === 'DOCTOR',
  canManageOps: () => ['DOCTOR', 'RECEPTIONIST'].includes(useAuth.getState().user?.role),
}));
