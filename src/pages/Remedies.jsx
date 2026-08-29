import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { getRemediesForCondition } from '../data/remedies';
import { getRemedies as fetchRemedies } from '../api';

// Map remedy name keywords → correct image asset
function resolveImage(remedy) {
  if (remedy.image && !remedy.image.includes('remedi')) return remedy.image; // already a real override
  const name = (remedy.name ?? '').toLowerCase();

  // ── New remedies (specific checks first) ──────────────────────
  if (name.includes('yogurt'))                                  return '/assets/Yogurt.jfif';
  if (name.includes('oatmeal') && name.includes('jojoba'))     return '/assets/Oatmeal_Jojoba.jfif';
  if (name.includes('colloidal oatmeal'))                      return '/assets/oatmilkk.jfif';
  if (name.includes('shea butter'))                            return '/assets/Shea_Butter.jfif';
  if (name.includes('chamomile'))                              return '/assets/Chamomile_Compress.jfif';
  if (name.includes('tea tree') && name.includes('spot'))      return '/assets/Tea_Tree_Oil.jfif';
  if (name.includes('tea tree'))                               return '/assets/Diluted_Tea.jfif';
  if (name.includes('kaolin') && name.includes('balancing'))   return '/assets/Kaolin.jfif';
  if (name.includes('kaolin'))                                 return '/assets/Kaolin_Clay.jfif';
  if (name.includes('jojoba') && name.includes('light'))       return '/assets/Jojoba.jfif';
  if (name.includes('jojoba') && name.includes('hydrating'))   return '/assets/Jojoba_Oil.jfif';
  if (name.includes('jojoba'))                                 return '/assets/Jojoba1.jfif';

  // ── Original remedies ─────────────────────────────────────────
  if (name.includes('aloe'))                                   return '/assets/remedi8.jfif';
  if (name.includes('cucumber'))                               return '/assets/remedi1.jfif';
  if (name.includes('honey') || name.includes('raw honey'))    return '/assets/remedi2.jfif';
  if (name.includes('green tea'))                              return '/assets/remedi3.jfif';
  if (name.includes('oat') || name.includes('oatmeal'))        return '/assets/remedi4.jfif';
  if (name.includes('rose water') || name.includes('rosewater')) return '/assets/remedi5.jfif';
  if (name.includes('avocado'))                                return '/assets/avacado.jfif';

  return remedy.image ?? null;
}

const EVIDENCE_COLOR = {
  'High evidence':   { bg: 'var(--color-surface-tint)', text: 'var(--color-brand-text)', border: 'var(--color-header-line)' },
  'Medium evidence': { bg: 'var(--color-warn-bg)', text: 'var(--color-warn-strong)', border: 'var(--color-warn-border)' },
  'Low evidence':    { bg: '#FDF0EC', text: 'var(--color-alert-strong)', border: '#F0C0A8' },
};

