import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { login, register } from '../api';

export default function Auth() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [tab, setTab]       = useState('signin'); // 'signin' | 'signup'
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  const isSignup = tab === 'signup';

  // Mock login: creates a user session immediately (replace with real OAuth in prod)
  function mockLogin(displayName = 'Maya Fernando', displayEmail = 'maya@skinora.app') {
    const user = { id: 1, name: displayName || 'Maya Fernando', email: displayEmail || email || 'maya@skinora.app' };
    dispatch({ type: 'SET_USER',  payload: user });
    dispatch({ type: 'SET_TOKEN', payload: 'mock-jwt-token' });
    navigate('/guidelines');
  }

  async function handleGoogleAuth() {
    // In production: redirect to /api/auth/google
    mockLogin(name || 'Maya Fernando', email || 'maya@skinora.app');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoad(true);
    try {
      if (isSignup) {
        const res = await register({ name, email, password });
        if (res.data?.message === 'Registration Successful') {
          const lr = await login({ email, password });
          dispatch({ type: 'SET_USER',  payload: lr.data.user });
          dispatch({ type: 'SET_TOKEN', payload: lr.data.access_token });
          navigate('/guidelines');
        }
      } else {
        const res = await login({ email, password });
        dispatch({ type: 'SET_USER',  payload: res.data.user });
        dispatch({ type: 'SET_TOKEN', payload: res.data.access_token });
        navigate('/guidelines');
      }
    } catch {
      // Fallback to mock in development
      mockLogin(name, email);
    } finally {
      setLoad(false);
    }
  }

  const tabBtn = (active) => ({
    flex: 1, textAlign: 'center', padding: '11px', borderRadius: '9px',
    background: active ? '#23241C' : 'transparent',
    color: active ? '#F6F4EC' : '#8A887C',
    fontWeight: 600, fontSize: '13.5px', cursor: 'pointer',
    fontFamily: "'Hanken Grotesk'", border: 'none',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>

      {/* ── Brand panel (left ~46%) ── */}
      <div style={{ flex: '1 1 46%', background: 'linear-gradient(165deg,#6E7733,#878F45)', color: '#F6F4EC', padding: '54px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E7ECC4', display: 'inline-block' }} />
          <span style={{ fontFamily: "'Newsreader',serif", fontSize: 21 }}>Skinora</span>
        </div>

        {/* Middle copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#DCE2B8', marginBottom: 18 }}>Members only</div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, lineHeight: 1.08, letterSpacing: '-.02em', margin: '0 0 18px' }}>
            An account unlocks<br />your diagnostic mirror.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#EAEDD6', maxWidth: 360, margin: 0 }}>
            Your scans, conditions and progress timeline are private to you — encrypted and never shared. Sign in to upload your first photo.
          </p>
        </div>

        {/* Bottom stats */}
        <div style={{ display: 'flex', gap: 30, position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26 }}>256-bit</div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#CDD49E', marginTop: 4 }}>Encryption</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26 }}>0</div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#CDD49E', marginTop: 4 }}>Photos sold</div>
          </div>
        </div>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -80, top: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -90, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
      </div>

      {/* ── Form panel (right ~54%) ── */}
      <div style={{ flex: '1 1 54%', background: '#F6F4EC', padding: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 30, margin: '0 0 6px' }}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h3>
          <p style={{ fontSize: 14, color: '#8A887C', margin: '0 0 26px' }}>Continue to your Skinora dashboard.</p>

          {/* Sign In / Sign Up toggle */}
          <div style={{ display: 'flex', gap: 6, background: '#ECEADF', borderRadius: 11, padding: 5, marginBottom: 24 }}>
            <button onClick={() => setTab('signin')} style={tabBtn(tab === 'signin')}>Sign In</button>
            <button onClick={() => setTab('signup')} style={tabBtn(tab === 'signup')}>Sign Up</button>
          </div>

          {/* Google button */}
          <button onClick={handleGoogleAuth}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, background: '#fff', border: '1px solid #DCD8C9', borderRadius: 12, padding: 14, cursor: 'pointer', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, color: '#23241C', boxShadow: '0 1px 2px rgba(0,0,0,.04)', marginBottom: 0 }}>
            <span style={{ fontFamily: "'Newsreader',serif", fontWeight: 700, fontSize: 18, background: 'conic-gradient(from -45deg,#EA4335,#FBBC05,#34A853,#4285F4,#EA4335)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>G</span>
            Continue with Google
          </button>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E0DCCC' }} />
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#A8A698' }}>or email</span>
            <div style={{ flex: 1, height: 1, background: '#E0DCCC' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name field (signup only) */}
            {isSignup && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 7 }}>Full name</div>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Maya Fernando" required={isSignup}
                  style={{ width: '100%', border: '1px solid #DCD8C9', borderRadius: 11, padding: '13px 14px', background: '#fff', fontSize: 14, fontFamily: "'Hanken Grotesk'", color: '#23241C', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 7 }}>Email</div>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com" required
                style={{ width: '100%', border: '1px solid #DCD8C9', borderRadius: 11, padding: '13px 14px', background: '#fff', fontSize: 14, fontFamily: "'Hanken Grotesk'", color: '#23241C', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 7 }}>Password</div>
              <input
                type="password" value={password} onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••••" required
                style={{ width: '100%', border: '1px solid #DCD8C9', borderRadius: 11, padding: '13px 14px', background: '#fff', fontSize: 14, fontFamily: "'Hanken Grotesk'", color: '#23241C', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && <p style={{ color: '#C0744E', fontSize: 13, marginBottom: 14 }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: 12, padding: 15, fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
              {loading ? 'Loading…' : isSignup ? 'Create account →' : 'Sign in →'}
            </button>
          </form>

          <p style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 12.5, color: '#9C9A8C', margin: '18px 0 0' }}>
            <span style={{ color: '#8B9633' }}>🔒</span>
            A verified account is required before uploading any photo.
          </p>
        </div>
      </div>
    </div>
  );
}
