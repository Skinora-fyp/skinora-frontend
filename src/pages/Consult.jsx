import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';

export default function Consult() {
  const navigate  = useNavigate();
  const { state } = useApp();
  const detection = state.detection;

  const skinConf  = Math.round((detection?.skin_conf  ?? 0.32) * 100);
  const acneConf  = Math.round((detection?.acne_conf  ?? 0.28) * 100);

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="analyze" consultMode />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '60px 44px', textAlign: 'center' }}>
        {/* Warning icon */}
        <div style={{ width: 78, height: 78, borderRadius: '50%', background: '#FBEFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 26px', fontSize: 32 }}>⚠</div>

        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#C0744E', marginBottom: 14 }}>
          Low confidence · No remedies shown
        </div>

        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.02em', margin: '0 0 14px' }}>
          We couldn't read this photo clearly.
        </h2>

        <p style={{ fontSize: 15.5, color: '#6B6A60', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 30px' }}>
          Both models returned under 40% confidence. A low score means the <em>image</em> was unclear — not that your skin is healthy. We won't guess. Please retake your photo, or speak with a professional.
        </p>

        {/* Low confidence bars */}
        <div style={{ display: 'flex', gap: 14, maxWidth: 520, margin: '0 auto 34px' }}>
          {[
            { label: 'Skin Type', conf: skinConf },
            { label: 'Acne',      conf: acneConf },
          ].map(({ label, conf }) => (
            <div key={label} style={{ flex: 1, background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C' }}>{label}</span>
                <span style={{ fontFamily: "'Newsreader',serif", color: '#C0744E' }}>{conf}%</span>
              </div>
              <div style={{ height: 6, background: '#F2EDE6', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${conf}%`, background: '#D89A7E', borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/guidelines')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 28px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            ↻ Retake my photo
          </button>
          <button style={{ background: '#23241C', color: '#F6F4EC', border: 'none', borderRadius: '999px', padding: '15px 28px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Find a dermatologist →
          </button>
        </div>

        {/* Medical disclaimer */}
        <div style={{ marginTop: 40, background: '#FBEFE8', borderRadius: 14, padding: '18px 22px', textAlign: 'left', display: 'flex', gap: 13, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          <span style={{ color: '#C0744E', fontSize: 18 }}>♡</span>
          <p style={{ margin: 0, fontSize: 13, color: '#9E6347', lineHeight: 1.6 }}>
            Skinora supports your skin journey but is not a substitute for medical diagnosis. For persistent or severe conditions, always consult a licensed professional.
          </p>
        </div>
      </main>
    </div>
  );
}