export default function Remedies() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [showAll, setShowAll] = useState(false);
  const condition = state.detection?.final_condition ?? 'Oily_Acne';

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

  const conditionLabel = condition.replace('_', ' · ').replace('NoAcne', 'No Acne');

  function selectRemedy(remedy) {
    dispatch({ type: 'SELECT_REMEDY', payload: remedy });
    navigate(`/remedies/${remedy.id}`);
  }

  return (
    <div style={{ background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="remedies" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

        @keyframes sk-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

        .sk-remedy-card { animation: sk-fade-up .35s ease both; transition: transform .18s, box-shadow .18s; }
        .sk-remedy-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(94,106,42,.16) !important; }

        .sk-view-btn { transition: background .15s, color .15s, transform .14s; }
        .sk-view-btn:hover { background: var(--color-brand) !important; color: var(--color-brand-ink) !important; transform: translateY(-1px); }

        @media (max-width: 700px) {
          .sk-remedies-grid { grid-template-columns: 1fr !important; }
          .sk-remedies-header { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '44px 40px 72px' }}>

        {/* ── Page header ── */}
        <div className="sk-remedies-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-ink)', borderRadius: '999px', padding: '4px 13px', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand)', display: 'inline-block' }} />
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-brand)' }}>
                Step 5 · Remedies · {conditionLabel}
              </span>
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 42, letterSpacing: '-.025em', margin: '0 0 10px', lineHeight: 1.1, color: 'var(--color-ink)' }}>
              Botanical remedies,<br />ranked for your skin.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-body)', margin: 0, lineHeight: 1.65 }}>
              Each remedy is backed by peer-reviewed evidence and tailored to your detected condition.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10.5, color: 'var(--color-success)', background: 'var(--color-surface-tint)', padding: '7px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '.08em', border: '1px solid var(--color-header-line)' }}>
              {personalizeChip}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{remedies.length} remedies matched</span>
          </div>
        </div>

        {/* ── Cards grid ── */}
        <div className="sk-remedies-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {(showAll ? remedies : remedies.slice(0, 3)).map((remedy, idx) => {
            const ev = EVIDENCE_COLOR[remedy.tag] ?? EVIDENCE_COLOR['Medium evidence'];
            const imgSrc = resolveImage(remedy);
            return (
              <div key={remedy.id} className="sk-remedy-card"
                style={{
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-hairline)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 18px rgba(35,36,28,.08)',
                  animationDelay: `${idx * 80}ms`,
                }}
              >
                {/* ── Image header ── */}
                <div style={{ height: 200, position: 'relative', overflow: 'hidden', background: remedy.tint }}>
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={remedy.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  {/* Bottom gradient for text legibility */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,30,10,.62) 0%, rgba(26,30,10,.1) 55%, transparent 100%)' }} />

                  {/* Remedy number — top left */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(246,244,236,.92)', backdropFilter: 'blur(8px)', borderRadius: '999px', padding: '5px 11px 5px 6px', border: '1px solid rgba(200,208,104,.4)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, color: 'var(--color-brand)', fontWeight: 700, lineHeight: 1 }}>{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-text2)' }}>Remedy</span>
                  </div>

                  {/* Match score — top right */}
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(246,244,236,.92)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 11px', textAlign: 'center', border: '1px solid rgba(200,208,104,.4)' }}>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: 'var(--color-brand-text)', lineHeight: 1, fontWeight: 600 }}>{remedy.match}%</div>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-success)', marginTop: 1 }}>match</div>
                  </div>

                  {/* Remedy name overlaid on image */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px' }}>
                    <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 20, margin: 0, lineHeight: 1.2, color: '#F6F4EC', textShadow: '0 1px 6px rgba(0,0,0,.35)' }}>
                      {remedy.name}
                    </h3>
                  </div>
                </div>

                {/* ── Card body ── */}
                <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>

                  {/* Evidence tag + best-for */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: ev.text, background: ev.bg, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${ev.border}` }}>
                      {remedy.tag}
                    </span>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', color: 'var(--color-muted)' }}>
                      {remedy.for}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 13.5, color: 'var(--color-text2)', lineHeight: 1.65, margin: 0 }}>
                    {remedy.desc}
                  </p>

                  {/* Frequency pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F8FAF0', border: '1px solid #E4E8CC', borderRadius: 10 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.06em', color: 'var(--color-brand-text)', textTransform: 'uppercase' }}>
                      {remedy.freq}
                    </span>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => selectRemedy(remedy)}
                    className="sk-view-btn"
                    style={{
                      marginTop: 'auto', width: '100%',
                      background: '#F4F6E8', border: '1.5px solid var(--color-header-line)',
                      color: 'var(--color-brand-text)', borderRadius: 12, padding: '13px',
                      fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', letterSpacing: '.01em',
                    }}
                  >
                    View full recipe →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* See more / collapse */}
        {remedies.length > 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <button
              onClick={() => setShowAll(p => !p)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px',
                background: showAll ? '#F4F6E8' : 'var(--color-ink)',
                border: showAll ? '2px solid var(--color-header-line)' : 'none',
                borderRadius: '999px',
                fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14,
                color: showAll ? 'var(--color-brand-text)' : 'var(--color-brand)',
                cursor: 'pointer',
                boxShadow: showAll ? '0 4px 14px rgba(94,106,42,.14)' : '0 4px 18px rgba(35,36,28,.22)',
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {showAll ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  Show fewer remedies
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  See all {remedies.length} remedies
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 36, fontSize: 13, color: 'var(--color-muted)' }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-surface-tint)', border: '1px solid var(--color-header-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Each remedy is backed by a cited, peer-reviewed source — open one to read it.
        </div>
      </main>
    </div>
  );
}
