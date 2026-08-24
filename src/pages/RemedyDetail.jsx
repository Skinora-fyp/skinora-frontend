import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { getRemedyById } from '../data/remedies';
import { getRemedy } from '../api';

function resolveImage(remedy) {
  const name = (remedy.name ?? '').toLowerCase();
  if (name.includes('aloe'))                                 return '/assets/remedi8.jfif';
  if (name.includes('cucumber'))                             return '/assets/remedi1.jfif';
  if (name.includes('honey') || name.includes('raw honey')) return '/assets/remedi2.jfif';
  if (name.includes('green tea'))                            return '/assets/remedi3.jfif';
  if (name.includes('oat') || name.includes('oatmeal'))     return '/assets/remedi4.jfif';
  if (name.includes('rose water') || name.includes('rosewater')) return '/assets/remedi5.jfif';
  if (name.includes('avocado'))                              return '/assets/avacado.jfif';
  return remedy.image ?? null;
}

const EVIDENCE_COLOR = {
  'High evidence':   { bg: '#EEF0DC', text: '#5E6A2A', border: '#C8D068' },
  'Medium evidence': { bg: '#FFF8E6', text: '#7A5C00', border: '#F0DFA0' },
  'Low evidence':    { bg: '#FDF0EC', text: '#B05E3C', border: '#F0C0A8' },
};

