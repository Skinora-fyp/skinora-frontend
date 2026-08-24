import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import {
  getQuestions, calculateValidationScore,
  generateAdvices, summariseLifestyle,
} from '../data/questions';
import { submitAnswers } from '../api';

export default function Questionnaire() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const detection   = state.detection  ?? {};
  const routing     = state.routing    ?? 'direct';
  const skin_type   = detection.skin_type   ?? 'Normal';
  const acne_status = detection.acne_status ?? 'NoAcne';
  const minConf     = Math.min(detection.skin_conf ?? 0, detection.acne_conf ?? 0);
  const isMedium    = routing === 'questionnaire';

  const questions    = getQuestions(skin_type);
  const lifestyleQs  = questions.filter(q => q.group === 'lifestyle');
  const validationQs = questions.filter(q => q.group === 'validation');

  const [answers, setAnswers] = useState(state.answers ?? {});

  const totalQ   = questions.length;
  const answered = Object.keys(answers).filter(k => questions.find(q => q.key === k)).length;
  const progress = Math.round((answered / totalQ) * 100);

  function pick(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const advices    = generateAdvices(answers);
    const lifestyle  = summariseLifestyle(answers);
    const validation = calculateValidationScore(answers, skin_type, acne_status);

    dispatch({ type: 'SET_ANSWERS',    payload: answers });
    dispatch({ type: 'SET_LIFESTYLE',  payload: lifestyle });
    dispatch({ type: 'SET_ADVICES',    payload: advices });
    dispatch({ type: 'SET_VALIDATION', payload: { score: validation.score, status: validation.status } });

    try {
      await submitAnswers({ answers, detection_id: detection.detection_id, skin_type, acne_status });
    } catch { /* continue if API unavailable */ }

    navigate(isMedium ? '/result' : '/remedies');
  }

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="personalize" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

        @keyframes sk-card-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .sk-q-card { animation: sk-card-in .32s ease both; }

        .sk-opt-btn { transition: all .15s; position: relative; cursor: pointer; }
        .sk-opt-btn:not(.active):hover { border-color: #BECA5C !important; background: #F8FAF0 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(94,106,42,.12); }

        .sk-submit-btn { transition: transform .16s, box-shadow .16s, filter .14s; }
        .sk-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(190,202,92,.4) !important; filter: brightness(1.05); }

        @media (max-width: 860px) {
          .sk-q-layout { grid-template-columns: 1fr !important; }
          .sk-q-sidebar { display: none !important; }
          .sk-q-main { padding: 28px 20px 48px !important; }
        }
      `}</style>

      <div className="sk-q-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 80px)', alignItems: 'stretch' }}>

        {/* ── Left: questions ── */}
        <div className="sk-q-main" style={{ padding: '38px 52px 60px', borderRight: '1px solid #E0DCCC' }}>

          {/* Step badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#23241C', borderRadius: '999px', padding: '4px 13px', marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BECA5C', display: 'inline-block' }} />
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#BECA5C' }}>
              {isMedium ? 'Step 3 · Validation & Lifestyle' : 'Step 4 · Lifestyle Context'}
            </span>
          </div>

          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 36, letterSpacing: '-.02em', margin: '0 0 8px', color: '#23241C', lineHeight: 1.15 }}>
            {isMedium ? 'Help us validate your result.' : 'A few details to tailor your remedies.'}
          </h2>
          <p style={{ fontSize: 14.5, color: '#6B6A60', margin: '0 0 24px', maxWidth: 500, lineHeight: 1.65 }}>
            {isMedium
              ? 'Your answers are compared with the AI prediction to generate a validation score. Remedies are always based on the AI result.'
              : 'Your answers generate personalised lifestyle advice shown alongside your remedies.'}
          </p>

          {/* Medium-confidence banner */}
          {isMedium && (
            <div style={{ background: '#FFF8E6', border: '1.5px solid #F0DFA0', borderLeft: '4px solid #F0C040', borderRadius: 13, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#F5E58A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A5C00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#7A5C00', marginBottom: 3 }}>Moderate AI Confidence — Validation Required</div>
                <div style={{ fontSize: 12.5, color: '#8A6A10', lineHeight: 1.6 }}>
                  Detected <strong>{skin_type} skin {acne_status === 'Acne' ? 'with acne' : 'without acne'}</strong> at{' '}
                  <strong>{Math.round(minConf * 100)}% confidence</strong>. Answer below to validate and personalise your results.
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C' }}>Progress</span>
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, color: progress === 100 ? '#5E6A2A' : '#9C9A8C', fontWeight: 500 }}>
                {answered}/{totalQ} answered {progress === 100 ? '· Ready' : ''}
              </span>
            </div>
            <div style={{ height: 8, background: '#E4E1D4', borderRadius: 999, overflow: 'hidden', border: '1px solid #D8D4C4' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#7E9A3E' : '#BECA5C', borderRadius: 999, transition: 'width .35s ease, background .3s' }} />
            </div>
          </div>

          {/* ── Section 1: Lifestyle ── */}
          <SectionBanner number="1" label="Lifestyle" color="#5E6A2A" bg="#EEF0DC" border="#C8D068"
            desc="These answers generate personalised advice about your daily habits and skin health." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
            {lifestyleQs.map((q, i) => (
              <QuestionCard key={q.key} q={q} qi={i} answers={answers} pick={pick} delay={i * 60} />
            ))}
          </div>

          {/* ── Section 2: Validation ── */}
          <SectionBanner number="2" label="AI Prediction Validation" color="#7A5C00" bg="#FFF8E6" border="#F0DFA0"
            desc={`Compare your experience with the AI's prediction: ${skin_type} skin${acne_status === 'Acne' ? ' with acne' : ' without acne'}.`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {validationQs.map((q, i) => (
              <QuestionCard key={q.key} q={q} qi={lifestyleQs.length + i} answers={answers} pick={pick} delay={i * 60} />
            ))}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 36 }}>
            <button
              onClick={handleSubmit}
              disabled={answered < totalQ}
              className="sk-submit-btn"
              style={{
                background: answered >= totalQ ? '#BECA5C' : '#ECEADF',
                color:      answered >= totalQ ? '#1A1E0A' : '#A8A698',
                border: answered >= totalQ ? '1.5px solid #8A9A40' : '1.5px solid #D4D0C4',
                borderRadius: '999px', padding: '15px 34px',
                fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15,
                cursor: answered < totalQ ? 'not-allowed' : 'pointer',
                boxShadow: answered >= totalQ ? '0 4px 18px rgba(190,202,92,.3)' : 'none',
                transition: 'all .2s',
              }}
            >
              {isMedium ? 'View my results →' : 'Generate my remedies →'}
            </button>
            <span style={{ fontSize: 13, color: answered >= totalQ ? '#5E6A2A' : '#9C9A8C', fontWeight: answered >= totalQ ? 600 : 400 }}>
              {answered < totalQ
                ? `${totalQ - answered} question${totalQ - answered > 1 ? 's' : ''} remaining`
                : 'All answered — ready to go'}
            </span>
          </div>
        </div>

        {/* ── Right: sticky image panel ── */}
        <div className="sk-q-sidebar" style={{ position: 'relative', background: '#F0F2E8' }}>
          <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Background image at very low opacity */}
            <img
              src="/assets/questionnaire.jfif"
              alt=""
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.72 }}
            />

            {/* Light gradient overlay — ash/white tint */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(240,242,232,.18) 0%, rgba(240,242,232,.08) 50%, rgba(240,242,232,.22) 100%)' }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 24px' }}>

              {/* Top: skin detection summary */}
              <div style={{ background: 'rgba(255,255,255,.72)', border: '1.5px solid #D4DEB8', borderRadius: 14, padding: '16px 18px', marginBottom: 'auto', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.13em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 10 }}>AI Detection</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Skin type', value: skin_type },
                    { label: 'Acne status', value: acne_status === 'Acne' ? 'Present' : 'Clear' },
                    { label: 'Confidence', value: `${Math.round(minConf * 100)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#8A887C' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#4A5820' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Middle: circular progress */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0' }}>
                <CircularProgress progress={progress} answered={answered} totalQ={totalQ} />
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 17, color: '#3A4018', textAlign: 'center', lineHeight: 1.3 }}>
                  {progress === 100 ? 'All done!' : progress > 50 ? 'Almost there…' : 'Keep going…'}
                </div>
              </div>

              {/* Bottom: section tracker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { num: '1', label: 'Lifestyle', count: lifestyleQs.length },
                  { num: '2', label: 'Validation', count: validationQs.length },
                ].map(({ num, label, count }) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,.65)', border: '1px solid #D4DEB8', borderRadius: 10, backdropFilter: 'blur(6px)' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EEF0DC', border: '1.5px solid #BECA5C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, color: '#5E6A2A', fontWeight: 700 }}>{num}</span>
                    </div>
                    <span style={{ fontSize: 12.5, color: '#57564E', flex: 1 }}>Section {num} · {label}</span>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, color: '#7E9A3E' }}>{count}Q</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section banner ── */
function SectionBanner({ number, label, color, bg, border, desc }) {
  return (
    <div style={{ margin: '32px 0 16px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: bg, border: `1.5px solid ${border}`, borderRadius: '999px', padding: '7px 16px 7px 8px', marginBottom: desc ? 8 : 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, color: '#fff', fontWeight: 700 }}>{number}</span>
        </div>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color, fontWeight: 600 }}>
          Section {number} · {label}
        </span>
      </div>
      {desc && <p style={{ fontSize: 13, color: '#8A887C', margin: '6px 0 0', lineHeight: 1.6 }}>{desc}</p>}
    </div>
  );
}

/* ── Question card ── */
function QuestionCard({ q, qi, answers, pick, delay }) {
  const active = answers[q.key];
  return (
    <div className="sk-q-card"
      style={{
        background: '#fff',
        border: `1.5px solid ${active ? '#C8D068' : '#E0DCCC'}`,
        borderLeft: `4px solid ${active ? '#BECA5C' : '#D4D0C4'}`,
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: active ? '0 4px 18px rgba(94,106,42,.1)' : '0 2px 8px rgba(35,36,28,.05)',
        transition: 'border-color .2s, box-shadow .2s',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Question header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        {/* Number badge */}
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: active ? '#BECA5C' : '#ECEADF', border: `2px solid ${active ? '#8A9A40' : '#D4D0C4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
          {active
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A2D14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, color: '#9C9A8C', fontWeight: 700, lineHeight: 1 }}>{String(qi + 1).padStart(2, '0')}</span>
          }
        </div>

        {/* Question text + category */}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: '#23241C', lineHeight: 1.45 }}>{q.question}</span>
        </div>

        <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9AA646', background: '#F4F6EA', padding: '4px 9px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0, border: '1px solid #D8DFA8' }}>
          {q.category}
        </span>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(q.options.length, 4)}, 1fr)`, gap: 8 }}>
        {q.options.map(opt => {
          const isActive = answers[q.key] === opt;
          return (
            <button
              key={opt}
              onClick={() => pick(q.key, opt)}
              className={`sk-opt-btn${isActive ? ' active' : ''}`}
              style={{
                borderRadius: 10, padding: '12px 8px', textAlign: 'center',
                fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13,
                border: isActive ? '2px solid #BECA5C' : '1.5px solid #E0DCCC',
                background: isActive ? '#F4F6E8' : '#FAFAF7',
                color: isActive ? '#4A5820' : '#57564E',
                boxShadow: isActive ? '0 2px 10px rgba(190,202,92,.25)' : 'none',
              }}
            >
              {isActive && (
                <span style={{ display: 'block', fontSize: 9, color: '#7E9A3E', marginBottom: 3, fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.08em' }}>SELECTED</span>
              )}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Circular SVG progress ── */
function CircularProgress({ progress, answered, totalQ }) {
  const r = 44, c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(94,106,42,.15)" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="#BECA5C" strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset .4s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 26, color: '#5E6A2A', lineHeight: 1 }}>{progress}%</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, color: '#9C9A8C', letterSpacing: '.08em', marginTop: 2 }}>{answered}/{totalQ}</span>
      </div>
    </div>
  );
}
