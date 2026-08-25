import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { createTracking } from '../api';
import { saveHistoryEntry } from '../context/AppContext';

function CameraIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>; }
function MailIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function ChartIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function LeafIcon()    { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c0 0 4-2 8-6s6-10 6-10-4 2-8 6-6 10-6 10z"/><path d="M22 2s-2 4-6 8"/></svg>; }
function CheckCircle() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function SparkIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

const ADVICE_PALETTE = [
  { bg: 'linear-gradient(135deg,#EEF4DC,#E4ECC8)', border: '#B8CC70', icon: '#5E6A2A', text: '#3A4818' },
  { bg: 'linear-gradient(135deg,#FFF5E0,#FDECC8)', border: '#F0CFA0', icon: '#8A6010', text: '#5C3E08' },
  { bg: 'linear-gradient(135deg,#E8F4F8,#D4EAF4)', border: '#90C8DC', icon: '#1A6680', text: '#0E4455' },
  { bg: 'linear-gradient(135deg,#F4E8F8,#EAD4F0)', border: '#C090D0', icon: '#6A2080', text: '#431255' },
  { bg: 'linear-gradient(135deg,#F8EEE4,#F0E0CC)', border: '#DCA878', icon: '#8A4820', text: '#5C2810' },
];

const FEATURES = [
  { Icon: CameraIcon, title: 'Photo comparison', desc: 'Before & after your remedy', grad: 'linear-gradient(135deg,#EEF0DC,#DDE8B8)' },
  { Icon: MailIcon,   title: 'Email reminders',  desc: "We'll nudge you to re-scan",   grad: 'linear-gradient(135deg,#E8EEF8,#D4DEF0)' },
  { Icon: ChartIcon,  title: 'AI progress report', desc: 'Improved, same, or worse?',  grad: 'linear-gradient(135deg,#F8F0E8,#F0E0CC)' },
];

export default function Track() {
  const navigate  = useNavigate();
  const { state, dispatch } = useApp();
  const remedy    = state.selectedRemedy ?? state.remedies?.[0];
  const advices   = state.advices ?? [];
  const userEmail = state.user?.email ?? 'your email';
  const condition = state.detection?.final_condition ?? '';

  const [phase,   setPhase]   = useState('ask');
  const [showModal, setShowModal] = useState(false);
  const [freq,    setFreq]    = useState('weekly');
  const [loading, setLoading] = useState(false);

  function persistHistory(enabled) {
    if (!state.user?.id) return;
    const entry = {
      id: `session-${Date.now()}`, date: new Date().toISOString(), userId: state.user.id,
      detection: state.detection ? { skin_type: state.detection.skin_type, acne_status: state.detection.acne_status, final_condition: state.detection.final_condition, skin_conf: state.detection.skin_conf, acne_conf: state.detection.acne_conf } : null,
      answers: state.answers, advices: state.advices,
      selectedRemedy: remedy ? { id: remedy.id, name: remedy.name, condition: remedy.condition } : null,
      tracking: { enabled, frequency: freq },
    };
    dispatch({ type: 'SET_HISTORY', payload: saveHistoryEntry(state.user.id, entry) });
  }

  async function confirmTracking() {
    setLoading(true);
    dispatch({ type: 'SET_TRACKING', payload: { enabled: true, frequency: freq } });
    persistHistory(true);
    try { await createTracking({ frequency: freq, remedy_id: remedy?.id }); } catch {}
    setLoading(false);
    navigate('/reminder');
  }

  function declineTracking() { persistHistory(false); setPhase('done-no'); }

  /* ── "Done" screen ── */
  if (phase === 'done-no') {
    return (
      <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
        <AppHeader activeStep="track" />
        <style>{css}</style>
        <main className="sk-in" style={{ maxWidth: 460, margin: '0 auto', padding: '56px 24px 56px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#EEF0DC,#DDE8B8)', border: '2px solid #C8D068', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#5E6A2A', boxShadow: '0 6px 20px rgba(190,202,92,.22)' }}>
            <LeafIcon />
          </div>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 10 }}>You're all set</div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 30, letterSpacing: '-.02em', margin: '0 0 12px', color: '#23241C' }}>Your remedy plan is ready.</h2>
          <p style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.65, margin: '0 auto 22px', maxWidth: 340 }}>
            <strong>{remedy?.name ?? 'Your selected remedy'}</strong> has been saved. Start today — you can enable tracking anytime from your profile.
          </p>
          <div style={{ background: 'linear-gradient(135deg,#EEF4DC,#E4ECC8)', border: '1.5px solid #C8D068', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', border: '1.5px solid #C8D068', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#5E6A2A' }}><CheckCircle /></div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3A4818' }}>Remedy saved to your profile</div>
              <div style={{ fontSize: 12, color: '#5E6A2A', marginTop: 2 }}>{remedy?.name ?? 'Selected'}{condition ? ` · ${condition.replace('_',' ')}` : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/upload')} className="sk-lime-btn" style={{ background: '#BECA5C', color: '#1A1E0A', border: '1.5px solid #8A9A40', borderRadius: '999px', padding: '12px 26px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(190,202,92,.32)' }}>Go to dashboard →</button>
            <button onClick={() => navigate('/history')} className="sk-out-btn" style={{ background: 'transparent', border: '1.5px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '12px 20px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>View history</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />
      <style>{css}</style>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 28px 52px' }}>

        {/* Remedy banner */}
        <div className="sk-in" style={{ background: 'linear-gradient(135deg,#EEF4DC,#E4ECC8)', border: '1.5px solid #C8D068', borderRadius: 14, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, boxShadow: '0 3px 12px rgba(190,202,92,.15)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', border: '1.5px solid #C8D068', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#5E6A2A' }}><CheckCircle /></div>
          <div>
            <div style={{ fontSize: 11, fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.09em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 2 }}>Remedy selected</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3A4818' }}>{remedy?.name ?? 'Your selected remedy'}</div>
          </div>
        </div>

        {/* ── Lifestyle advice — prominent ── */}
        {advices.length > 0 && (
          <div className="sk-in" style={{ marginBottom: 22, animationDelay: '60ms' }}>
            {/* Section header */}
            <div style={{ background: 'linear-gradient(135deg,#23241C,#3A4018)', borderRadius: '14px 14px 0 0', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(190,202,92,.22)', border: '1px solid rgba(190,202,92,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BECA5C' }}><SparkIcon /></div>
                <div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.13em', textTransform: 'uppercase', color: 'rgba(190,202,92,.8)', marginBottom: 1 }}>Personalised for you</div>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: 17, color: '#F6F4EC', lineHeight: 1 }}>Your Lifestyle Advice</div>
                </div>
              </div>
              <span style={{ background: 'rgba(190,202,92,.18)', border: '1px solid rgba(190,202,92,.35)', color: '#BECA5C', fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '999px' }}>
                {advices.length} tip{advices.length > 1 ? 's' : ''}
              </span>
            </div>
            {/* Advice cards */}
            <div style={{ border: '1.5px solid #E6E3D8', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
              {advices.map((advice, i) => {
                const pal = ADVICE_PALETTE[i % ADVICE_PALETTE.length];
                return (
                  <div key={advice.tag} className="sk-advice-row"
                    style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 18px', background: '#fff', borderBottom: i < advices.length - 1 ? '1px solid #F0EDE4' : 'none' }}>
                    <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: pal.bg, border: `1.5px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
                      {advice.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: pal.icon, marginBottom: 4, fontWeight: 600 }}>
                        {advice.tag.replace(/_/g, ' ')}
                      </div>
                      <p style={{ fontSize: 13.5, color: '#3a3a2a', lineHeight: 1.58, margin: 0 }}>{advice.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ Phase: ASK ══ */}
        {phase === 'ask' && (
          <div className="sk-in" style={{ animationDelay: '110ms' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#23241C', borderRadius: '999px', padding: '3px 12px', marginBottom: 11 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#BECA5C' }}>Step 6 · Progress Tracking</span>
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 32, letterSpacing: '-.02em', margin: '0 0 8px', color: '#23241C', lineHeight: 1.15 }}>
              Want to track your progress?
            </h2>
            <p style={{ fontSize: 14, color: '#6B6A60', lineHeight: 1.65, maxWidth: 460, margin: '0 0 20px' }}>
              We'll send reminders to re-scan your skin and compare photos to see whether your remedy is working.
            </p>

            <div className="sk-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
              {FEATURES.map(({ Icon, title, desc, grad }, i) => (
                <div key={title} className="sk-feature" style={{ background: grad, border: '1.5px solid #E0DCCC', borderRadius: 13, padding: '16px 14px', textAlign: 'center', boxShadow: '0 2px 10px rgba(35,36,28,.07)', animationDelay: `${130 + i * 55}ms` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.7)', border: '1.5px solid rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#4A5820', boxShadow: '0 2px 6px rgba(0,0,0,.07)' }}>
                    <Icon />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#23241C', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#7A7870', lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setShowModal(true)} className="sk-lime-btn" style={{ background: '#BECA5C', color: '#1A1E0A', border: '1.5px solid #8A9A40', borderRadius: '999px', padding: '13px 28px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14.5, cursor: 'pointer', boxShadow: '0 4px 16px rgba(190,202,92,.32)' }}>
                Yes, track my progress →
              </button>
              <button onClick={declineTracking} className="sk-out-btn" style={{ background: 'transparent', border: '1.5px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '13px 20px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                No thanks, I'm done
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ══ Frequency Modal ══ */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,30,10,.48)', backdropFilter: 'blur(4px)', zIndex: 200 }} />

          {/* Modal card */}
          <div className="sk-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, width: 'min(480px, calc(100vw - 40px))', background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(26,30,10,.28), 0 4px 16px rgba(26,30,10,.12)', overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg,#23241C,#3A4018)', padding: '20px 24px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.13em', textTransform: 'uppercase', color: 'rgba(190,202,92,.75)', marginBottom: 6 }}>Step 6 · Check-in frequency</div>
                  <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 22, color: '#F6F4EC', margin: 0, lineHeight: 1.2 }}>
                    How often would you like<br />a check-in?
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)}
                  style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F6F4EC', fontSize: 14, flexShrink: 0, marginLeft: 12 }}>
                  ✕
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: 'rgba(246,244,236,.65)', margin: '10px 0 0', lineHeight: 1.55 }}>
                Reminders sent to <strong style={{ color: 'rgba(246,244,236,.9)' }}>{userEmail}</strong>
              </p>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px 24px' }}>

              {/* Frequency options */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                {[
                  { value: 'weekly',  label: 'Weekly',  sub: 'Every 7 days',  desc: 'Best for active acne and fast-changing skin.', grad: 'linear-gradient(135deg,#F4F7E8,#EBF0D0)' },
                  { value: 'monthly', label: 'Monthly', sub: 'Every 30 days', desc: 'Gentler cadence for maintenance routines.', grad: 'linear-gradient(135deg,#F2F0FF,#E8E4F8)' },
                ].map(({ value, label, sub, desc, grad }) => {
                  const active = freq === value;
                  return (
                    <button key={value} onClick={() => setFreq(value)} className="sk-freq-btn"
                      style={{ flex: 1, borderRadius: 13, border: `2px solid ${active ? '#BECA5C' : '#E0DCCC'}`, background: active ? grad : '#FAFAF7', padding: '14px 16px', textAlign: 'left', boxShadow: active ? '0 4px 16px rgba(190,202,92,.22)' : 'none', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#23241C' }}>{label}</span>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? '#BECA5C' : '#CFCBBC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? '#BECA5C' : 'transparent', transition: 'all .15s' }}>
                          {active && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1A1E0A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 8.5, color: active ? '#6E8020' : '#9AA646', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>{sub}</div>
                      <p style={{ fontSize: 12, color: '#6B6A60', lineHeight: 1.45, margin: 0 }}>{desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Email summary */}
              <div style={{ background: 'linear-gradient(135deg,#EEF4DC,#E4ECC8)', border: '1.5px solid #C8D068', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: '1.5px solid #C8D068', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#5E6A2A' }}><MailIcon /></div>
                <div>
                  <div style={{ fontSize: 13, color: '#3A4818', fontWeight: 700 }}>First reminder in {freq === 'weekly' ? '7 days' : '30 days'}</div>
                  <div style={{ fontSize: 11.5, color: '#6E8020', marginTop: 1 }}>Pause or change anytime from your profile</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={confirmTracking} disabled={loading} className="sk-lime-btn"
                  style={{ flex: 1, background: loading ? '#D8DC9A' : '#BECA5C', color: '#1A1E0A', border: '1.5px solid #8A9A40', borderRadius: '999px', padding: '13px 20px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', boxShadow: '0 4px 16px rgba(190,202,92,.3)', opacity: loading ? 0.8 : 1 }}>
                  {loading ? 'Setting up…' : `Confirm — ${freq === 'weekly' ? 'every week' : 'every month'} →`}
                </button>
                <button onClick={() => setShowModal(false)} className="sk-out-btn"
                  style={{ background: 'transparent', border: '1.5px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '13px 18px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
@keyframes sk-up     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes sk-modal  { from{opacity:0;transform:translate(-50%,-46%)} to{opacity:1;transform:translate(-50%,-50%)} }
.sk-modal  { animation: sk-modal .22s cubic-bezier(.34,1.56,.64,1) both; }
.sk-in             { animation: sk-up .3s ease both; }
.sk-advice-row     { transition: background .15s; }
.sk-advice-row:hover { background: #FAFAF5 !important; }
.sk-feature        { transition: transform .15s, box-shadow .15s; }
.sk-feature:hover  { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(94,106,42,.14) !important; }
.sk-freq-btn       { transition: border-color .15s, box-shadow .15s; }
.sk-freq-btn:hover { border-color: #BECA5C !important; }
.sk-lime-btn       { transition: transform .14s, box-shadow .14s, filter .13s; }
.sk-lime-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(190,202,92,.42) !important; filter: brightness(1.06); }
.sk-out-btn        { transition: background .13s, border-color .13s, color .13s; }
.sk-out-btn:hover  { background: #EEF0DC !important; border-color: #BECA5C !important; color: #3A4018 !important; }
@media (max-width:600px) {
  .sk-features { grid-template-columns: 1fr !important; }
  .sk-freq-row { flex-direction: column !important; }
}
`;
