import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const DO_ITEMS   = ['Use soft, natural daylight facing a window', 'Face the camera straight on, centred', 'Remove glasses and pull hair off your face'];
const AVOID_ITEMS = ['Blurry or motion shots — hold steady', 'Heavy makeup, filters or beauty modes', 'Harsh shadows, backlight or dim rooms'];

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="capture" />

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '50px 44px' }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 14 }}>
          Step 02 · Dermal Capture
        </div>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.02em', margin: '0 0 10px' }}>
          A clear photo means a precise reading.
        </h2>
        <p style={{ fontSize: 15.5, color: '#6B6A60', maxWidth: 560, margin: '0 0 38px', lineHeight: 1.65 }}>
          Our two models analyse fine texture, tone and sebum. Follow these quick guidelines so the AI sees exactly what you see in the mirror.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'flex-start' }}>
          {/* Do / Avoid lists */}
          <div style={{ flex: '1 1 460px' }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 14 }}>✓ Do this</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
              {DO_ITEMS.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 13, alignItems: 'center', background: '#fff', border: '1px solid #E6E3D8', borderRadius: 12, padding: '15px 18px' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#EEF0DC', color: '#5E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14.5 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C0744E', marginBottom: 14 }}>✗ Avoid</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AVOID_ITEMS.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 13, alignItems: 'center', background: '#fff', border: '1px solid #E6E3D8', borderRadius: 12, padding: '15px 18px' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#F7E5DC', color: '#B05E3C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: 14.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference card */}
          <div style={{ flex: '0 0 320px' }}>
            <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, padding: 18 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>Reference</div>

              {/* Good example */}
              <div style={{ position: 'relative', borderRadius: 11, overflow: 'hidden', height: 200, background: 'repeating-linear-gradient(135deg,#D7E0B0 0 12px,#C9D49E 12px 24px)', marginBottom: 8 }}>
                <img src="/assets/remedi1.jfif" alt="Good" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <span style={{ position: 'absolute', top: 10, left: 10, background: '#7E9A3E', color: '#fff', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', padding: '4px 9px', borderRadius: 6 }}>
                  ✓ GOOD · CLEAR &amp; LIT
                </span>
              </div>

              {/* Poor example */}
              <div style={{ position: 'relative', borderRadius: 11, overflow: 'hidden', height: 120, background: 'repeating-linear-gradient(135deg,#B9B2A0 0 12px,#A89F8C 12px 24px)' }}>
                <img src="/assets/remedi2.jfif" alt="Poor" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2.5px)' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <span style={{ position: 'absolute', top: 10, left: 10, background: '#C0744E', color: '#fff', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', padding: '4px 9px', borderRadius: 6 }}>
                  ✗ POOR · BLURRED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 40 }}>
          <button onClick={() => navigate('/upload')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 30px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            I'm ready — continue
          </button>
          <span style={{ fontSize: 13, color: '#9C9A8C' }}>Takes about 20 seconds</span>
        </div>
      </main>
    </div>
  );
}
