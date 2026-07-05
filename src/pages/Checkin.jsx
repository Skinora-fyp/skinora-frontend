import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { recordCheckin } from '../api';

const OUTCOMES = {
  Improved: {
    label: 'Improved',
    accent: '#7E9A3E',
    bg:     '#F4F8EE',
    delta:  '+18%',
    deltaLabel: 'improvement',
    headline: 'Looking good — keep going.',
    body:   'Your skin shows measurable improvement. Continue with the current protocol for another cycle to lock in these gains.',
    cta:    'Continue tracking →',
    route:  '/track',
  },
  'No change': {
    label: 'No change',
    accent: '#B08A3C',
    bg:     '#FBF6ED',
    delta:  '±0%',
    deltaLabel: 'change so far',
    headline: 'Let\'s try a different approach.',
    body:   'No visible change yet. Some remedies need a longer window, but a fresh formulation can accelerate results. See alternative options below.',
    cta:    'Explore new remedies →',
    route:  '/remedies',
  },
  Worse: {
    label: 'Worse',
    accent: '#C0744E',
    bg:     '#FBEFE8',
    delta:  '−12%',
    deltaLabel: 'regression',
    headline: 'Time to speak to a specialist.',
    body:   'Skin appears to have reacted negatively. We recommend stopping the current remedy and consulting a dermatologist for a personalised plan.',
    cta:    'Get expert advice →',
    route:  '/consult',
  },
};

export default function Checkin() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [outcome, setOutcome] = useState('Improved');
  const [saved,   setSaved]   = useState(false);

  const o = OUTCOMES[outcome];

  async function handleSave() {
    dispatch({ type: 'SET_CHECKIN', payload: { outcome, delta: o.delta } });
    try { await recordCheckin({ outcome, delta: o.delta }); } catch { /* offline */ }
    setSaved(true);
    setTimeout(() => navigate(o.route), 600);
  }

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '46px 44px 60px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 38 }}>
          <div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>
              Step 07 · Progress Check-in
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-.02em', margin: 0 }}>
              How is your skin <em style={{ fontStyle: 'italic' }}>feeling</em> this week?
            </h2>
          </div>

          {/* Outcome segmented control */}
          <div style={{ display: 'flex', background: '#ECEADF', borderRadius: '999px', padding: 4, gap: 2 }}>
            {Object.keys(OUTCOMES).map((key) => (
              <button key={key} onClick={() => setOutcome(key)}
                style={{ border: 'none', borderRadius: '999px', padding: '10px 18px',
                  fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                  background: outcome === key ? '#fff' : 'transparent',
                  color:      outcome === key ? OUTCOMES[key].accent : '#6B6A60',
                  boxShadow:  outcome === key ? '0 1px 4px rgba(0,0,0,.12)' : 'none',
                  transition: 'all .15s',
                }}>
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>

          {/* ── Left: Before / After images ── */}
          <div style={{ flex: '1 1 420px', minWidth: 300 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Before */}
              <div>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 8, textAlign: 'center' }}>
                  Before
                </div>
                <div style={{ height: 260, borderRadius: 16, background: '#ECEADF', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {state.detection?.image_url ? (
                    <img src={state.detection.image_url} alt="Before"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                      <div style={{ fontSize: 12, color: '#9C9A8C' }}>Original scan</div>
                    </div>
                  )}
                  <span style={{ position: 'absolute', bottom: 11, left: 11, fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#3a3a2a', background: 'rgba(252,251,246,.9)', padding: '5px 9px', borderRadius: 6 }}>
                    Week 0
                  </span>
                </div>
              </div>

              {/* After */}
              <div>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: o.accent, marginBottom: 8, textAlign: 'center' }}>
                  After
                </div>
                <div style={{ height: 260, borderRadius: 16, background: o.bg, border: `2px solid ${o.accent}`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🌿</div>
                    <div style={{ fontSize: 12, color: o.accent, fontWeight: 600 }}>New scan here</div>
                    <div style={{ fontSize: 11, color: '#9C9A8C', marginTop: 3 }}>Upload to compare</div>
                  </div>
                  <span style={{ position: 'absolute', bottom: 11, right: 11, fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: o.accent, padding: '5px 9px', borderRadius: 6 }}>
                    Week 1
                  </span>
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              {[
                { label: 'Active spots', before: '12', after: '7', unit: '' },
                { label: 'Hydration',    before: 'Low', after: 'Mid', unit: '' },
              ].map(({ label, before, after }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#9C9A8C', textDecoration: 'line-through' }}>{before}</span>
                    <span style={{ color: '#9C9A8C', fontSize: 14 }}>→</span>
                    <span style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: o.accent }}>{after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Outcome card ── */}
          <div style={{ flex: '1 1 280px', minWidth: 260 }}>
            <div style={{ background: o.bg, border: `1px solid ${o.accent}44`, borderRadius: 20, padding: 28, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Delta badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Newsreader',serif", fontSize: 40, color: o.accent, lineHeight: 1 }}>{o.delta}</span>
                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: o.accent, lineHeight: 1.3 }}>{o.deltaLabel}</span>
              </div>

              {/* Outcome label */}
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: o.accent, marginBottom: 8 }}>
                {o.label}
              </div>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 26, letterSpacing: '-.01em', margin: '0 0 14px', color: '#23241C', lineHeight: 1.2 }}>
                {o.headline}
              </h3>
              <p style={{ fontSize: 14, color: '#6B6A60', lineHeight: 1.65, margin: '0 0 24px' }}>{o.body}</p>

              {/* Visual indicator bar */}
              <div style={{ height: 7, background: '#DFDBCC', borderRadius: 5, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ height: '100%', width: outcome === 'Improved' ? '68%' : outcome === 'No change' ? '50%' : '38%', background: o.accent, borderRadius: 5, transition: 'width .4s ease' }} />
              </div>

              <button onClick={handleSave}
                style={{ background: o.accent, color: '#fff', border: 'none', borderRadius: '999px', padding: '15px 26px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>
                {saved ? 'Saving…' : o.cta}
              </button>
              <button onClick={() => navigate('/')}
                style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '12px 20px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                Return to home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
