import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARN_MS    = 28 * 60 * 1000; // warn 2 minutes before logout

const initialState = {
  user: null,              // { id, name, email }
  accessToken: null,
  detection: null,         // { skin_type, skin_conf, acne_status, acne_conf, final_condition, image_url }
  routing: null,           // 'direct' | 'questionnaire' | 'consultant'
  answers: {},             // questionnaire key → chosen value
  lifestyle: null,         // summarised lifestyle object
  advices: [],             // generated advices from questionnaire answers
  validationScore: null,   // numeric 0–6
  validationStatus: null,  // 'Strongly Supports Prediction' | 'Moderately Supports Prediction' | 'Weakly Supports Prediction'
  remedies: [],            // fetched remedy array
  selectedRemedy: null,    // chosen remedy object
  tracking: { enabled: false, frequency: 'weekly' },
  trackingDue: null,       // null | { due: bool, tracking: {...}, old_detection: {...} }
  checkinProgress: null,   // null | { progress, delta, old_image_url, new_image_url, ... }
  pendingCheckins: 0,      // count of unresolved check-in notifications
  checkin: { outcome: 'better' },
  history: [],             // past session records
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':       return { ...state, user: action.payload };
    case 'SET_TOKEN':      return { ...state, accessToken: action.payload };
    case 'SET_DETECTION':  return { ...state, detection: action.payload };
    case 'SET_ROUTING':    return { ...state, routing: action.payload };
    case 'SET_ANSWERS':    return { ...state, answers: { ...state.answers, ...action.payload } };
    case 'SET_LIFESTYLE':  return { ...state, lifestyle: action.payload };
    case 'SET_ADVICES':    return { ...state, advices: action.payload };
    case 'SET_VALIDATION': return { ...state, validationScore: action.payload.score, validationStatus: action.payload.status };
    case 'SET_REMEDIES':   return { ...state, remedies: action.payload };
    case 'SELECT_REMEDY':  return { ...state, selectedRemedy: action.payload };
    case 'SET_TRACKING':          return { ...state, tracking: { ...state.tracking, ...action.payload } };
    case 'SET_TRACKING_DUE':      return { ...state, trackingDue: action.payload };
    case 'SET_CHECKIN_PROGRESS':  return { ...state, checkinProgress: action.payload };
    case 'SET_PENDING_CHECKINS':  return { ...state, pendingCheckins: action.payload ?? 0 };
    case 'SET_CHECKIN':          return { ...state, checkin: { ...state.checkin, ...action.payload } };
    case 'SET_HISTORY':    return { ...state, history: action.payload };
    case 'LOGOUT':         return { ...initialState };
    default:               return state;
  }
}

const AppContext = createContext(null);

// Load history from localStorage keyed by userId
export function loadHistory(userId) {
  try {
    const raw = localStorage.getItem(`skinora_history_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Persist history entry to localStorage
export function saveHistoryEntry(userId, entry) {
  try {
    const existing = loadHistory(userId);
    const updated = [entry, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(`skinora_history_${userId}`, JSON.stringify(updated));
    return updated;
  } catch { return []; }
}

export function AppProvider({ children }) {
  const stored = (() => {
    try {
      const u = sessionStorage.getItem('skinora_user');
      const t = sessionStorage.getItem('skinora_token');
      if (!u) return {};
      const user = JSON.parse(u);
      return { user, accessToken: t, history: loadHistory(user.id) };
    } catch { return {}; }
  })();

  const [state, dispatch] = useReducer(reducer, { ...initialState, ...stored });
  const [showWarning, setShowWarning] = useState(false);
  const logoutTimer = useRef(null);
  const warnTimer   = useRef(null);
  const loggedIn    = useRef(false);

  const doLogout = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);
    setShowWarning(false);
    dispatch({ type: 'LOGOUT' });
    sessionStorage.removeItem('skinora_user');
    sessionStorage.removeItem('skinora_token');
  }, []);

  const resetTimer = useCallback(() => {
    if (!loggedIn.current) return;
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);
    setShowWarning(false);
    warnTimer.current   = setTimeout(() => setShowWarning(true), WARN_MS);
    logoutTimer.current = setTimeout(() => doLogout(),           TIMEOUT_MS);
  }, [doLogout]);

  useEffect(() => {
    loggedIn.current = !!state.user;
    if (!state.user) {
      clearTimeout(logoutTimer.current);
      clearTimeout(warnTimer.current);
      setShowWarning(false);
      return;
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(logoutTimer.current);
      clearTimeout(warnTimer.current);
    };
  }, [state.user, resetTimer]);

  useEffect(() => {
    if (state.user) {
      sessionStorage.setItem('skinora_user', JSON.stringify(state.user));
      sessionStorage.setItem('skinora_token', state.accessToken || '');
    } else {
      sessionStorage.removeItem('skinora_user');
      sessionStorage.removeItem('skinora_token');
    }
  }, [state.user, state.accessToken]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}

      {/* ── Session timeout warning ── */}
      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(35,36,28,.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Hanken Grotesk',sans-serif",
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '40px 44px',
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,.22)', border: '2px solid #E6E3D8',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#FFF8E6', border: '2px solid #F0DFA0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 22px', fontSize: 28,
            }}>⏱</div>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 27, margin: '0 0 10px', color: '#23241C', letterSpacing: '-.01em' }}>
              Still there?
            </h3>
            <p style={{ fontSize: 14, color: '#6B6A60', lineHeight: 1.65, margin: '0 0 28px' }}>
              Your session will expire in <strong style={{ color: '#23241C' }}>2 minutes</strong> due to inactivity.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={doLogout}
                style={{ flex: 1, padding: '13px', background: '#F6F4EC', border: '1.5px solid #D0CDB8', borderRadius: 12, fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, color: '#6B6A60', cursor: 'pointer' }}
              >
                Log out
              </button>
              <button
                onClick={resetTimer}
                style={{ flex: 1, padding: '13px', background: '#BECA5C', border: 'none', borderRadius: 12, fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, color: '#1A1E0A', cursor: 'pointer' }}
              >
                Stay logged in
              </button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
