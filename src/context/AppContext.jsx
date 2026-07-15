import { createContext, useContext, useReducer, useEffect } from 'react';

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
    case 'SET_TRACKING':   return { ...state, tracking: { ...state.tracking, ...action.payload } };
    case 'SET_CHECKIN':    return { ...state, checkin: { ...state.checkin, ...action.payload } };
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
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
