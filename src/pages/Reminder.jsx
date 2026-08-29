import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { sendTestReminder } from '../api';

function CheckIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function LeafIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22s4-2 8-6 6-10 6-10-4 2-8 6-6 10-6 10z"/><path d="M22 2s-2 4-6 8"/></svg>; }
function MailIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function ClockIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function FlaskIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v7l3.5 6.5A2 2 0 0117 19H7a2 2 0 01-1.5-2.5L9 10V3z"/><line x1="6" y1="3" x2="18" y2="3"/></svg>; }
function CamIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>; }

export default function Reminder() {
  const navigate  = useNavigate();
  const { state } = useApp();
  const remedy     = state.selectedRemedy ?? state.remedies?.[0];
  const freq       = state.tracking?.frequency ?? 'weekly';
  const freqLabel  = freq === 'weekly' ? 'every week'   : 'every month';
  const freqPeriod = freq === 'weekly' ? 'weekly'        : 'monthly';
  const freqDays   = freq === 'weekly' ? '7 days'        : '30 days';
  const userEmail  = state.user?.email ?? 'your email';
  const userName   = state.user?.name?.split(' ')[0] ?? 'there';

  const [testState, setTestState] = useState('idle');

  async function handleTestReminder() {
    setTestState('sending');
    try { await sendTestReminder(); setTestState('sent'); }
    catch { setTestState('error'); }
  }

  return (
    <div style={{ background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

        @keyframes sk-in    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sk-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(190,202,92,.45)} 50%{box-shadow:0 0 0 10px rgba(190,202,92,0)} }
        @keyframes sk-ring  { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }

        .sk-in     { animation: sk-in .32s ease both; }
        .sk-check  { animation: sk-pulse 2.4s ease-in-out infinite; }
        .sk-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(94,106,42,.14) !important; }
        .sk-pill   { transition: transform .14s, box-shadow .14s; }
        .sk-lime   { transition: transform .14s, box-shadow .14s, filter .13s; }
        .sk-lime:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(190,202,92,.4) !important; filter: brightness(1.06); }
        .sk-test   { transition: background .13s, border-color .13s; }
        .sk-test:hover { background: var(--color-surface-tint) !important; border-color: var(--color-brand) !important; }

        @media (max-width:780px) {
          .sk-rem-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main style={{ maxWidth: 1020, margin: '0 auto', padding: '28px 32px 48px' }}>

        {/* ══ Two-column grid ══ */}
        <div className="sk-rem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: success + summary + test + CTA ── */}
          <div>

            {/* Success header */}
            <div className="sk-in" style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
              <div className="sk-check" style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--color-surface-tint)', border: '2px solid var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-text)', flexShrink: 0 }}>
                <CheckIcon />
              </div>
              <div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: 5 }}>Tracking active</div>
                <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 32, letterSpacing: '-.02em', margin: 0, color: 'var(--color-ink)', lineHeight: 1.1 }}>
                  You're all set!
                </h2>
              </div>
            </div>

            <p className="sk-in" style={{ fontSize: 14, color: 'var(--color-body)', lineHeight: 1.65, margin: '0 0 20px', animationDelay: '50ms' }}>
              Your first reminder arrives in <strong style={{ color: 'var(--color-brand-text)' }}>{freqDays}</strong> at{' '}
              <strong style={{ color: 'var(--color-brand-text)' }}>{userEmail}</strong>. The email preview is shown on the right.
            </p>

            {/* Summary pills */}
            <div className="sk-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 22, animationDelay: '90ms' }}>
              {[
                { Icon: LeafIcon,  text: remedy?.name ?? 'Your remedy',      bg: 'linear-gradient(135deg,#EEF4DC,#E4ECC8)', border: '#B8CC70', color: '#3A4818' },
                { Icon: MailIcon,  text: `Reminder ${freqLabel}`,             bg: 'linear-gradient(135deg,#E8EEF8,#D4DEF0)', border: '#90A8D0', color: '#1A3060' },
                { Icon: ClockIcon, text: `First check-in in ${freqDays}`,     bg: 'linear-gradient(135deg,#FFF5E0,#FDECC8)', border: '#F0CFA0', color: '#5C3E08' },
              ].map(({ Icon, text, bg, border, color }) => (
                <span key={text} className="sk-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: bg, border: `1.5px solid ${border}`, borderRadius: '999px', padding: '8px 14px', fontSize: 12.5, color, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                  <Icon /> {text}
                </span>
              ))}
            </div>

            {/* What happens next */}
            <div className="sk-in" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-hairline)', borderLeft: '3.5px solid var(--color-brand)', borderRadius: 14, padding: '16px 18px', marginBottom: 16, animationDelay: '120ms' }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: 12 }}>What happens next</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { dot: 'var(--color-brand)', text: `In ${freqDays} — reminder email arrives with a re-scan link` },
                  { dot: '#90C8DC', text: 'You upload a new photo — AI compares before & after' },
                  { dot: '#DCA878', text: 'We report: improved, same, or time to switch remedy' },
                ].map(({ dot, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test reminder */}
            <div className="sk-in" style={{ background: 'var(--color-surface-tint)', border: '1.5px solid var(--color-header-line)', borderRadius: 14, padding: '15px 18px', marginBottom: 20, animationDelay: '155ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--color-surface)', border: '1.5px solid var(--color-header-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-text)', flexShrink: 0 }}><FlaskIcon /></div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-brand-text)' }}>Want to verify the reminder email now?</div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--color-brand-text)', lineHeight: 1.55, margin: '0 0 12px' }}>
                Send an immediate test to <strong>{userEmail}</strong> — no need to wait {freqDays}.
              </p>

              {testState === 'sent' ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-surface-tint)', border: '1.5px solid #B8CC70', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#3E7A2A', fontWeight: 600 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Sent! Check <strong>{userEmail}</strong>
                </div>
              ) : testState === 'error' ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-alert-bg)', border: '1.5px solid #EDBBAA', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'var(--color-alert-strong)', fontWeight: 600 }}>
                  ✗ Failed — check backend logs.
                </div>
              ) : (
                <button onClick={handleTestReminder} disabled={testState === 'sending'} className="sk-test"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-brand-text)', border: '1.5px solid var(--color-header-line)', borderRadius: '999px', padding: '9px 20px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: testState === 'sending' ? 'default' : 'pointer', opacity: testState === 'sending' ? 0.7 : 1 }}>
                  {testState === 'sending' ? 'Sending…' : 'Send test reminder now →'}
                </button>
              )}
            </div>

            {/* Dashboard CTA */}
            <div className="sk-in" style={{ animationDelay: '190ms' }}>
              <button onClick={() => navigate('/upload')} className="sk-lime"
                style={{ background: 'var(--color-brand)', color: 'var(--color-brand-ink)', border: '1.5px solid #8A9A40', borderRadius: '999px', padding: '13px 32px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 18px rgba(190,202,92,.32)' }}>
                Go to dashboard →
              </button>
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55 }}>
                View tracking status and history anytime from your profile menu.
              </p>
            </div>
          </div>

          {/* ── RIGHT: email preview ── */}
          <div className="sk-in" style={{ animationDelay: '70ms' }}>
            <div style={{ background: '#E4E1D4', borderRadius: 16, padding: '12px 12px 16px' }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-muted)', textAlign: 'center', marginBottom: 10 }}>
                Email preview · arrives in {freqDays}
              </div>

              <div style={{ background: 'var(--color-surface)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 6px 22px rgba(50,46,25,.18)' }}>

                {/* Mail header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEEBE1', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-brand-deep)', color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 14, flexShrink: 0 }}>S</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                      Skinora <span style={{ color: 'var(--color-muted)', fontWeight: 400, fontSize: 11 }}>reminders@skinora.app</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>to {userEmail}</div>
                  </div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, color: 'var(--color-muted)', flexShrink: 0 }}>in {freqDays}</div>
                </div>

                {/* Subject */}
                <div style={{ padding: '12px 16px 0' }}>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: 17, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                    Time for your {freqPeriod} skin check-in 🌿
                  </div>
                </div>

                {/* Hero band */}
                <div style={{ margin: '10px 16px', height: 88, borderRadius: 10, position: 'relative', overflow: 'hidden', background: 'var(--color-brand)' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.03) 0px,rgba(255,255,255,.03) 2px,transparent 2px,transparent 10px)' }} />
                  <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-canvas)' }}>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85 }}>
                      {freq === 'weekly' ? 'Week 1' : 'Month 1'} of your protocol
                    </div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 18, marginTop: 3 }}>Let's see your progress.</div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '4px 16px 16px' }}>
                  <p style={{ fontSize: 12.5, color: '#4F4E45', lineHeight: 1.65, margin: '0 0 10px' }}>
                    Hi {userName}, it has been {freqDays} since you started{' '}
                    <strong>{remedy?.name ?? 'your remedy'}</strong>. A quick new photo lets our AI compare your skin and tell you whether to continue, switch, or seek advice.
                  </p>
                  <div style={{ background: '#F7F8EC', border: '1px solid #E4E8CC', borderRadius: 8, padding: '9px 12px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-success)', flexShrink: 0 }}><CamIcon /></span>
                    <span style={{ fontSize: 12, color: 'var(--color-brand-text)' }}>Takes 30 seconds · same lighting as last time for best results.</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', background: 'var(--color-ink)', color: 'var(--color-canvas)', borderRadius: '999px', padding: '10px 22px', fontSize: 12.5, fontWeight: 600 }}>
                      Re-scan my skin →
                    </span>
                  </div>
                  <p style={{ fontSize: 10.5, color: 'var(--color-muted)', lineHeight: 1.55, margin: '12px 0 0', textAlign: 'center' }}>
                    Tracking is on ({freqLabel}). Manage reminders anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
