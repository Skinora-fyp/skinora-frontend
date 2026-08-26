import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { getRemedyById } from '../data/remedies';
import { getRemedy } from '../api';

function resolveImage(remedy) {
  if (remedy.image && !remedy.image.includes('remedi')) return remedy.image;
  const n = (remedy.name ?? '').toLowerCase();

  // New remedies (specific checks first)
  if (n.includes('yogurt'))                                return '/assets/Yogurt.jfif';
  if (n.includes('oatmeal') && n.includes('jojoba'))      return '/assets/Oatmeal_Jojoba.jfif';
  if (n.includes('colloidal oatmeal'))                    return '/assets/oatmilkk.jfif';
  if (n.includes('shea butter'))                          return '/assets/Shea_Butter.jfif';
  if (n.includes('chamomile'))                            return '/assets/Chamomile_Compress.jfif';
  if (n.includes('tea tree') && n.includes('spot'))       return '/assets/Tea_Tree_Oil.jfif';
  if (n.includes('tea tree'))                             return '/assets/Diluted_Tea.jfif';
  if (n.includes('kaolin') && n.includes('balancing'))    return '/assets/Kaolin.jfif';
  if (n.includes('kaolin'))                               return '/assets/Kaolin_Clay.jfif';
  if (n.includes('jojoba') && n.includes('light'))        return '/assets/Jojoba.jfif';
  if (n.includes('jojoba') && n.includes('hydrating'))    return '/assets/Jojoba_Oil.jfif';
  if (n.includes('jojoba'))                               return '/assets/Jojoba1.jfif';

  // Original remedies
  if (n.includes('aloe'))                                 return '/assets/remedi8.jfif';
  if (n.includes('cucumber'))                             return '/assets/remedi1.jfif';
  if (n.includes('honey') || n.includes('raw honey'))    return '/assets/remedi2.jfif';
  if (n.includes('green tea'))                            return '/assets/remedi3.jfif';
  if (n.includes('oat') || n.includes('oatmeal'))        return '/assets/remedi4.jfif';
  if (n.includes('rose water') || n.includes('rosewater')) return '/assets/remedi5.jfif';
  if (n.includes('avocado'))                              return '/assets/avacado.jfif';

  return remedy.image ?? null;
}

const EV = {
  'High evidence':   { bg: '#EEF0DC', text: '#5E6A2A', border: '#C8D068' },
  'Medium evidence': { bg: '#FFF8E6', text: '#7A5C00', border: '#F0DFA0' },
  'Low evidence':    { bg: '#FDF0EC', text: '#B05E3C', border: '#F0C0A8' },
};

const ADVICE_PAL = [
  { bg: 'linear-gradient(135deg,#EEF4DC,#E4ECC8)', border: '#B8CC70', lbl: '#5E6A2A' },
  { bg: 'linear-gradient(135deg,#FFF5E0,#FDECC8)', border: '#F0CFA0', lbl: '#8A6010' },
  { bg: 'linear-gradient(135deg,#E8F4F8,#D4EAF4)', border: '#90C8DC', lbl: '#1A6680' },
  { bg: 'linear-gradient(135deg,#F4E8F8,#EAD4F0)', border: '#C090D0', lbl: '#6A2080' },
  { bg: 'linear-gradient(135deg,#F8EEE4,#F0E0CC)', border: '#DCA878', lbl: '#8A4820' },
];

function SparkIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function ClockIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function BookIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>; }

