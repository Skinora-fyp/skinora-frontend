import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';

function ConfidenceBar({ label, value, result, delay = '1.1s' }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C' }}>{label}</span>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, marginTop: 3 }}>{result}</div>
        </div>
        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 26, color: '#5E6A2A' }}>{pct}%</span>
      </div>
      <div style={{ height: 7, background: '#ECEADF', borderRadius: 5, overflow: 'hidden' }}>
        <div className="animate-bar" style={{ height: '100%', width: `${pct}%`, background: '#BECA5C', borderRadius: 5, animationDelay: delay }} />
      </div>
    </div>
  );
}

export default function Result() {
  const navigate     = useNavigate();
  const { state }    = useApp();
  const detection    = state.detection;

  // Redirect if no detection data
  useEffect(() => { if (!detection) navigate('/upload', { replace: true }); }, [detection, navigate]);
  if (!detection) return null;

  const { skin_type, skin_conf, acne_status, acne_conf, final_condition, image_url } = detection;
  const acneLabel    = acne_status === 'Acne' ? 'Acne present' : 'No acne detected';
  const conditionParts = (final_condition ?? 'Oily_Acne').split('_');
  const skinLabel    = conditionParts[0];
  const acneTag      = conditionParts[1] === 'Acne' ? 'with acne' : 'clear skin';
  const minConf      = Math.min(skin_conf ?? 0, acne_conf ?? 0);
  const highConf     = minConf >= 0.70;

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="analyze" />

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '46px 44px', display: 'flex', flexWrap: 'wrap', gap: 42, alignItems: 'flex-start' }}>

        {/* ── Left: photo + metrics ── */}
        <div style={{ flex: '0 0 330px' }}>
          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height: 420, border: '1px solid #E6E3D8', background: '#ECEADF' }}>
            {image_url
              ? <img src={image_url} alt="Your scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(135deg,#ECEADF 0 12px,#E6E3D8 12px 24px)' }} />
            }
            {/* Region markers */}
            <div style={{ position: 'absolute', left: '24%', top: '38%', width: 40, height: 40, border: '2px solid #BECA5C', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(190,202,92,.25)' }} />
            <div style={{ position: 'absolute', left: '60%', top: '54%', width: 30, height: 30, border: '2px solid #BECA5C', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(190,202,92,.25)' }} />
            <div style={{ position: 'absolute', left: 14, bottom: 14, background: 'rgba(252,251,246,.92)', borderRadius: 9, padding: '8px 12px', fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#5E6A2A' }}>
              2 regions flagged
            </div>
          </div>

          {/* Metric tiles */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            {[
              { key: 'Hydration', val: 'Low',      color: '#C0744E' },
              { key: 'Sebum',     val: 'High',     color: '#5E6A2A' },
              { key: 'Texture',   val: 'Moderate', color: '#B08A3C' },
            ].map(({ key, val, color }) => (
              <div key={key} style={{ flex: 1, background: '#F1EEE3', borderRadius: 11, padding: 12 }}>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C' }}>{key}</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 19, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: result card ── */}
        <div style={{ flex: '1 1 420px', minWidth: 340 }}>
          {/* Confidence chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EEF0DC', borderRadius: '999px', padding: '6px 13px', marginBottom: 18 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7E9A3E', display: 'inline-block' }} />
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5E6A2A' }}>
              {highConf ? 'Analysis complete · High confidence' : 'Analysis complete · Medium confidence'}
            </span>
          </div>

          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 8 }}>Your final condition</div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(32px,4vw,46px)', letterSpacing: '-.02em', margin: '0 0 6px' }}>
            {skinLabel} skin, <span style={{ fontStyle: 'italic', color: '#8B9633' }}>{acneTag}</span>
          </h2>
          <p style={{ fontSize: 14.5, color: '#6B6A60', margin: '0 0 30px' }}>
            Condition code <span style={{ fontFamily: "'Spline Sans Mono'", color: '#5E6A2A' }}>{final_condition}</span> — fused from two independent model readings below.
          </p>

          {/* Confidence bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ConfidenceBar label="Model 1 · Skin Type"   value={skin_conf}  result={skin_type}  delay="1.1s" />
            <ConfidenceBar label="Model 2 · Acne Status" value={acne_conf}  result={acneLabel}  delay="1.3s" />
          </div>

          {/* Routing note */}
          {highConf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: 12, padding: '13px 16px', margin: '18px 0 28px', fontSize: 13, color: '#5E6A2A' }}>
              <span>✓</span> Both models ≥ 70% — routed directly to remedies. We'll still personalize with a few lifestyle questions.
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: highConf ? 0 : 28 }}>
            <button onClick={() => navigate('/questionnaire')}
              style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 28px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Personalize my remedies →
            </button>
            <button onClick={() => navigate('/consult')}
              style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              What if confidence is low?
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
