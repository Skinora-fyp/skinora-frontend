import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// activeStep: 'capture' | 'analyze' | 'personalize' | 'remedies' | 'track'
// consultMode: boolean — turns Analyze step terracotta
export default function AppHeader({ activeStep = 'capture', consultMode = false }) {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const userName = state.user?.name ?? 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const steps = [
    { id: 'capture',     label: 'Capture',     route: '/guidelines' },
    { id: 'analyze',     label: 'Analyze',     route: '/result'     },
    { id: 'personalize', label: 'Personalize', route: '/questionnaire' },
    { id: 'remedies',    label: 'Remedies',    route: '/remedies'   },
    { id: 'track',       label: 'Track',       route: '/track'      },
  ];

  function stepStyle(stepId) {
    const isActive = stepId === activeStep;
    if (!isActive) return { color: '#B6B4A8' };
    if (stepId === 'analyze' && consultMode) {
      return { background: '#F7E5DC', color: '#B05E3C', borderRadius: '999px', padding: '6px 11px' };
    }
    return { background: '#EEF0DC', color: '#5E6A2A', borderRadius: '999px', padding: '6px 11px' };
  }

  function handleLogout() {
    dispatch({ type: 'LOGOUT' });
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 44px', borderBottom: '1px solid #E6E3D8',
      background: 'rgba(246,244,236,.95)', position: 'sticky',
      top: 0, zIndex: 100, backdropFilter: 'blur(8px)',
    }}>
      {/* Logo — real image */}
      <button
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: '9px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <img
          src="/assets/skinora_logo.png"
          alt="Skinora"
          style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline-block';
          }}
        />
        <span style={{ display: 'none', width: 12, height: 12, borderRadius: '50%', background: '#BECA5C' }} />
        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 19, letterSpacing: '-.01em' }}>Skinora</span>
      </button>

      {/* Stepper */}
      <nav style={{ display: 'flex', gap: 5, alignItems: 'center', fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>
        {steps.map((step, i) => (
          <span key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={stepStyle(step.id)}>{step.label}</span>
            {i < steps.length - 1 && <span style={{ color: '#CFCCBE' }}>›</span>}
          </span>
        ))}
      </nav>

      {/* User menu */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10 }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#6E7733',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13,
          }}>
            {userInitial}
          </div>
          <span style={{ fontSize: 13, color: '#57564E' }}>{userName.split(' ')[0]}</span>
          <span style={{ fontSize: 10, color: '#9C9A8C' }}>▾</span>
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
              background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14,
              boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 200, overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0EDE4' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#23241C' }}>{userName}</div>
                <div style={{ fontSize: 12, color: '#9C9A8C', marginTop: 2 }}>{state.user?.email}</div>
              </div>

              {/* Menu items */}
              {[
                { label: 'My Activity History', icon: '📋', action: () => { navigate('/history'); setMenuOpen(false); } },
                { label: 'My Remedies', icon: '🌿', action: () => { navigate('/remedies'); setMenuOpen(false); } },
                { label: 'Progress Tracking', icon: '📈', action: () => { navigate('/track'); setMenuOpen(false); } },
              ].map(({ label, icon, action }) => (
                <button key={label} onClick={action} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: '#3a3a2a',
                  fontFamily: "'Hanken Grotesk'", borderBottom: '1px solid #F8F6F0',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F6F0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
                  <span>{icon}</span> {label}
                </button>
              ))}

              {/* Logout */}
              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: '#B05E3C',
                fontFamily: "'Hanken Grotesk'", transition: 'background .12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FDF4F0'; }}
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
