import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope,
  Receipt, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../store/auth';
import clsx from 'clsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['DOCTOR', 'RECEPTIONIST', 'ASSISTANT'] },
  { to: '/patients', label: 'Patients', icon: Users, roles: ['DOCTOR', 'RECEPTIONIST', 'ASSISTANT'] },
  { to: '/billing', label: 'Billing', icon: Receipt, roles: ['DOCTOR', 'RECEPTIONIST'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['DOCTOR'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = nav.filter((n) => n.roles.includes(user?.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sage-800 text-white sticky top-0 z-40">
        <div>
          <p className="font-display text-lg leading-tight">Healing Clinic</p>
          <p className="text-xs text-sage-200">{user?.name}</p>
        </div>
        <button type="button" className="p-2 rounded-lg bg-sage-700" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={clsx(
        'fixed md:sticky top-0 left-0 z-30 h-dvh w-72 bg-sage-800 text-sage-50 flex flex-col transition-transform md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-5 border-b border-sage-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sage-600 flex items-center justify-center">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="font-display text-lg leading-tight">Healing</h1>
              <p className="text-xs text-sage-300">Homeopathy Clinic</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-12',
                isActive ? 'bg-sage-600 text-white' : 'text-sage-200 hover:bg-sage-700/60 hover:text-white'
              )}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sage-700">
          <div className="mb-3 px-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-sage-300 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            type="button"
            className="btn w-full bg-sage-700 text-sage-100 hover:bg-sage-600"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <button type="button" className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setOpen(false)} aria-label="Close menu" />
      )}

      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
