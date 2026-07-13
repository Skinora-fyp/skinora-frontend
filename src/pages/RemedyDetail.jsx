import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { getRemedyById } from '../data/remedies';
import { getRemedy } from '../api';

export default function RemedyDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { state, dispatch } = useApp();
  const [remedy, setRemedy] = useState(state.selectedRemedy ?? null);

  useEffect(() => {
    if (!remedy || remedy.id !== id) {
      getRemedy(id)
        .then((res) => setRemedy(res.data))
        .catch(() => setRemedy(getRemedyById(id)));
    }
  }, [id, remedy]);

  if (!remedy) return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#9C9A8C' }}>Loading…</span>
    </div>
  );

  function selectRemedy() {
    dispatch({ type: 'SELECT_REMEDY', payload: remedy });
    navigate('/track');
  }

  const hasSourceUrl = remedy.sourceUrl && remedy.sourceUrl.startsWith('http');

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="remedies" />

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '34px 44px 60px' }}>
        {/* Back */}
        <button onClick={() => navigate('/remedies')}
          style={{ background: 'none', border: 'none', color: '#9C9A8C', fontFamily: "'Hanken Grotesk'", fontSize: 13, cursor: 'pointer', marginBottom: 22, padding: 0 }}>
          ← All remedies
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 38, alignItems: 'flex-start' }}>
          {/* ── Left: image + meta ── */}
          <div style={{ flex: '0 0 300px' }}>
            {/* Ingredient image */}
            <div style={{ height: 280, borderRadius: 18, position: 'relative', overflow: 'hidden', background: remedy.tint }}>
              <div className="stripe-overlay" style={{ position: 'absolute', inset: 0 }} />
              {remedy.image && (
                <img src={remedy.image} alt={remedy.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <span style={{ position: 'absolute', bottom: 14, left: 14, right: 14, fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#3a3a2a', background: 'rgba(252,251,246,.85)', padding: '7px 11px', borderRadius: 8 }}>
                Ingredient photo
              </span>
            </div>

            {/* Meta card */}
            <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: 18, marginTop: 14 }}>
              {[
                { label: 'Match',     value: `${remedy.match}%`, serif: true, color: '#5E6A2A' },
                { label: 'Frequency', value: remedy.freq },
                { label: 'Best for',  value: remedy.for, right: true },
              ].map(({ label, value, serif, color, right }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C' }}>{label}</span>
                  <span style={{ fontFamily: serif ? "'Newsreader',serif" : 'inherit', fontSize: serif ? 18 : 13, color: color ?? '#3a3a2a', textAlign: right ? 'right' : 'left', maxWidth: 160 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Lifestyle advices preview */}
            {state.advices?.length > 0 && (
              <div style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: 14, padding: 16, marginTop: 14 }}>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 10 }}>
                  Your lifestyle advices ready
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {state.advices.map((a) => (
                    <div key={a.tag} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: '#4F5A2A', lineHeight: 1.45 }}>
                      <span style={{ flexShrink: 0 }}>{a.icon}</span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#9AA646', letterSpacing: '.06em' }}>
                  Shown in full after you select this remedy →
                </div>
              </div>
            )}
          </div>

          {/* ── Right: detail ── */}
          <div style={{ flex: '1 1 420px', minWidth: 320 }}>
            <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7E9A3E' }}>{remedy.tag}</span>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,38px)', letterSpacing: '-.02em', margin: '8px 0 14px', lineHeight: 1.1 }}>
              {remedy.name}
            </h2>
            <p style={{ fontSize: 15.5, color: '#6B6A60', lineHeight: 1.7, margin: '0 0 28px' }}>{remedy.desc}</p>

            {/* How to use */}
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 16 }}>How to use it</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {(remedy.steps ?? []).map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: '#EEF0DC', color: '#5E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 15 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14.5, color: '#3a3a2a', lineHeight: 1.5, paddingTop: 4 }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Trusted source — clickable */}
            <div style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 13, alignItems: 'flex-start', marginBottom: 28 }}>
              <span style={{ color: '#7E9A3E', fontSize: 17, flexShrink: 0 }}>⌘</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 6 }}>Trusted source</div>
                <div style={{ fontSize: 13.5, color: '#4F5A2A', lineHeight: 1.6, marginBottom: hasSourceUrl ? 10 : 0 }}>{remedy.source}</div>
                {hasSourceUrl && (
                  <a
                    href={remedy.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: '#5E6A2A',
                      background: '#EEF0DC', border: '1px solid #D5DBA8',
                      borderRadius: '999px', padding: '6px 12px',
                      textDecoration: 'none', transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => { e.target.style.background = '#E2E7C9'; }}
                    onMouseLeave={(e) => { e.target.style.background = '#EEF0DC'; }}
                  >
                    <span>↗</span> Open source link
                  </a>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={selectRemedy}
                style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 30px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Select this remedy →
              </button>
              <button onClick={() => navigate('/remedies')}
                style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Compare others
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
