import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { getRemediesForCondition } from '../data/remedies';
import { getRemedies as fetchRemedies } from '../api';

export default function Remedies() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const condition = state.detection?.final_condition ?? 'Oily_Acne';

  // Ensure remedies are loaded
  useEffect(() => {
    if (!state.remedies?.length) {
      fetchRemedies(condition)
        .then((res) => dispatch({ type: 'SET_REMEDIES', payload: res.data.remedies || [] }))
        .catch(() => dispatch({ type: 'SET_REMEDIES', payload: getRemediesForCondition(condition) }));
    }
  }, [condition, state.remedies, dispatch]);

  const remedies = state.remedies?.length
    ? state.remedies
    : getRemediesForCondition(condition);

  const lifestyle = state.lifestyle;
  const personalizeChip = lifestyle
    ? [(lifestyle.high_stress && 'stress'), (lifestyle.low_water && 'hydration')].filter(Boolean).join(' & ') + ' weighted'
    : 'personalized for you';

  function selectRemedy(remedy) {
    dispatch({ type: 'SELECT_REMEDY', payload: remedy });
    navigate(`/remedies/${remedy.id}`);
  }

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="remedies" />

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '46px 44px 60px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>
              Step 05 · For {condition}
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.02em', margin: 0 }}>
              Three botanical remedies, ranked for you.
            </h2>
          </div>
          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: '#9AA646', background: '#F4F6EA', padding: '8px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Personalized · {personalizeChip}
          </span>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 20 }}>
          {remedies.map((remedy, idx) => (
            <div key={remedy.id} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
              {/* Tinted header */}
              <div style={{ height: 140, position: 'relative', background: remedy.tint }}>
                <div className="stripe-overlay" style={{ position: 'absolute', inset: 0 }} />
                {remedy.image && (
                  <img src={remedy.image} alt={remedy.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: .7 }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                {/* Remedy number chip */}
                <span style={{ position: 'absolute', top: 13, left: 14, fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#3a3a2a', background: 'rgba(252,251,246,.85)', padding: '5px 9px', borderRadius: 6 }}>
                  Remedy {String(idx + 1).padStart(2, '0')}
                </span>
                {/* Match score circle */}
                <span style={{ position: 'absolute', top: 13, right: 14, fontFamily: "'Newsreader',serif", fontSize: 22, color: '#3a3a2a', background: 'rgba(252,251,246,.85)', width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {remedy.match}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 9 }}>
                  {remedy.tag} · {remedy.match}% match
                </span>
                <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 23, margin: '0 0 9px', lineHeight: 1.15 }}>{remedy.name}</h3>
                <p style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.6, margin: '0 0 14px' }}>{remedy.desc}</p>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.04em', color: '#9C9A8C', marginBottom: 18 }}>
                  Best for · {remedy.for}
                </div>
                <button onClick={() => selectRemedy(remedy)}
                  style={{ marginTop: 'auto', width: '100%', background: '#F1EEE3', border: '1px solid #E0DCCC', color: '#23241C', borderRadius: 11, padding: 13, fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  View &amp; select →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 30, fontSize: 13, color: '#9C9A8C' }}>
          <span style={{ color: '#8B9633' }}>✓</span> Each remedy is backed by a cited, peer-reviewed source — open one to read it.
        </div>
      </main>
    </div>
  );
}
