import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

export function Layout() {
  const { user, logout, hydrated, hydrate } = useAuthStore();
  const { unreadCount, connectHub, disconnectHub } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user?.role === 'Investor') {
      connectHub();
      return () => {
        void disconnectHub();
      };
    }
    void disconnectHub();
  }, [user?.role, connectHub, disconnectHub]);

  if (!hydrated) return <div className="p-8">Loading…</div>;

  const home =
    user?.role === 'Admin'
      ? '/admin'
      : user?.role === 'Company'
        ? '/company'
        : user?.role === 'Investor'
          ? '/investor'
          : '/login';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <Link to={home} className="font-semibold text-indigo-700">
          Investment MS
        </Link>
        <div className="flex items-center gap-4">
          {user?.role === 'Investor' && unreadCount > 0 && (
            <span
              className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white"
              title="Unread notifications"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {user ? (
            <>
              <span className="text-sm text-slate-600">
                {user.email} ({user.role})
              </span>
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-indigo-600">
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
