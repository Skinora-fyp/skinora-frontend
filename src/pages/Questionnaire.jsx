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

  const detection  = state.detection  ?? {};
  const routing    = state.routing    ?? 'direct';
  const skin_type  = detection.skin_type  ?? 'Normal';
  const acne_status = detection.acne_status ?? 'NoAcne';
  const minConf    = Math.min(detection.skin_conf ?? 0, detection.acne_conf ?? 0);
  const isMedium   = routing === 'questionnaire';

  const questions     = getQuestions(skin_type);
  const lifestyleQs   = questions.filter(q => q.group === 'lifestyle');
  const validationQs  = questions.filter(q => q.group === 'validation');

  const [answers, setAnswers] = useState(state.answers ?? {});

  const totalQ  = questions.length;
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
      await submitAnswers({
        answers,
        detection_id: detection.detection_id,
        skin_type,
        acne_status,
      });
    } catch { /* continue if API unavailable */ }

    // Medium confidence: show validation on result page
    // High confidence (personalize flow): go straight to remedies
    navigate(isMedium ? '/result' : '/remedies');
  }

  const optBtn = (key, opt) => {
    const active = answers[key] === opt;
    return {
      cursor: 'pointer', borderRadius: 10, padding: '13px 8px', textAlign: 'center',
      fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5,
      border: `${active ? 2 : 1}px solid ${active ? '#BECA5C' : '#E0DCCC'}`,
      background: active ? '#F7F8EC' : '#fff',
      color: active ? '#5E6A2A' : '#57564E',
      transition: 'all .15s', position: 'relative',
    };
  };

  const SectionHeader = ({ label, desc }) => (
    <div style={{ margin: '32px 0 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: '#E0DCCC' }} />
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C9A8C', whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: '#E0DCCC' }} />
      </div>
      {desc && <p style={{ fontSize: 12.5, color: '#9C9A8C', margin: '8px 0 0', lineHeight: 1.6 }}>{desc}</p>}
    </div>
  );

  const QuestionCard = ({ q, qi }) => (
    <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#C9C5B4', flexShrink: 0, lineHeight: 1.2 }}>
            {String(qi + 1).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#2C2C25', lineHeight: 1.45 }}>{q.question}</span>
        </div>
        <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9AA646', background: '#F4F6EA', padding: '4px 9px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {q.category}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(q.options.length, 4)}, 1fr)`, gap: 7 }}>
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(q.key, opt)} style={optBtn(q.key, opt)}>
            {answers[q.key] === opt && (
              <span style={{ position: 'absolute', top: 5, right: 7, fontSize: 9, color: '#7E9A3E' }}>✓</span>
            )}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="personalize" />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '46px 44px 60px' }}>

        {/* Medium-confidence context banner */}
        {isMedium && (
          <div style={{ background: '#FFF8E6', border: '1px solid #F0DFA0', borderRadius: 14, padding: '18px 22px', marginBottom: 28, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>🔬</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#7A5C00', marginBottom: 5 }}>
                Moderate AI Confidence — Validation Required
              </div>
              <div style={{ fontSize: 13, color: '#8A6A10', lineHeight: 1.6 }}>
                Our AI detected <strong>{skin_type} skin {acne_status === 'Acne' ? 'with acne' : 'without acne'}</strong> with{' '}
                <strong>{Math.round(minConf * 100)}% minimum confidence</strong> (40–69% range).
                Please answer the questions below to validate this prediction and receive personalised recommendations.
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, fontSize: 12, color: '#9C7820', lineHeight: 1.5 }}>
                ℹ️ Your answers <strong>cannot change</strong> the AI prediction. They are used only for validation feedback and personalising your recommendation order.
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>
          {isMedium ? 'Step 03 · Validation & Lifestyle' : 'Step 04 · Lifestyle Context'}
        </div>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 36, letterSpacing: '-.02em', margin: '0 0 8px' }}>
          {isMedium ? 'Help us validate your result.' : 'A few details to tailor your remedies.'}
        </h2>
        <p style={{ fontSize: 14.5, color: '#6B6A60', margin: '0 0 22px', maxWidth: 540, lineHeight: 1.65 }}>
          {isMedium
            ? 'Your self-reported answers are compared against the AI prediction to generate a validation score. Remedies are always based on the AI result.'
            : 'Your answers generate personalised lifestyle advice shown alongside your remedies.'}
        </p>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 7, background: '#ECEADF', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#BECA5C', borderRadius: 5, transition: 'width .3s' }} />
          </div>
          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: '#9C9A8C', minWidth: 40 }}>{answered}/{totalQ}</span>
        </div>

        {/* ── Section 1: Lifestyle ── */}
        <SectionHeader
          label="Section 1 · Lifestyle"
          desc="These answers generate personalised advice about your daily habits and skin health."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lifestyleQs.map((q, i) => <QuestionCard key={q.key} q={q} qi={i} />)}
        </div>

        {/* ── Section 2: Validation ── */}
        <SectionHeader
          label="Section 2 · AI Prediction Validation"
          desc={`These questions compare your experience with the AI's prediction of ${skin_type} skin${acne_status === 'Acne' ? ' with acne' : ' without acne'}.`}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {validationQs.map((q, i) => <QuestionCard key={q.key} q={q} qi={lifestyleQs.length + i} />)}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
          <button
            onClick={handleSubmit}
            disabled={answered < totalQ}
            style={{
              background: answered < totalQ ? '#D5D1C2' : '#BECA5C',
              color:      answered < totalQ ? '#9C9A8C' : '#2A2D14',
              border: 'none', borderRadius: '999px', padding: '15px 30px',
              fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15,
              cursor: answered < totalQ ? 'not-allowed' : 'pointer', transition: 'all .2s',
            }}
          >
            {isMedium ? 'View my results →' : 'Generate my remedies →'}
          </button>
          <span style={{ fontSize: 13, color: '#9C9A8C' }}>
            {answered < totalQ
              ? `${totalQ - answered} question${totalQ - answered > 1 ? 's' : ''} remaining`
              : 'All answered — ready'}
          </span>
        </div>
      </main>
    </div>
  );
}
