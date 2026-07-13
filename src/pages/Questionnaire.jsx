import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { QUESTIONS, generateAdvices, summariseLifestyle } from '../data/questions';
import { submitAnswers } from '../api';

export default function Questionnaire() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [answers, setAnswers] = useState(state.answers ?? {});

  const totalQuestions = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / totalQuestions) * 100);

  function pick(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const advices = generateAdvices(answers);
    dispatch({ type: 'SET_ANSWERS',   payload: answers });
    dispatch({ type: 'SET_LIFESTYLE', payload: summariseLifestyle(answers) });
    dispatch({ type: 'SET_ADVICES',   payload: advices });
    try {
      await submitAnswers({ answers, final_condition: state.detection?.final_condition });
    } catch { /* continue if API unavailable */ }
    navigate('/remedies');
  }

  const optBtn = (key, opt) => {
    const active = answers[key] === opt;
    return {
      cursor: 'pointer', borderRadius: 10, padding: '14px 10px', textAlign: 'center',
      fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14,
      border: `${active ? 2 : 1}px solid ${active ? '#BECA5C' : '#E0DCCC'}`,
      background: active ? '#F7F8EC' : '#fff',
      color: active ? '#5E6A2A' : '#57564E',
      transition: 'all .15s',
      position: 'relative',
    };
  };

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="personalize" />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '46px 44px 60px' }}>
        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 12 }}>
          Step 04 · Lifestyle Context
        </div>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 38, letterSpacing: '-.02em', margin: '0 0 10px' }}>
          A few details to tailor your remedies.
        </h2>
        <p style={{ fontSize: 15, color: '#6B6A60', margin: '0 0 8px', maxWidth: 520, lineHeight: 1.65 }}>
          Your answers generate personalized lifestyle advice shown after you select your remedy.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: '999px', padding: '5px 12px', marginBottom: 26 }}>
          <span style={{ color: '#7E9A3E', fontSize: 12 }}>✦</span>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#5E6A2A' }}>Advice saved until remedy selected</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ flex: 1, height: 7, background: '#ECEADF', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#BECA5C', borderRadius: 5, transition: 'width .3s' }} />
          </div>
          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: '#9C9A8C', minWidth: 32 }}>{progress}%</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {QUESTIONS.map((q, qi) => (
            <div key={q.key} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#C9C5B4', flexShrink: 0, lineHeight: 1.2 }}>
                    {String(qi + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#2C2C25', lineHeight: 1.4 }}>{q.question}</span>
                </div>
                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9AA646', background: '#F4F6EA', padding: '5px 9px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {q.category}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.options.length}, 1fr)`, gap: 8 }}>
                {q.options.map((opt) => (
                  <button key={opt} onClick={() => pick(q.key, opt)} style={optBtn(q.key, opt)}>
                    {answers[q.key] === opt && (
                      <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 10, color: '#7E9A3E' }}>✓</span>
                    )}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
          <button
            onClick={handleSubmit}
            disabled={answered < totalQuestions}
            style={{
              background: answered < totalQuestions ? '#D5D1C2' : '#BECA5C',
              color: answered < totalQuestions ? '#9C9A8C' : '#2A2D14',
              border: 'none', borderRadius: '999px', padding: '15px 30px',
              fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15,
              cursor: answered < totalQuestions ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
            }}
          >
            Generate my remedies →
          </button>
          <span style={{ fontSize: 13, color: '#9C9A8C' }}>
            {answered < totalQuestions
              ? `${totalQuestions - answered} question${totalQuestions - answered > 1 ? 's' : ''} remaining`
              : 'All answered · ready to go'}
          </span>
        </div>
      </main>
    </div>
  );
}
