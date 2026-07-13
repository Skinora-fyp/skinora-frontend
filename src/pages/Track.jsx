import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { createTracking } from '../api';
import { saveHistoryEntry } from '../context/AppContext';

export default function Track() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const remedy  = state.selectedRemedy ?? state.remedies?.[0];
  const [freq, setFreq] = useState(state.tracking.frequency ?? 'weekly');
  const advices = state.advices ?? [];

  const freqLabel = freq === 'weekly' ? 'every week' : 'every month';
  const userEmail = state.user?.email ?? 'your registered email';

  function persistHistory(enabled) {
    if (!state.user?.id) return;
    const entry = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      userId: state.user.id,
      detection: state.detection
        ? {
            skin_type: state.detection.skin_type,
            acne_status: state.detection.acne_status,
            final_condition: state.detection.final_condition,
            skin_conf: state.detection.skin_conf,
            acne_conf: state.detection.acne_conf,
          }
        : null,
      answers: state.answers,
      advices: state.advices,
      selectedRemedy: remedy
        ? { id: remedy.id, name: remedy.name, condition: remedy.condition }
        : null,
      tracking: { enabled, frequency: freq },
    };
    const updated = saveHistoryEntry(state.user.id, entry);
    dispatch({ type: 'SET_HISTORY', payload: updated });
  }

  async function startTracking() {
    dispatch({ type: 'SET_TRACKING', payload: { enabled: true, frequency: freq } });
    persistHistory(true);
    try { await createTracking({ frequency: freq, remedy_id: remedy?.id }); } catch { /* offline */ }
    navigate('/reminder');
  }

  function skipTracking() {
    persistHistory(false);
    navigate('/checkin');
  }

  const freqCard = (value) => {
    const active = freq === value;
    return {
      flex: 1, cursor: 'pointer', borderRadius: 14,
      border: `${active ? 2 : 1}px solid ${active ? '#BECA5C' : '#E6E3D8'}`,
      background: active ? '#F7F8EC' : '#fff',
      padding: 24, textAlign: 'left',
    };
  };

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '50px 44px 60px' }}>
        {/* Remedy confirmation */}
        <div style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: 14, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 13, marginBottom: advices.length > 0 ? 20 : 34 }}>
          <span style={{ color: '#7E9A3E', fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 14, color: '#4F5A2A' }}>
            Remedy selected — <strong>{remedy?.name ?? 'Your selected remedy'}</strong>
          </span>
        </div>

        {/* ── Lifestyle Advice Panel (shown after remedy is selected) ── */}
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
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F0EDE4', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9C9A8C' }}>
              <span style={{ color: '#8B9633' }}>⌘</span>
              These lifestyle tips complement your selected remedy for best results.
            </div>
          </div>
        )}

        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>Step 06 · Progress Tracking</div>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.02em', margin: '0 0 12px' }}>Want to track your progress?</h2>
        <p style={{ fontSize: 15.5, color: '#6B6A60', lineHeight: 1.65, maxWidth: 540, margin: '0 0 34px' }}>
          We'll remind you to re-scan, then compare images to see whether your remedy is working — and adapt if it isn't. Choose how often you'd like a check-in.
        </p>

        {/* Frequency selector */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 30 }}>
          {[
            { value: 'weekly',  label: 'Weekly',  desc: 'A re-scan reminder every 7 days. Best for active acne and faster-changing skin.' },
            { value: 'monthly', label: 'Monthly', desc: 'A check-in every 30 days. Gentler cadence for maintenance and slow routines.' },
          ].map(({ value, label, desc }) => {
            const active = freq === value;
            return (
              <button key={value} onClick={() => setFreq(value)} style={freqCard(value)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Newsreader',serif", fontSize: 24 }}>{label}</span>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${active ? '#BECA5C' : '#CFCBBC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.55, margin: 0, textAlign: 'left' }}>{desc}</p>
              </button>
            );
          })}
        </div>

        {/* Email summary card */}
        <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 34 }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF0DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉</span>
          <div>
            <div style={{ fontSize: 14, color: '#3a3a2a', fontWeight: 600 }}>We'll email a reminder {freqLabel}.</div>
            <div style={{ fontSize: 12.5, color: '#9C9A8C', marginTop: 2 }}>Sent to {userEmail} · pause or change anytime in settings.</div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={startTracking}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 30px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Yes, track {freqLabel} →
          </button>
          <button onClick={skipTracking}
            style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Not now
          </button>
        </div>
      </main>
    </div>
  );
}
