import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getNotificationCount } from '../api';
import ThemeToggle from './ThemeToggle';

// activeStep: 'capture' | 'analyze' | 'personalize' | 'remedies' | 'track'
// consultMode: boolean — turns Analyze step terracotta
export default function AppHeader({ activeStep = 'capture', consultMode = false }) {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const userName = state.user?.name ?? 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const pending = state.pendingCheckins ?? 0;
  const intervalRef = useRef(null);

  // Fetch pending count on mount and every 5 minutes
  useEffect(() => {
    if (!state.user) return;
    const refresh = () =>
      getNotificationCount()
        .then(res => dispatch({ type: 'SET_PENDING_CHECKINS', payload: res.data.count }))
        .catch(() => {});
    refresh();
    intervalRef.current = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [state.user]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = [
    { id: 'capture',     label: 'Capture',     route: '/guidelines' },
    { id: 'analyze',     label: 'Analyze',     route: '/result'     },
    { id: 'personalize', label: 'Personalize', route: '/questionnaire' },
    { id: 'remedies',    label: 'Remedies',    route: '/remedies'   },
    { id: 'track',       label: 'Track',       route: '/track'      },
  ];

  function stepStyle(stepId) {
    const isActive = stepId === activeStep;
    if (!isActive) return { color: 'var(--color-muted)' };
    if (stepId === 'analyze' && consultMode) {
      return { background: 'var(--color-alert-bg)', color: 'var(--color-alert-strong)', borderRadius: '999px', padding: '6px 11px' };
    }
    return { background: 'var(--color-surface-tint)', color: 'var(--color-brand-text)', borderRadius: '999px', padding: '6px 11px' };
  }

  function handleLogout() {
    dispatch({ type: 'LOGOUT' });
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 44px', height: 80, borderBottom: '1px solid var(--color-header-line)',
      background: 'color-mix(in srgb, var(--color-brand) 22%, transparent)', position: 'sticky',
      top: 0, zIndex: 100, backdropFilter: 'blur(14px)',
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate(state.user ? '/upload' : '/')}
        style={{ display: 'flex', alignItems: 'center', height: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
      >
        <div style={{
          width: 78, height: 78, flexShrink: 0,
          overflow: 'hidden', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src="/assets/skinora_logo.png"
            alt="Skinora"
            style={{ width: 234, height: 234, objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span style="font-family:\'Newsreader\',serif;font-size:32px;color:var(--color-brand-deep);line-height:1;font-weight:700">S</span>';
            }}
          />
        </div>
      </button>

      {/* Stepper */}
      <nav style={{ display: 'flex', gap: 5, alignItems: 'center', fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>
        {steps.map((step, i) => (
          <span key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={stepStyle(step.id)}>{step.label}</span>
            {i < steps.length - 1 && <span style={{ color: 'var(--color-muted)' }}>›</span>}
          </span>
        ))}
      </nav>

      {/* User menu */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9 }}>
        <ThemeToggle />
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10 }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--color-brand-deep)',
              color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 13,
            }}>
              {userInitial}
            </div>
            {/* Numbered badge — count of pending check-in uploads */}
            {pending > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -7,
                minWidth: 18, height: 18, borderRadius: '999px',
                background: 'var(--color-notify)', border: '2px solid var(--color-canvas)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Hanken Grotesk'", fontWeight: 800, fontSize: 10,
                color: '#fff', lineHeight: 1, padding: '0 3px',
              }} title={`${pending} check-in${pending !== 1 ? 's' : ''} pending`}>
                {pending > 9 ? '9+' : pending}
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-text2)' }}>{userName.split(' ')[0]}</span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>▾</span>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            />
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 200,
              background: 'var(--color-surface)', border: '1px solid var(--color-hairline)', borderRadius: 14,
              boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 200, overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-hairline)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>{userName}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{state.user?.email}</div>
              </div>

              {/* Menu items */}
              {[
                { label: 'My Activity History', icon: '📋', action: () => { navigate('/history'); setMenuOpen(false); } },
                { label: 'My Remedies', icon: '🌿', action: () => { navigate('/remedies'); setMenuOpen(false); } },
                { label: 'Progress Tracking', icon: '📈', action: () => { navigate('/progress'); setMenuOpen(false); }, badge: pending > 0 ? pending : null },
              ].map(({ label, icon, action, badge }) => (
                <button key={label} onClick={action} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: 'var(--color-ink)',
                  fontFamily: "'Hanken Grotesk'", borderBottom: '1px solid var(--color-canvas-alt)',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-canvas-alt)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
                  <span>{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge != null && (
                    <span style={{
                      minWidth: 20, height: 20, borderRadius: '999px',
                      background: 'var(--color-notify)', color: '#fff',
                      fontWeight: 800, fontSize: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px', lineHeight: 1, flexShrink: 0,
                    }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              ))}

              {/* Logout */}
              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: 'var(--color-alert-strong)',
                fontFamily: "'Hanken Grotesk'", transition: 'background .12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-alert-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
                <span>↩</span> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
