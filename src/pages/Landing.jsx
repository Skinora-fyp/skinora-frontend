import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { STRIP_ITEMS } from '../data/remedies';

const PROCESS_STEPS = [
  { n: '01', title: 'Secure Identity',     body: 'Sign in with Google. Your data stays encrypted and private.' },
  { n: '02', title: 'Dermal Capture',      body: 'Upload a clear, naturally-lit selfie. Live guidelines on screen.' },
  { n: '03', title: 'AI Classification',   body: 'Two models read skin type & acne grade with confidence in seconds.' },
  { n: '04', title: 'Lifestyle Context',   body: 'A short questionnaire: sleep, diet, climate, hydration, stress.' },
  { n: '05', title: 'Botanical Remedies',  body: 'Three personalized remedies with usage guides and trusted sources.' },
  { n: '06', title: 'Progress Tracking',   body: 'Weekly or monthly check-ins. Our model compares scans and adapts.' },
];

export default function Landing() {
  const navigate    = useNavigate();
  const processRef  = useRef(null);
  const stripItems  = [...STRIP_ITEMS, ...STRIP_ITEMS]; // duplicate for seamless loop

  const scrollToProcess = () =>
    processRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={{ background: '#F6F4EC', fontFamily: "'Hanken Grotesk',sans-serif", color: '#20201B' }}>

      {/* ── Landing Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 56px', borderBottom: '1px solid #E6E3D8',
        background: 'rgba(246,244,236,.85)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="/assets/skinora_logo.png" alt="Skinora" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={{ fontFamily: "'Newsreader',serif", fontSize: 21, letterSpacing: '-.01em' }}>Skinora</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <button onClick={scrollToProcess}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Spline Sans Mono',monospace", fontSize: 12, letterSpacing: '.08em', color: '#6B6A60' }}>
            The Science
          </button>
          <button onClick={() => navigate('/login')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '11px 22px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center', justifyContent: 'space-between', padding: '70px 56px 56px', maxWidth: 1320, margin: '0 auto' }}>

        {/* Left: copy */}
        <div style={{ flex: '1 1 480px', minWidth: 340, animation: 'sk-fadeup .7s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #DAD6C7', borderRadius: '999px', padding: '6px 13px', marginBottom: 30 }}>
            <span style={{ color: '#9AA646' }}>✦</span>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#7A7A6C' }}>AI Dermal Intelligence</span>
          </div>

          <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 'clamp(42px,5vw,62px)', lineHeight: 1.01, letterSpacing: '-.02em', margin: '0 0 26px' }}>
            Your reflection,<br />
            <span style={{ color: '#8B9633', fontStyle: 'italic' }}>refined</span> by botanical intelligence.
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.65, color: '#6B6A60', maxWidth: 430, margin: '0 0 34px' }}>
            An adaptive diagnostic mirror that reads your unique dermal profile from a single photo, prescribes living remedies from the earth — then tracks your progress over time.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 46, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '14px 26px', fontWeight: 600, fontSize: 15, fontFamily: "'Hanken Grotesk'", cursor: 'pointer', boxShadow: '0 6px 18px rgba(190,202,92,.35)' }}>
              Analyze My Skin
            </button>
            <button onClick={scrollToProcess}
              style={{ background: 'transparent', border: '1px solid #D5D1C2', color: '#20201B', borderRadius: '999px', padding: '14px 26px', fontWeight: 600, fontSize: 15, fontFamily: "'Hanken Grotesk'", cursor: 'pointer' }}>
              How it Works
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {[
              { num: '98%', label: 'Classification\naccuracy' },
              { num: '120+', label: 'Botanical\nremedies' },
              { num: '4 wk', label: 'Avg. visible\nresult' },
            ].map(({ num, label }) => (
              <div key={num}>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 30 }}>{num}</div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginTop: 5, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mirror */}
        <div style={{ flex: '0 0 auto', width: 380, animation: 'sk-fadeup .9s ease both' }}>
          <div style={{ position: 'relative', width: 380, height: 480, borderRadius: 18, overflow: 'hidden', border: '1px solid #E6E3D8', boxShadow: '0 30px 60px -28px rgba(60,55,30,.4)', background: '#E9E6DA' }}>

            {/* Video layer */}
            <video
              src="/assets/gif1.mp4"
              autoPlay loop muted playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Gradient gloss */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '54%', background: 'linear-gradient(180deg,rgba(255,255,255,.18),transparent)', pointerEvents: 'none' }} />

            {/* MIRROR ACTIVE indicator */}
            <div style={{ position: 'absolute', left: 14, top: 14, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#BECA5C', animation: 'sk-pulsedot 1.6s infinite', display: 'inline-block' }} />
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.12em', color: '#fff', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>Mirror Active</span>
            </div>

            {/* Live scan card */}
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, background: 'rgba(252,251,246,.92)', backdropFilter: 'blur(6px)', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
              <div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9AA646' }}>Live Scan</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 18, marginTop: 2 }}>94% Clarity</div>
              </div>
              {/* Mini bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
                {[40, 70, 55, 100].map((h, i) => (
                  <span key={i} style={{ width: 4, height: `${h}%`, background: i === 3 ? '#8B9633' : '#BECA5C', borderRadius: 2, display: 'inline-block' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Archive divider ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 56px', borderTop: '1px solid #E6E3D8', borderBottom: '1px solid #E6E3D8' }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9AA646' }}>What we observe &amp; how we heal</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C9A8C' }}>Live Archive →</span>
      </div>

      {/* ── Auto-scrolling strip ── */}
      <div style={{ overflow: 'hidden', padding: '26px 0', background: '#F1EEE3' }}>
        <div style={{ display: 'flex', gap: 18, width: 'max-content', animation: 'sk-marquee 34s linear infinite' }}>
          {stripItems.map((item, i) => (
            <div key={i} style={{ flex: '0 0 auto', width: 190, height: 148, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,.05)' }}>
              <img
                src={item.image}
                alt={item.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = item.tint; }}
              />
              <div style={{ position: 'absolute', left: 10, bottom: 10, right: 10, fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#3a3a30', background: 'rgba(252,251,246,.85)', padding: '5px 8px', borderRadius: 6 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Process section ── */}
      <section ref={processRef} style={{ padding: '84px 56px', maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 16 }}>The Process</div>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 44, letterSpacing: '-.02em', margin: '0 0 14px' }}>The journey to restoration.</h2>
        <p style={{ color: '#6B6A60', fontSize: 16, maxWidth: 440, margin: '0 0 44px', lineHeight: 1.65 }}>
          Six guided steps — from a single photograph to a sustained, botanical-led skin protocol.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
          {PROCESS_STEPS.map((step) => (
            <div key={step.n} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '26px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "'Newsreader',serif", fontSize: 30, color: '#C9C5B4' }}>{step.n}</span>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#EEF0DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />
                </span>
              </div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 21, margin: '14px 0 8px' }}>{step.title}</div>
              <p style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.6, margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 52 }}>
          <button onClick={() => navigate('/login')}
            style={{ background: '#23241C', color: '#F6F4EC', border: 'none', borderRadius: '999px', padding: '16px 34px', fontWeight: 600, fontSize: 15, fontFamily: "'Hanken Grotesk'", cursor: 'pointer' }}>
            Begin your analysis →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', padding: '30px 56px', borderTop: '1px solid #E6E3D8' }}>
        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#8B9633' }}>Skinora</span>
        <span style={{ fontSize: 12, color: '#9C9A8C' }}>© 2026 Skinora Botanical Labs · Natural beauty, scientifically verified.</span>
        <div style={{ display: 'flex', gap: 20, fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.06em', color: '#9C9A8C' }}>
          <span style={{ cursor: 'pointer' }}>Privacy</span>
          <span style={{ cursor: 'pointer' }}>Terms</span>
          <span style={{ cursor: 'pointer' }}>Medical Disclaimer</span>
        </div>
      </footer>
    </div>
  );
}