export default function RemedyDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
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
      <span style={{ color: '#9C9A8C', fontFamily: "'Hanken Grotesk'", fontSize: 14 }}>Loading…</span>
    </div>
  );

  function selectRemedy() {
    dispatch({ type: 'SELECT_REMEDY', payload: remedy });
    navigate('/track');
  }

  const hasSourceUrl = remedy.sourceUrl && remedy.sourceUrl.startsWith('http');
  const imgSrc = resolveImage(remedy);
  const ev = EVIDENCE_COLOR[remedy.tag] ?? EVIDENCE_COLOR['Medium evidence'];

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="remedies" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

        @keyframes sk-in  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sk-img { from { opacity:0; transform:scale(1.04);     } to { opacity:1; transform:scale(1);     } }

        .sk-rd-wrap  { animation: sk-in .3s ease both; }
        .sk-rd-img   { animation: sk-img .45s ease both; }

        .sk-step-row { transition: background .14s, box-shadow .14s; }
        .sk-step-row:hover { background: #F8FAF0 !important; box-shadow: 0 4px 14px rgba(94,106,42,.1) !important; }

        .sk-sel-btn  { transition: transform .14s, box-shadow .14s, filter .13s; }
        .sk-sel-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(190,202,92,.38) !important; filter: brightness(1.06); }

        .sk-cmp-btn  { transition: background .13s, border-color .13s, color .13s; }
        .sk-cmp-btn:hover { background: #EEF0DC !important; border-color: #BECA5C !important; color: #3A4018 !important; }

        .sk-back-btn { transition: color .13s, background .13s; border-radius: 999px; }
        .sk-back-btn:hover { background: #ECEADF !important; color: #23241C !important; }

        @media (max-width: 680px) {
          .sk-rd-grid { flex-direction: column !important; }
          .sk-rd-left { width: 100% !important; flex: none !important; }
        }
      `}</style>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '22px 28px 56px' }}>

        {/* Back */}
        <button onClick={() => navigate('/remedies')} className="sk-back-btn"
          style={{ background: 'none', border: '1px solid #D8D4C4', color: '#7A7870', fontFamily: "'Hanken Grotesk'", fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: '7px 15px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          ← All remedies
        </button>

        <div className="sk-rd-wrap sk-rd-grid" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── Left column ── */}
          <div className="sk-rd-left" style={{ flex: '0 0 230px' }}>

            {/* Image card */}
            <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 210, background: remedy.tint ?? '#EEF0DC', border: '1.5px solid #D4DEB8', boxShadow: '0 6px 20px rgba(35,36,28,.12)', marginBottom: 12 }}>
              {imgSrc && (
                <img className="sk-rd-img" src={imgSrc} alt={remedy.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,30,10,.6) 0%, transparent 55%)' }} />
              {/* Match badge */}
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(246,244,236,.92)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '5px 10px', textAlign: 'center', border: '1px solid rgba(200,208,104,.35)' }}>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#3A4018', lineHeight: 1, fontWeight: 600 }}>{remedy.match}%</div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 7.5, letterSpacing: '.09em', textTransform: 'uppercase', color: '#7E9A3E', marginTop: 1 }}>match</div>
              </div>
              {/* Evidence pill at bottom */}
              <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.07em', textTransform: 'uppercase', color: ev.text, background: ev.bg, padding: '3px 9px', borderRadius: '999px', border: `1px solid ${ev.border}` }}>
                  {remedy.tag}
                </span>
              </div>
            </div>

            {/* Meta card */}
            <div style={{ background: '#fff', border: '1.5px solid #E6E3D8', borderLeft: '3.5px solid #BECA5C', borderRadius: 13, padding: '14px 16px', boxShadow: '0 2px 10px rgba(35,36,28,.06)', marginBottom: 10 }}>
              {[
                { label: 'Best for',  value: remedy.for },
                { label: 'Frequency', value: remedy.freq },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: '#3a3a2a', lineHeight: 1.45 }}>{value}</div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', background: '#F8FAF0', border: '1px solid #D4E0A8', borderRadius: 9, marginTop: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7E9A3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.06em', color: '#5E6A2A', textTransform: 'uppercase' }}>{remedy.freq}</span>
              </div>
            </div>

            {/* Lifestyle advices */}
            {state.advices?.length > 0 && (
              <div style={{ background: '#F4F6EA', border: '1.5px solid #D4E0A8', borderRadius: 13, padding: '13px 15px' }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 10 }}>Your lifestyle advice</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {state.advices.map((a) => (
                    <div key={a.tag} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, color: '#4F5A2A', lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>{a.icon}</span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#23241C', borderRadius: '999px', padding: '3px 11px', marginBottom: 10 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#BECA5C' }}>Remedy · Selected</span>
              </div>
              <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(22px,3.5vw,32px)', letterSpacing: '-.02em', margin: '0 0 10px', lineHeight: 1.15, color: '#23241C' }}>
                {remedy.name}
              </h1>
              <p style={{ fontSize: 14, color: '#6B6A60', lineHeight: 1.68, margin: 0 }}>{remedy.desc}</p>
            </div>

            <div style={{ height: 1, background: '#E6E3D8', margin: '16px 0' }} />

            {/* Steps */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#23241C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#BECA5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.11em', textTransform: 'uppercase', color: '#57564E' }}>How to use it</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(remedy.steps ?? []).map((step, i) => (
                  <div key={i} className="sk-step-row"
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', border: '1.5px solid #E6E3D8', borderLeft: '3px solid #BECA5C', borderRadius: 11, padding: '11px 14px', boxShadow: '0 1px 5px rgba(35,36,28,.05)', animationDelay: `${i * 70}ms` }}>
                    <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#EEF0DC', border: '1.5px solid #C8D068', color: '#5E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 13, fontWeight: 600 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13.5, color: '#3a3a2a', lineHeight: 1.55, paddingTop: 2 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trusted source */}
            <div style={{ background: '#F4F6EA', border: '1.5px solid #D4E0A8', borderLeft: '3.5px solid #7E9A3E', borderRadius: 12, padding: '13px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7E9A3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7E9A3E' }}>Trusted source</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#4F5A2A', lineHeight: 1.6, margin: '0 0 10px' }}>{remedy.source}</p>
              {hasSourceUrl && (
                <a href={remedy.sourceUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: '#5E6A2A', background: '#EEF0DC', border: '1px solid #D5DBA8', borderRadius: '999px', padding: '5px 11px', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E7C9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#EEF0DC'; }}>
                  ↗ Open source
                </a>
              )}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={selectRemedy} className="sk-sel-btn"
                style={{ background: '#BECA5C', color: '#1A1E0A', border: '1.5px solid #8A9A40', borderRadius: '999px', padding: '12px 26px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 3px 14px rgba(190,202,92,.3)' }}>
                Select this remedy →
              </button>
              <button onClick={() => navigate('/remedies')} className="sk-cmp-btn"
                style={{ background: 'transparent', border: '1.5px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '12px 20px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                Compare others
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
