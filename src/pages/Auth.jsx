import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useApp } from '../context/AppContext';
import { sendOtp, verifyOtp, register, login, googleLogin } from '../api';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/* ── Shared input style ── */
const INPUT = (extra = {}) => ({
  width: '100%', border: '1.5px solid #E0DCCC', borderRadius: 11,
  padding: '10px 14px 10px 42px', background: '#FAFAF7', fontSize: 14,
  fontFamily: "'Hanken Grotesk'", color: '#23241C', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .15s',
  ...extra,
});

function IconInput({ icon, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#A8A698', pointerEvents: 'none', lineHeight: 1 }}>
        {icon}
      </span>
      {children}
    </div>
  );
}

function FieldLabel({ children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.09em', textTransform: 'uppercase', color: '#9C9A8C' }}>
        {children}
      </span>
      {right}
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [tab,         setTab]         = useState('signin');
  const [step,        setStep]        = useState('form');
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPass]        = useState('');
  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [errorCode,   setErrorCode]   = useState('');
  const [success,     setSuccess]     = useState('');
  const [cooldown,    setCooldown]    = useState(0);
  const [emailStatus, setEmailStatus] = useState('idle');

  const otpRefs   = useRef([]);
  const debounceT = useRef(null);
  const isSignup  = tab === 'signup';

  const checkEmailFormat = useCallback((val) => {
    clearTimeout(debounceT.current);
    if (!val) { setEmailStatus('idle'); return; }
    debounceT.current = setTimeout(() =>
      setEmailStatus(EMAIL_RE.test(val.trim()) ? 'valid' : 'invalid'), 400);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function switchTab(t) {
    setTab(t); setStep('form');
    setOtp(['', '', '', '', '', '']);
    setError(''); setErrorCode(''); setSuccess(''); setEmailStatus('idle');
  }

  function saveSession(user, access_token) {
    dispatch({ type: 'SET_USER',  payload: user });
    dispatch({ type: 'SET_TOKEN', payload: access_token });
    navigate('/guidelines');
  }

  const initiateGoogleLogin = useGoogleLogin({
    onSuccess: async (tr) => {
      setLoading(true); setError('');
      try {
        const res = await googleLogin({ access_token: tr.access_token });
        saveSession(res.data.user, res.data.access_token);
      } catch { setError('Google sign-in failed. Please try again.'); }
      finally  { setLoading(false); }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  function handleOtpChange(idx, val) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function handleOtpKeyDown(idx, e) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft'  && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!name.trim())        { setError('Full name is required.'); return; }
    if (!email.trim())       { setError('Email is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await sendOtp({ email: email.trim().toLowerCase(), name: name.trim() });
      setStep('otp'); setOtp(['', '', '', '', '', '']); setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send verification code. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await sendOtp({ email: email.trim().toLowerCase(), name: name.trim() });
      setOtp(['', '', '', '', '', '']); setCooldown(60);
      setSuccess('New code sent! Check your inbox.');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to resend code.');
    } finally { setLoading(false); }
  }

  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      await verifyOtp({ email: email.trim().toLowerCase(), otp: code });
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || 'Invalid code. Please try again.');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      const lr = await login({ email: email.trim().toLowerCase(), password });
      saveSession(lr.data.user, lr.data.access_token);
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleSignin(e) {
    e.preventDefault();
    setError(''); setErrorCode(''); setLoading(true);
    try {
      const res = await login({ email, password });
      saveSession(res.data.user, res.data.access_token);
    } catch (err) {
      const data = err?.response?.data ?? {};
      setError(data.error || 'Something went wrong. Please try again.');
      setErrorCode(data.code || '');
    } finally { setLoading(false); }
  }

  const otpFilled = otp.join('').length === 6;

  /* ── Error banner renderer ── */
  function ErrorBanner() {
    if (!error) return null;
    const cfgMap = {
      EMAIL_NOT_FOUND: { icon: '📧', accent: '#8A6B1E', bg: '#FFF8E6', border: '#F0DFA0',
        action: { label: 'Create an account instead →', fn: () => switchTab('signup') } },
      GOOGLE_ONLY:     { icon: '🔑', accent: '#3A5FA0', bg: '#EEF3FB', border: '#BACCF5',
        action: { label: 'Use Google Sign In →', fn: () => initiateGoogleLogin() } },
      WRONG_PASSWORD:  { icon: '🔒', accent: '#B05E3C', bg: '#FDF4F0', border: '#EDBBAA', action: null },
    };
    const cfg = !isSignup ? cfgMap[errorCode] : null;
    const accent = cfg?.accent ?? '#B05E3C';
    const bg     = cfg?.bg     ?? '#FDF4F0';
    const border = cfg?.border ?? '#EDBBAA';
    const icon   = cfg?.icon   ?? '⚠️';

    return (
      <div className="skinora-error-banner" style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '13px 15px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, color: accent, fontWeight: 600, lineHeight: 1.5, marginBottom: cfg?.action ? 6 : 0 }}>{error}</div>
          {cfg?.action && (
            <button type="button" onClick={cfg.action.fn}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: accent, fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 13, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 2 }}>
              {cfg.action.label}
            </button>
          )}
        </div>
        <button type="button" onClick={() => { setError(''); setErrorCode(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, opacity: .5, fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="sk-auth-outer" style={{ height: '100vh', background: '#EFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '16px', fontFamily: "'Hanken Grotesk'", boxSizing: 'border-box' }}>

      <style>{`
        @keyframes skinora-banner-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .skinora-error-banner { animation: skinora-banner-in 0.22s ease both; }
        .skinora-tab-btn { transition: color .15s, border-color .15s; }
        .skinora-tab-btn:hover { color: #23241C !important; }
        .skinora-field input:focus { border-color: #BECA5C !important; background: #fff !important; }
        .skinora-submit-btn:hover:not(:disabled) { filter: brightness(1.04); transform: translateY(-1px); }
        .skinora-submit-btn { transition: all .15s; }
        .skinora-google-btn:hover { border-color: #BECA5C !important; background: #FAFAF7 !important; }
        .skinora-google-btn { transition: all .15s; }

        @media (max-width: 640px) {
          .sk-auth-outer { padding: 0 !important; align-items: stretch !important; }
          .sk-auth-card  { border-radius: 0 !important; max-width: 100% !important; max-height: 100vh !important; height: 100vh !important; }
          .sk-auth-form  { padding: 20px 24px !important; }
        }
        @media (max-width: 400px) {
          .sk-auth-form  { padding: 16px 18px !important; }
        }
        @media (min-width: 641px) and (max-height: 700px) {
          .sk-auth-form  { padding: 16px 36px !important; }
          .sk-auth-form .sk-logo-row { margin-bottom: 10px !important; }
        }
      `}</style>

      {/* ── Decorative background circles ── */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'rgba(190,202,92,.13)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80,  width: 340, height: 340, borderRadius: '50%', background: 'rgba(110,119,51,.10)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '8%',  width: 180, height: 180, borderRadius: '50%', background: 'rgba(190,202,92,.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '6%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(110,119,51,.07)', pointerEvents: 'none' }} />

      {/* ── Card ── */}
      <div className="sk-auth-card" style={{
        display: 'flex', width: '100%', maxWidth: 920,
        maxHeight: 'calc(100vh - 32px)', background: '#fff',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,.14)',
        position: 'relative', zIndex: 1,
      }}>

        {/* ════════════════════════════════
            LEFT — Form panel
        ════════════════════════════════ */}
        <div className="sk-auth-form" style={{ flex: '1 1 52%', padding: '22px 40px', display: 'flex', flexDirection: 'column', overflowY: 'hidden', minHeight: 0 }}>

          {/* Logo */}
          <div className="sk-logo-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, flexShrink: 0, overflow: 'hidden', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/skinora_logo.png" alt="Skinora"
                style={{ width: 168, height: 168, objectFit: 'contain', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-family:\'Newsreader\',serif;font-size:26px;color:#6E7733;line-height:1;font-weight:700">S</span>'; }} />
            </div>
            <span style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#23241C', letterSpacing: '-.01em' }}>Skinora</span>
          </div>

          {/* ── OTP step ── */}
          {step === 'otp' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => { setStep('form'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#9C9A8C', fontSize: 13, marginBottom: 28, padding: 0, fontFamily: "'Hanken Grotesk'" }}>
                ← Back
              </button>

              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF0DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18 }}>✉️</div>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 28, margin: '0 0 8px', letterSpacing: '-.01em' }}>
                Check your inbox
              </h3>
              <p style={{ fontSize: 14, color: '#8A887C', margin: '0 0 28px', lineHeight: 1.55 }}>
                We sent a 6-digit code to <strong style={{ color: '#23241C' }}>{email}</strong>
              </p>

              <form onSubmit={handleVerifyAndRegister} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <FieldLabel>Verification code</FieldLabel>
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={{
                        flex: 1, height: 56, textAlign: 'center',
                        border: `1.5px solid ${digit ? '#BECA5C' : '#E0DCCC'}`,
                        borderRadius: 12, background: digit ? '#F4F6EA' : '#FAFAF7',
                        fontSize: 22, fontWeight: 700, fontFamily: "'Spline Sans Mono',monospace",
                        color: '#23241C', outline: 'none', transition: 'border-color .12s, background .12s',
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <div className="skinora-error-banner" style={{ background: '#FDF4F0', border: '1.5px solid #EDBBAA', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: 13.5, color: '#B05E3C', lineHeight: 1.5, flex: 1 }}>{error}</span>
                    <button type="button" onClick={() => setError('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B05E3C', opacity: .5, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                )}
                {success && (
                  <div style={{ background: '#F0FAF0', border: '1px solid #A8D5A2', borderRadius: 12, padding: '11px 14px', marginBottom: 16, display: 'flex', gap: 9, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
                    <span style={{ fontSize: 13.5, color: '#3E7A2A', lineHeight: 1.5 }}>{success}</span>
                  </div>
                )}

                <button type="submit" disabled={loading || !otpFilled} className="skinora-submit-btn"
                  style={{ width: '100%', background: otpFilled ? '#BECA5C' : '#ECEADF', color: otpFilled ? '#2A2D14' : '#A8A698', border: 'none', borderRadius: '999px', padding: '14px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15, cursor: (loading || !otpFilled) ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
                  {loading ? 'Verifying…' : 'Verify & create account →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#9C9A8C' }}>
                Didn't receive it?{' '}
                <button onClick={handleResend} disabled={cooldown > 0 || loading}
                  style={{ background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer', color: cooldown > 0 ? '#B6B4A8' : '#5E6A2A', fontWeight: 700, fontSize: 13, fontFamily: "'Hanken Grotesk'", padding: 0 }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#C4C1B4', margin: '14px 0 0' }}>
                Code expires in 10 minutes · Check spam folder if not received
              </p>
            </div>

          ) : (
            /* ── Normal form ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 26, margin: '0 0 3px', letterSpacing: '-.01em' }}>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h3>
              <p style={{ fontSize: 13.5, color: '#9C9A8C', margin: '0 0 14px' }}>
                {isSignup ? 'Start your personalised skin journey.' : 'Continue to your Skinora dashboard.'}
              </p>

              {/* ── Tab switcher — underline style ── */}
              <div style={{ display: 'flex', borderBottom: '1.5px solid #ECEADF', marginBottom: 16 }}>
                {[['signin', 'Login'], ['signup', 'Sign up']].map(([id, label]) => (
                  <button key={id} onClick={() => switchTab(id)} className="skinora-tab-btn"
                    style={{
                      padding: '0 0 10px', marginRight: 28,
                      background: 'none', border: 'none',
                      borderBottom: tab === id ? '2.5px solid #BECA5C' : '2.5px solid transparent',
                      marginBottom: -1.5,
                      color: tab === id ? '#23241C' : '#9C9A8C',
                      fontWeight: tab === id ? 700 : 500,
                      fontSize: 15, cursor: 'pointer', fontFamily: "'Hanken Grotesk'",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Google */}
              <button onClick={() => initiateGoogleLogin()} className="skinora-google-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', border: '1.5px solid #E0DCCC', borderRadius: '999px', padding: '10px 20px', cursor: 'pointer', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, color: '#23241C', marginBottom: 12 }}>
                <span style={{ fontFamily: "'Newsreader',serif", fontWeight: 800, fontSize: 17, background: 'conic-gradient(from -45deg,#EA4335,#FBBC05,#34A853,#4285F4,#EA4335)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>G</span>
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 12px' }}>
                <div style={{ flex: 1, height: 1, background: '#ECEADF' }} />
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#B6B4A8' }}>or email</span>
                <div style={{ flex: 1, height: 1, background: '#ECEADF' }} />
              </div>

              <form onSubmit={isSignup ? handleSendOtp : handleSignin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Name (signup only) */}
                {isSignup && (
                  <div className="skinora-field">
                    <FieldLabel>Full name</FieldLabel>
                    <IconInput icon="👤">
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Maya Fernando" required={isSignup}
                        style={INPUT()} />
                    </IconInput>
                  </div>
                )}

                {/* Email */}
                <div className="skinora-field">
                  <FieldLabel right={
                    isSignup && emailStatus === 'valid'   ? <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#5E6A2A' }}>✓ Valid</span> :
                    isSignup && emailStatus === 'invalid' ? <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#C0744E' }}>✗ Invalid</span> : null
                  }>Email</FieldLabel>
                  <IconInput icon="✉">
                    <input type="email" value={email}
                      onChange={e => { setEmail(e.target.value); if (isSignup) checkEmailFormat(e.target.value); }}
                      placeholder="you@email.com" required
                      style={INPUT({
                        borderColor: isSignup && emailStatus === 'invalid' ? '#E8A86C'
                                   : isSignup && emailStatus === 'valid'   ? '#BECA5C'
                                   : '#E0DCCC',
                      })} />
                  </IconInput>
                  {isSignup && emailStatus === 'invalid' && (
                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: '#C0744E', marginTop: 5 }}>
                      Please enter a valid email address (e.g. name@example.com)
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="skinora-field">
                  <FieldLabel right={
                    isSignup
                      ? <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: password.length >= 8 ? '#5E6A2A' : '#B6B4A8' }}>
                          {password.length >= 8 ? '✓ 8+ chars' : 'Min 8 chars'}
                        </span>
                      : null
                  }>Password</FieldLabel>
                  <IconInput icon="🔒">
                    <input type="password" value={password}
                      onChange={e => setPass(e.target.value)}
                      placeholder="••••••••••" required style={INPUT()} />
                  </IconInput>
                </div>

                {/* Error banner */}
                <ErrorBanner />

                {/* Submit */}
                {(() => {
                  const blocked = loading || (isSignup && emailStatus === 'invalid');
                  return (
                    <button type="submit" disabled={blocked} className="skinora-submit-btn"
                      style={{ width: '100%', background: blocked ? '#D8DC9A' : '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '12px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15, cursor: blocked ? 'not-allowed' : 'pointer', marginTop: 2 }}>
                      {loading ? 'Loading…' : isSignup ? 'Send verification code →' : 'Login →'}
                    </button>
                  );
                })()}
              </form>

              <p style={{ fontSize: 12, color: '#B6B4A8', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.5 }}>
                {isSignup
                  ? '✉️  A 6-digit code will be sent to verify your email.'
                  : '🔒  A verified account is required to upload any photo.'
                }
              </p>
            </div>
          )}
        </div>

        {/* ════════════════════════════════
            RIGHT — Aloe vera image panel
        ════════════════════════════════ */}
        <div style={{ flex: '1 1 48%', position: 'relative', overflow: 'hidden' }}
          className="skinora-auth-img-panel">
          <style>{`.skinora-auth-img-panel { display: block; } @media (max-width: 640px) { .skinora-auth-img-panel { display: none; } }`}</style>

          {/* Image */}
          <img src="/assets/sign_up.jfif" alt="Natural skin care"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.background = 'linear-gradient(160deg,#6E7733,#B4C45A)'; e.target.src = ''; }}
          />

          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(35,36,28,.75) 0%, rgba(35,36,28,.18) 55%, transparent 100%)' }} />

          {/* Brand badge */}
          <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(246,244,236,.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '999px', padding: '7px 14px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#BECA5C', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Newsreader',serif", fontSize: 14, color: '#fff', letterSpacing: '.01em' }}>Skinora</span>
          </div>

          {/* Bottom text */}
          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(190,202,92,.9)', marginBottom: 8 }}>
              Natural · Science-backed
            </div>
            <p style={{ fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 400, color: '#F6F4EC', lineHeight: 1.25, margin: 0 }}>
              AI-powered skin analysis<br />meets botanical care.
            </p>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
              {[['256-bit', 'Encryption'], ['0', 'Photos sold']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#BECA5C', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(230,227,216,.7)', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
