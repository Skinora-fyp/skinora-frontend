import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';

function ConfidenceBar({ label, value, result, delay = '1.1s' }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C' }}>{label}</span>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, marginTop: 2 }}>{result}</div>
        </div>
        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 24, color: '#5E6A2A' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#ECEADF', borderRadius: 5, overflow: 'hidden' }}>
        <div className="animate-bar" style={{ height: '100%', width: `${pct}%`, background: '#BECA5C', borderRadius: 5, animationDelay: delay }} />
      </div>
    </div>
  );
}

const VALIDATION_STYLES = {
  'Strongly Supports Prediction':   { bg: '#F0FAF0', border: '#A8D5A2', dot: '#2E7D32', label: '✓ Strongly Supports Prediction' },
  'Moderately Supports Prediction': { bg: '#FFF8E6', border: '#F0DFA0', dot: '#B8860B', label: '◐ Moderately Supports Prediction' },
  'Weakly Supports Prediction':     { bg: '#FFF0F0', border: '#F5C6C2', dot: '#C0392B', label: '✗ Weakly Supports Prediction' },
};

export default function Result() {
  const navigate  = useNavigate();
  const { state } = useApp();
  const detection         = state.detection;
  const validationStatus  = state.validationStatus;
  const validationScore   = state.validationScore;
  const advices           = state.advices ?? [];
  const routing           = state.routing ?? 'direct';

  useEffect(() => { if (!detection) navigate('/upload', { replace: true }); }, [detection, navigate]);
  if (!detection) return null;

  const { skin_type, skin_conf, acne_status, acne_conf, final_condition, image_url } = detection;
  const acneLabel     = acne_status === 'Acne' ? 'Acne present' : 'No acne detected';
  const conditionParts = (final_condition ?? 'Normal_NoAcne').split('_');
  const skinLabel     = conditionParts[0];
  const acneTag       = conditionParts[1] === 'Acne' ? 'with acne' : 'clear skin';
  const minConf       = Math.min(skin_conf ?? 0, acne_conf ?? 0);
  const confPct       = Math.round(minConf * 100);
  const isMedium      = routing === 'questionnaire';
  const hasValidation = validationStatus !== null;
  const vs            = VALIDATION_STYLES[validationStatus] ?? null;

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="analyze" />

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '46px 44px', display: 'flex', flexWrap: 'wrap', gap: 42, alignItems: 'flex-start' }}>

        {/* ── Left: photo ── */}
        <div style={{ flex: '0 0 300px' }}>
          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height: 380, border: '1px solid #E6E3D8', background: '#ECEADF' }}>
            {image_url
              ? <img src={image_url} alt="Your scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(135deg,#ECEADF 0 12px,#E6E3D8 12px 24px)' }} />
            }
            <div style={{ position: 'absolute', left: '24%', top: '38%', width: 38, height: 38, border: '2px solid #BECA5C', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(190,202,92,.25)' }} />
            <div style={{ position: 'absolute', left: '60%', top: '54%', width: 28, height: 28, border: '2px solid #BECA5C', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(190,202,92,.25)' }} />
            <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(252,251,246,.92)', borderRadius: 8, padding: '6px 10px', fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#5E6A2A' }}>
              AI analysis complete
            </div>
          </div>

          {/* Condition code tile */}
          <div style={{ marginTop: 12, background: '#F1EEE3', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C' }}>Final condition</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 15, color: '#5E6A2A', marginTop: 3 }}>{final_condition}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C' }}>Min confidence</div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#5E6A2A' }}>{confPct}%</div>
            </div>
          </div>
        </div>

        {/* ── Right: result detail ── */}
        <div style={{ flex: '1 1 400px', minWidth: 320 }}>

          {/* Confidence routing chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: isMedium ? '#FFF8E6' : '#EEF0DC', border: `1px solid ${isMedium ? '#F0DFA0' : '#D9DEB8'}`, borderRadius: '999px', padding: '6px 13px', marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isMedium ? '#B8860B' : '#7E9A3E', display: 'inline-block' }} />
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: isMedium ? '#7A5C00' : '#5E6A2A' }}>
              {isMedium ? `Medium confidence · ${confPct}% · Questionnaire validated` : `High confidence · ${confPct}% · Direct routing`}
            </span>
          </div>

          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 7 }}>Your final condition</div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-.02em', margin: '0 0 6px' }}>
            {skinLabel} skin, <span style={{ fontStyle: 'italic', color: '#8B9633' }}>{acneTag}</span>
          </h2>
          <p style={{ fontSize: 14, color: '#6B6A60', margin: '0 0 22px' }}>
            Condition <span style={{ fontFamily: "'Spline Sans Mono'", color: '#5E6A2A' }}>{final_condition}</span> — fused from two independent model readings.
          </p>

          {/* Confidence bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
            <ConfidenceBar label="Model 1 · Skin Type"   value={skin_conf}  result={skin_type}  delay="1.1s" />
            <ConfidenceBar label="Model 2 · Acne Status" value={acne_conf}  result={acneLabel}  delay="1.3s" />
          </div>

          {/* ── Questionnaire Validation Panel ── */}
          {hasValidation && vs && (
            <div style={{ background: vs.bg, border: `1px solid ${vs.border}`, borderRadius: 13, padding: '16px 18px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: vs.dot, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: vs.dot, fontWeight: 700 }}>
                  Questionnaire Validation
                </span>
              </div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#2C2C25', marginBottom: 6 }}>
                {vs.label}
              </div>
              <div style={{ fontSize: 12.5, color: '#6B6A60', lineHeight: 1.6 }}>
                Validation score: <strong>{validationScore}/6</strong>. Your self-reported answers were compared against the AI-predicted condition.
                {' '}<strong>The AI prediction remains the primary result</strong> — remedies are always based on <em>{final_condition}</em>.
              </div>
            </div>
          )}

          {/* ── CTA Buttons ── */}
          <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap', marginBottom: hasValidation || advices.length > 0 ? 0 : 28 }}>
            {hasValidation ? (
              <button onClick={() => navigate('/remedies')}
                style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 28px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                View my remedies →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/questionnaire')}
                  style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '15px 28px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                  Personalize my remedies →
                </button>
                <button onClick={() => navigate('/remedies')}
                  style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '15px 22px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Skip to remedies
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Lifestyle Advice Section ── */}
      {advices.length > 0 && (
        <section style={{ background: '#F1EEE3', borderTop: '1px solid #E6E3D8', padding: '40px 44px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>Personalised Lifestyle Advice</div>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 28, margin: '0 0 24px', letterSpacing: '-.01em' }}>
              Based on your questionnaire answers.
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {advices.map((a, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{a.icon}</span>
                  <p style={{ fontSize: 13.5, color: '#4F4E45', lineHeight: 1.6, margin: 0 }}>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Medical Disclaimer ── */}
      <footer style={{ background: '#ECEADF', borderTop: '1px solid #E0DCCC', padding: '28px 44px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, color: '#9C9A8C' }}>⚕️</span>
          <p style={{ fontSize: 12, color: '#9C9A8C', lineHeight: 1.7, margin: 0 }}>
            <strong>Medical Disclaimer:</strong> The information and recommendations provided by Skinora are for educational purposes only and are not intended to diagnose, treat, cure, or prevent any medical condition. Skinora uses AI-based analysis to provide general skin insights and natural remedy suggestions. These results should not replace professional medical advice, diagnosis, or treatment. If you experience severe, persistent, or worsening skin symptoms, please consult a qualified dermatologist or healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