export default function RemedyDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [remedy, setRemedy] = useState(state.selectedRemedy ?? null);

  useEffect(() => {
    if (!remedy || remedy.id !== id) {
      getRemedy(id).then(r => setRemedy(r.data)).catch(() => setRemedy(getRemedyById(id)));
    }
  }, [id, remedy]);

  if (!remedy) return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#9C9A8C', fontFamily: "'Hanken Grotesk'", fontSize: 14 }}>Loading…</span>
    </div>
  );

  function selectRemedy() { dispatch({ type: 'SELECT_REMEDY', payload: remedy }); navigate('/track'); }

  const imgSrc  = resolveImage(remedy);
  const ev      = EV[remedy.tag] ?? EV['Medium evidence'];
  const advices = state.advices ?? [];
  const hasUrl  = remedy.sourceUrl?.startsWith('http');

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="remedies" />
      <style>{css}</style>

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '18px 28px 44px' }}>

        {/* Back */}
        <button onClick={() => navigate('/remedies')} className="sk-back"
          style={{ background: 'none', border: '1px solid #D8D4C4', color: '#7A7870', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: '6px 14px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Hanken Grotesk'" }}>
          ← All remedies
        </button>

        {/* ══ 3-column grid ══ */}
        <div className="sk-3col" style={{ display: 'grid', gridTemplateColumns: '200px 1fr 210px', gap: 18, alignItems: 'start' }}>

          {/* ── COL 1: image + meta ── */}
          <div className="sk-in">

            {/* Image */}
            <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', height: 190, background: remedy.tint ?? '#EEF0DC', border: '1.5px solid #D4DEB8', boxShadow: '0 5px 18px rgba(35,36,28,.12)', marginBottom: 10 }}>
              {imgSrc && (
                <img className="sk-img" src={imgSrc} alt={remedy.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,30,10,.58) 0%, transparent 52%)' }} />
              {/* Match */}
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(246,244,236,.93)', backdropFilter: 'blur(8px)', borderRadius: 9, padding: '4px 9px', textAlign: 'center', border: '1px solid rgba(200,208,104,.35)' }}>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#3A4018', lineHeight: 1, fontWeight: 600 }}>{remedy.match}%</div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 7, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7E9A3E', marginTop: 1 }}>match</div>
              </div>
              {/* Evidence */}
              <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase', color: ev.text, background: ev.bg, padding: '2px 8px', borderRadius: '999px', border: `1px solid ${ev.border}` }}>{remedy.tag}</span>
              </div>
            </div>

            {/* Meta card */}
            <div style={{ background: '#fff', border: '1.5px solid #E6E3D8', borderLeft: '3px solid #BECA5C', borderRadius: 12, padding: '12px 13px', boxShadow: '0 2px 8px rgba(35,36,28,.06)' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 3 }}>Best for</div>
                <div style={{ fontSize: 12.5, color: '#3a3a2a', lineHeight: 1.4 }}>{remedy.for}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 3 }}>Frequency</div>
                <div style={{ fontSize: 12.5, color: '#3a3a2a', lineHeight: 1.4, marginBottom: 8 }}>{remedy.freq}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', background: '#F8FAF0', border: '1px solid #D4E0A8', borderRadius: 8, color: '#5E6A2A' }}>
                  <ClockIcon />
                  <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.06em', color: '#5E6A2A', textTransform: 'uppercase' }}>{remedy.freq}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── COL 2: name + steps + source + CTAs ── */}
          <div className="sk-in" style={{ animationDelay: '70ms' }}>

            {/* Header */}
            <div style={{ marginBottom: 13 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#23241C', borderRadius: '999px', padding: '3px 11px', marginBottom: 9 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#BECA5C' }}>Remedy · Selected</span>
              </div>
              <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(20px,2.8vw,28px)', letterSpacing: '-.02em', margin: '0 0 7px', color: '#23241C', lineHeight: 1.15 }}>
                {remedy.name}
              </h1>
              <p style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.65, margin: 0 }}>{remedy.desc}</p>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(to right,#C8D068,#E6E3D8)', margin: '12px 0' }} />

            {/* Steps */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#23241C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BECA5C', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.11em', textTransform: 'uppercase', color: '#57564E' }}>How to use it</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(remedy.steps ?? []).map((step, i) => (
                  <div key={i} className="sk-step"
                    style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: '#fff', border: '1.5px solid #E6E3D8', borderLeft: '3px solid #BECA5C', borderRadius: 10, padding: '10px 13px', boxShadow: '0 1px 5px rgba(35,36,28,.05)' }}>
                    <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#EEF0DC,#DDE8B8)', border: '1.5px solid #C8D068', color: '#5E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 12, fontWeight: 600 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: '#3a3a2a', lineHeight: 1.55, paddingTop: 2 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source */}
            <div style={{ background: 'linear-gradient(135deg,#F4F6EA,#EDF1DC)', border: '1.5px solid #C8D068', borderLeft: '3px solid #7E9A3E', borderRadius: 11, padding: '11px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#7E9A3E' }}>
                <BookIcon />
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7E9A3E', fontWeight: 600 }}>Trusted source</span>
              </div>
              <p style={{ fontSize: 12, color: '#4F5A2A', lineHeight: 1.6, margin: '0 0 8px' }}>{remedy.source}</p>
              {hasUrl && (
                <a href={remedy.sourceUrl} target="_blank" rel="noopener noreferrer" className="sk-src-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, letterSpacing: '.07em', textTransform: 'uppercase', color: '#5E6A2A', background: 'rgba(255,255,255,.75)', border: '1px solid #C8D068', borderRadius: '999px', padding: '4px 10px', textDecoration: 'none' }}>
                  ↗ Open source
                </a>
              )}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={selectRemedy} className="sk-lime-btn"
                style={{ background: '#BECA5C', color: '#1A1E0A', border: '1.5px solid #8A9A40', borderRadius: '999px', padding: '11px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(190,202,92,.3)' }}>
                Select this remedy →
              </button>
              <button onClick={() => navigate('/remedies')} className="sk-out-btn"
                style={{ background: 'transparent', border: '1.5px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '11px 18px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Compare others
              </button>
            </div>
          </div>

          {/* ── COL 3: lifestyle tips ── */}
          <div className="sk-in" style={{ animationDelay: '130ms' }}>
            {advices.length > 0 ? (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid #E0DCCC', boxShadow: '0 4px 16px rgba(35,36,28,.09)' }}>
                {/* Section header */}
                <div style={{ background: 'linear-gradient(135deg,#23241C,#3A4018)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(190,202,92,.2)', border: '1px solid rgba(190,202,92,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BECA5C', flexShrink: 0 }}><SparkIcon /></div>
                  <div>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(190,202,92,.75)' }}>For you</div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 15, color: '#F6F4EC', lineHeight: 1 }}>Lifestyle Tips</div>
                  </div>
                </div>
                {/* Advice rows */}
                {advices.map((a, i) => {
                  const pal = ADVICE_PAL[i % ADVICE_PAL.length];
                  return (
                    <div key={a.tag} className="sk-advice-row"
                      style={{ padding: '11px 12px', background: '#fff', borderBottom: i < advices.length - 1 ? '1px solid #F0EDE4' : 'none', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: pal.bg, border: `1.5px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{a.icon}</div>
                      <div>
                        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 7.5, letterSpacing: '.09em', textTransform: 'uppercase', color: pal.lbl, marginBottom: 3, fontWeight: 600 }}>{a.tag.replace(/_/g,' ')}</div>
                        <p style={{ fontSize: 11.5, color: '#3a3a2a', lineHeight: 1.5, margin: 0 }}>{a.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1.5px solid #E6E3D8', borderRadius: 14, padding: '18px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C' }}>No lifestyle tips yet</div>
                <p style={{ fontSize: 12, color: '#9C9A8C', marginTop: 8, lineHeight: 1.5 }}>Complete the questionnaire to get personalised advice.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
@keyframes sk-up  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes sk-img { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
.sk-in           { animation: sk-up .3s ease both; }
.sk-img          { animation: sk-img .45s ease both; }
.sk-advice-row   { transition: background .13s; }
.sk-advice-row:hover { background: #FAFAF5 !important; }
.sk-step         { transition: background .13s, box-shadow .13s; }
.sk-step:hover   { background: #F8FAF0 !important; box-shadow: 0 4px 12px rgba(94,106,42,.1) !important; }
.sk-back         { transition: color .13s, background .13s; }
.sk-back:hover   { color: #23241C !important; background: #ECEADF !important; }
.sk-lime-btn     { transition: transform .14s, box-shadow .14s, filter .13s; }
.sk-lime-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(190,202,92,.4) !important; filter: brightness(1.06); }
.sk-out-btn      { transition: background .13s, border-color .13s, color .13s; }
.sk-out-btn:hover { background: #EEF0DC !important; border-color: #BECA5C !important; color: #3A4018 !important; }
.sk-src-link     { transition: background .13s; }
.sk-src-link:hover { background: rgba(255,255,255,.98) !important; }
@media (max-width: 860px) {
  .sk-3col { grid-template-columns: 180px 1fr !important; }
  .sk-3col > div:last-child { grid-column: 1 / -1; }
}
@media (max-width: 580px) {
  .sk-3col { grid-template-columns: 1fr !important; }
}
`;
