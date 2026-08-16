import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { createTracking } from '../api';
import { saveHistoryEntry } from '../context/AppContext';

export default function Track() {
  const navigate  = useNavigate();
  const { state, dispatch } = useApp();
  const remedy    = state.selectedRemedy ?? state.remedies?.[0];
  const advices   = state.advices ?? [];
  const userEmail = state.user?.email ?? 'your email';
  const condition = state.detection?.final_condition ?? '';

  const [phase,   setPhase]   = useState('ask');     // 'ask' | 'frequency' | 'done-no'
  const [freq,    setFreq]    = useState('weekly');
  const [loading, setLoading] = useState(false);

  function persistHistory(enabled) {
    if (!state.user?.id) return;
    const entry = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      userId: state.user.id,
      detection: state.detection ? {
        skin_type: state.detection.skin_type,
        acne_status: state.detection.acne_status,
        final_condition: state.detection.final_condition,
        skin_conf: state.detection.skin_conf,
        acne_conf: state.detection.acne_conf,
      } : null,
      answers: state.answers,
      advices: state.advices,
      selectedRemedy: remedy ? { id: remedy.id, name: remedy.name, condition: remedy.condition } : null,
      tracking: { enabled, frequency: freq },
    };
    const updated = saveHistoryEntry(state.user.id, entry);
    dispatch({ type: 'SET_HISTORY', payload: updated });
  }

  async function confirmTracking() {
    setLoading(true);
    dispatch({ type: 'SET_TRACKING', payload: { enabled: true, frequency: freq } });
    persistHistory(true);
    try { await createTracking({ frequency: freq, remedy_id: remedy?.id }); } catch {}
    setLoading(false);
    navigate('/reminder');
  }

  function declineTracking() {
    persistHistory(false);
    setPhase('done-no');
  }

  // ── "No thanks" completion screen ────────────────────────────
  if (phase === 'done-no') {
    return (
      <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
        <AppHeader activeStep="track" />
        <main style={{ maxWidth: 620, margin: '0 auto', padding: '80px 44px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 22 }}>🌿</div>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 14 }}>
            You're all set
          </div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 38, letterSpacing: '-.02em', margin: '0 0 16px' }}>
            Your remedy plan is ready.
          </h2>
          <p style={{ fontSize: 15.5, color: '#6B6A60', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 32px' }}>
            <strong>{remedy?.name ?? 'Your selected remedy'}</strong> has been saved to your profile.
            Start your protocol today — you can always enable progress tracking later from your profile.
          </p>

          <div style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: 14, padding: '16px 22px', marginBottom: 34, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
            <span style={{ color: '#7E9A3E', fontSize: 20, flexShrink: 0 }}>✓</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#3a3a2a' }}>Remedy saved to your profile</div>
              <div style={{ fontSize: 13, color: '#7E9A3E', marginTop: 2 }}>
                {remedy?.name ?? 'Selected remedy'}{condition ? ` · ${condition}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/upload')}
              style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 32px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Go to dashboard →
            </button>
            <button onClick={() => navigate('/history')}
              style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              View history
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Shared: remedy banner + lifestyle advice ─────────────────
  const sharedTop = (
    <>
      <div style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: 14, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 13, marginBottom: advices.length > 0 ? 20 : 34 }}>
        <span style={{ color: '#7E9A3E', fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 14, color: '#4F5A2A' }}>
          Remedy selected — <strong>{remedy?.name ?? 'Your selected remedy'}</strong>
        </span>
      </div>

      {advices.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, padding: '24px 26px', marginBottom: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 6 }}>
                Your Lifestyle Advice
              </div>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 22, margin: 0, color: '#23241C' }}>
                Personalized for your wellness profile
              </h3>
            </div>
            <span style={{ background: '#EEF0DC', color: '#5E6A2A', fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: '999px', flexShrink: 0, marginTop: 2 }}>
              {advices.length} advice{advices.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {advices.map((advice, i) => (
              <div key={advice.tag} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: i < advices.length - 1 ? 12 : 0, borderBottom: i < advices.length - 1 ? '1px solid #F0EDE4' : 'none' }}>
                <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: '#F4F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {advice.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9AA646', marginBottom: 4 }}>
                    {advice.tag.replace(/_/g, ' ')}
                  </div>
                  <p style={{ fontSize: 14, color: '#3a3a2a', lineHeight: 1.55, margin: 0 }}>{advice.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '50px 44px 60px' }}>
        {sharedTop}

        {/* ── Phase: ask ── */}
        {phase === 'ask' && (
          <>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>
              Step 06 · Progress Tracking
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.02em', margin: '0 0 14px' }}>
              Want to track your progress?
            </h2>
            <p style={{ fontSize: 15.5, color: '#6B6A60', lineHeight: 1.65, maxWidth: 520, margin: '0 0 34px' }}>
              We'll send reminders to re-scan your skin, then compare photos to see whether your remedy is working.
            </p>

            {/* Feature chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 38 }}>
              {[
                { icon: '📷', title: 'Photo comparison', desc: 'Before & after your remedy' },
                { icon: '✉', title: 'Email reminders', desc: "We'll nudge you to re-scan" },
                { icon: '📊', title: 'AI progress report', desc: 'Improved, same, or worse?' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#23241C', marginBottom: 5 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: '#9C9A8C', lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setPhase('frequency')}
                style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 32px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Yes, track my progress →
              </button>
              <button onClick={declineTracking}
                style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                No thanks, I'm done
              </button>
            </div>
          </>
        )}

        {/* ── Phase: frequency ── */}
        {phase === 'frequency' && (
          <>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>
              Step 06 · Choose your check-in frequency
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.02em', margin: '0 0 14px' }}>
              How often would you like a check-in?
            </h2>
            <p style={{ fontSize: 15, color: '#6B6A60', lineHeight: 1.65, maxWidth: 480, margin: '0 0 30px' }}>
              A reminder will be sent to <strong>{userEmail}</strong> so you know when to upload a new photo.
            </p>

            {/* Frequency selector */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              {[
                { value: 'weekly',  label: 'Weekly',  sub: 'Every 7 days',  desc: 'Best for active acne and skin that changes quickly.' },
                { value: 'monthly', label: 'Monthly', sub: 'Every 30 days', desc: 'Gentler cadence for maintenance and slow routines.' },
              ].map(({ value, label, sub, desc }) => {
                const active = freq === value;
                return (
                  <button key={value} onClick={() => setFreq(value)} style={{ flex: 1, cursor: 'pointer', borderRadius: 14, border: `${active ? 2 : 1}px solid ${active ? '#BECA5C' : '#E6E3D8'}`, background: active ? '#F7F8EC' : '#fff', padding: 24, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Newsreader',serif", fontSize: 24 }}>{label}</span>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${active ? '#BECA5C' : '#CFCBBC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#9AA646', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>{sub}</div>
                    <p style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.55, margin: 0 }}>{desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Email summary */}
            <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF0DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉</span>
              <div>
                <div style={{ fontSize: 14, color: '#3a3a2a', fontWeight: 600 }}>
                  Reminder sent to {userEmail}
                </div>
                <div style={{ fontSize: 12.5, color: '#9C9A8C', marginTop: 2 }}>
                  First reminder in {freq === 'weekly' ? '7 days' : '30 days'} · pause or change anytime
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={confirmTracking} disabled={loading}
                style={{ background: loading ? '#D8DC9A' : '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 32px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.8 : 1 }}>
                {loading ? 'Setting up…' : `Confirm — remind me ${freq === 'weekly' ? 'every week' : 'every month'} →`}
              </button>
              <button onClick={() => setPhase('ask')}
                style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                ← Back
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
