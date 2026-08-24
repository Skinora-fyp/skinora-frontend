import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const DO_ITEMS = [
  { title: 'Natural daylight', desc: 'Face a window in soft, diffused light — avoid direct sun' },
  { title: 'Straight-on angle', desc: 'Camera at eye level, face centred and filling the frame' },
  { title: 'Bare face', desc: 'Remove glasses, tie hair back, no makeup or filters' },
];

const AVOID_ITEMS = [
  { title: 'Motion blur', desc: 'Hold completely steady — even slight movement ruins texture data' },
  { title: 'Filters & makeup', desc: 'Coverage hides the skin signals our AI needs to read' },
  { title: 'Poor lighting', desc: 'Backlight, harsh shadows or dim rooms will skew the reading' },
];

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="capture" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
        .sk-do-card    { transition: transform .18s, box-shadow .18s; }
        .sk-do-card:hover    { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(94,106,42,.12) !important; }
        .sk-avoid-card { transition: transform .18s, box-shadow .18s; }
        .sk-avoid-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(176,94,60,.10) !important; }
        .sk-cta-btn { transition: transform .16s, box-shadow .16s, filter .14s; }
        .sk-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(190,202,92,.38) !important; filter: brightness(1.04); }
      `}</style>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 44px 64px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(190,202,92,.18)', border: '1px solid rgba(190,202,92,.45)', borderRadius: '999px', padding: '5px 14px', marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7E9A3E', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5E6A2A' }}>
              Step 1 · Photo Capture
            </span>
          </div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 42, letterSpacing: '-.025em', margin: '0 0 12px', lineHeight: 1.1, color: '#23241C' }}>
            A clear photo means<br />a precise reading.
          </h2>
          <p style={{ fontSize: 15.5, color: '#6B6A60', maxWidth: 520, margin: 0, lineHeight: 1.65 }}>
            Our dual-model AI analyses fine texture, tone and sebum distribution. Two minutes of preparation leads to far more accurate results.
          </p>
        </div>

        {/* ── Body: two columns ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 36, alignItems: 'start' }}>

          {/* ── Left: checklists + CTA ── */}
          <div>
            {/* DO */}
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7E9A3E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 12, lineHeight: 1, fontWeight: 700 }}>✓</span>
                </div>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7E9A3E', fontWeight: 500 }}>Do this</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DO_ITEMS.map((item) => (
                  <div key={item.title} className="sk-do-card"
                    style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#fff', borderLeft: '3.5px solid #BECA5C', border: '1.5px solid #E6E3D8', borderLeftWidth: 3.5, borderLeftColor: '#BECA5C', borderRadius: 13, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: '#23241C', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 13.5, color: '#7A7870', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EEF0DC', border: '1.5px solid #BECA5C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#5E6A2A', fontSize: 11, lineHeight: 1 }}>✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AVOID */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C0744E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 12, lineHeight: 1, fontWeight: 700 }}>✗</span>
                </div>
                <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C0744E', fontWeight: 500 }}>Avoid</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AVOID_ITEMS.map((item) => (
                  <div key={item.title} className="sk-avoid-card"
                    style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#fff', border: '1.5px solid #E6E3D8', borderLeftWidth: 3.5, borderLeftColor: '#E8A86C', borderRadius: 13, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: '#23241C', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 13.5, color: '#7A7870', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F7E5DC', border: '1.5px solid #E8A86C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#B05E3C', fontSize: 11, lineHeight: 1 }}>✗</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => navigate('/upload')} className="sk-cta-btn"
                style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 34px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15.5, cursor: 'pointer', boxShadow: '0 4px 18px rgba(190,202,92,.32)' }}>
                I'm ready — take photo →
              </button>
              <span style={{ fontSize: 13, color: '#9C9A8C' }}>Takes about 20 seconds</span>
            </div>
          </div>

          {/* ── Right: both images always visible ── */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>
              Reference · Photo quality
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Clear / Good */}
              <div style={{ borderRadius: 14, overflow: 'hidden', background: '#E8EDD8', boxShadow: '0 8px 28px rgba(35,36,28,.12)', border: '1.5px solid #D4DEB8' }}>
                <div style={{ position: 'relative', height: 220 }}>
                  <img
                    src="/assets/clear_face.jfif"
                    alt="Clear, well-lit face"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(45,64,18,.82)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: '999px', padding: '4px 10px', fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.09em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.18)' }}>
                    ✓ Clear
                  </div>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #EEF0DC' }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: '#3A5E1A', marginBottom: 2 }}>Good to go</div>
                  <div style={{ fontSize: 11.5, color: '#7A7870', lineHeight: 1.5 }}>Soft light, straight angle, bare skin</div>
                </div>
              </div>

              {/* Blurred / Poor */}
              <div style={{ borderRadius: 14, overflow: 'hidden', background: '#E8E4DC', boxShadow: '0 8px 28px rgba(35,36,28,.12)', border: '1.5px solid #D8CEBC' }}>
                <div style={{ position: 'relative', height: 220 }}>
                  <img
                    src="/assets/clear_face.jfif"
                    alt="Blurred face — unusable"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', filter: 'blur(4.5px)', transform: 'scale(1.05)' }}
                  />
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(120,48,24,.82)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: '999px', padding: '4px 10px', fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.09em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.18)' }}>
                    ✗ Blurred
                  </div>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #F0E8E0' }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: '#B05E3C', marginBottom: 2 }}>Will be rejected</div>
                  <div style={{ fontSize: 11.5, color: '#7A7870', lineHeight: 1.5 }}>Motion blur — hold steady &amp; retake</div>
                </div>
              </div>
            </div>

            {/* Tip strip */}
            <div style={{ marginTop: 14, background: 'linear-gradient(135deg,#EEF0DC,#E4E8CC)', border: '1px solid rgba(190,202,92,.4)', borderRadius: 13, padding: '13px 16px' }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 5, fontWeight: 500 }}>Capture tip</div>
              <div style={{ fontSize: 13, color: '#4A4E2E', lineHeight: 1.6 }}>
                Front-camera selfie mode, 30–50 cm away. No zoom. Neutral expression. Natural window light beats any ring light.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
