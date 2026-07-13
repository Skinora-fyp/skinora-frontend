import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { loadHistory } from '../context/AppContext';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function conditionColor(cond) {
  if (!cond) return '#9C9A8C';
  if (cond.includes('Oily')) return '#6BAF92';
  if (cond.includes('Dry'))  return '#C0744E';
  return '#5E6A2A';
}

export default function History() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (state.user?.id) {
      setSessions(loadHistory(state.user.id));
    }
  }, [state.user]);

  const userName   = state.user?.name ?? 'User';
  const userEmail  = state.user?.email ?? '';
  const userInitial = userName.charAt(0).toUpperCase();

  // Stats
  const totalScans    = sessions.filter((s) => s.detection).length;
  const totalRemedies = sessions.filter((s) => s.selectedRemedy).length;
  const trackingOn    = sessions.filter((s) => s.tracking?.enabled).length;
  const latestCond    = sessions[0]?.detection?.final_condition ?? null;

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <main style={{ maxWidth: 1020, margin: '0 auto', padding: '40px 44px 70px' }}>

        {/* ── Profile header ── */}
        <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 18, padding: '30px 32px', marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          {/* Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#6E7733', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 32, flexShrink: 0 }}>
            {userInitial}
          </div>
          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9AA646', marginBottom: 4 }}>
              Account
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 32, margin: '0 0 4px', letterSpacing: '-.01em' }}>{userName}</h2>
            <div style={{ fontSize: 13.5, color: '#9C9A8C' }}>{userEmail}</div>
          </div>
          {/* Latest condition badge */}
          {latestCond && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 6 }}>Current condition</div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: conditionColor(latestCond) }}>
                {latestCond.replace('_', ' + ')}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Skin Scans',         value: totalScans,    icon: '🔬', tint: '#EEF0DC' },
            { label: 'Remedies Selected',  value: totalRemedies, icon: '🌿', tint: '#F4F6EA' },
            { label: 'Tracking Enabled',   value: trackingOn,    icon: '📈', tint: '#F0EDE4' },
            { label: 'Sessions Total',      value: sessions.length, icon: '📋', tint: '#F8F5EE' },
          ].map(({ label, value, icon, tint }) => (
            <div key={label} style={{ background: tint, border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 28, lineHeight: 1, color: '#23241C' }}>{value}</div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Activity history ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 4 }}>Timeline</div>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-.01em' }}>Activity History</h3>
          </div>
          <button
            onClick={() => navigate('/guidelines')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '11px 22px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + New scan
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, padding: '52px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔬</div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#3a3a2a', marginBottom: 8 }}>No activity yet</div>
            <p style={{ fontSize: 14, color: '#9C9A8C', maxWidth: 320, margin: '0 auto 24px' }}>
              Complete your first skin scan and remedy selection to see your history here.
            </p>
            <button
              onClick={() => navigate('/guidelines')}
              style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '13px 26px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Start my first scan →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sessions.map((session, idx) => {
              const isExpanded = expandedId === session.id;
              const cond = session.detection?.final_condition;
              const [skinPart, acnePart] = cond ? cond.split('_') : ['—', '—'];
              return (
                <div key={session.id} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    {/* Index badge */}
                    <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#C9C5B4', flexShrink: 0, minWidth: 30 }}>
                      {String(sessions.length - idx).padStart(2, '0')}
                    </span>

                    {/* Date */}
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.06em', color: '#9C9A8C' }}>
                        {formatDate(session.date)}
                      </div>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, color: '#CFCCBE' }}>
                        {formatTime(session.date)}
                      </div>
                    </div>

                    {/* Condition */}
                    {cond ? (
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: conditionColor(cond), lineHeight: 1.1 }}>
                          {skinPart} skin
                        </div>
                        <div style={{ fontSize: 12, color: '#9C9A8C', marginTop: 2 }}>
                          {acnePart === 'Acne' ? 'Acne present' : 'No acne'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 13, color: '#9C9A8C' }}>No scan data</div>
                    )}

                    {/* Remedy chip */}
                    {session.selectedRemedy ? (
                      <span style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E6A2A', flexShrink: 0 }}>
                        🌿 {session.selectedRemedy.name}
                      </span>
                    ) : (
                      <span style={{ background: '#F8F6F0', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#CFCCBE', flexShrink: 0 }}>
                        No remedy
                      </span>
                    )}

                    {/* Tracking chip */}
                    {session.tracking?.enabled && (
                      <span style={{ background: '#EEF0DC', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7E9A3E', flexShrink: 0 }}>
                        {session.tracking.frequency} tracking
                      </span>
                    )}

                    {/* Expand toggle */}
                    <span style={{ color: '#B6B4A8', fontSize: 14, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #F0EDE4', padding: '20px 22px', display: 'flex', flexWrap: 'wrap', gap: 24 }}>

                      {/* AI confidence */}
                      {session.detection && (
                        <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>AI Analysis</div>
                          {[
                            { label: 'Skin Type',    result: session.detection.skin_type,   conf: session.detection.skin_conf },
                            { label: 'Acne Status',  result: session.detection.acne_status, conf: session.detection.acne_conf },
                          ].map(({ label, result, conf }) => (
                            <div key={label} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#6B6A60' }}>{label}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#5E6A2A' }}>
                                  {result} · {Math.round((conf ?? 0) * 100)}%
                                </span>
                              </div>
                              <div style={{ height: 5, background: '#ECEADF', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.round((conf ?? 0) * 100)}%`, background: '#BECA5C', borderRadius: 3 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Lifestyle advices */}
                      {session.advices?.length > 0 && (
                        <div style={{ flex: '1 1 220px', minWidth: 220 }}>
                          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>Lifestyle Advice</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {session.advices.map((a) => (
                              <div key={a.tag} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#3a3a2a', lineHeight: 1.45 }}>
                                <span style={{ flexShrink: 0 }}>{a.icon}</span>
                                <span>{a.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questionnaire answers */}
                      {session.answers && Object.keys(session.answers).length > 0 && (
                        <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>Your Answers</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { key: 'water', label: '💧 Water', icon: '💧' },
                              { key: 'stress', label: '🧘 Stress', icon: '🧘' },
                              { key: 'sleep', label: '🌙 Sleep', icon: '🌙' },
                            ].map(({ key, label }) => session.answers[key] ? (
                              <div key={key} style={{ fontSize: 12, color: '#57564E' }}>
                                <span style={{ fontWeight: 600 }}>{label}: </span>{session.answers[key]}
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Medical disclaimer */}
        <div style={{ marginTop: 36, background: '#FDF4F0', border: '1px solid #F0D5C8', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: '#C0744E', fontSize: 14, flexShrink: 0 }}>⚕</span>
          <p style={{ fontSize: 12, color: '#7A4A38', lineHeight: 1.55, margin: 0 }}>
            <strong>Medical Disclaimer:</strong> Skinora recommendations are for educational purposes only and are not a substitute for professional medical advice. Consult a qualified dermatologist for persistent skin conditions.
          </p>
        </div>
      </main>
    </div>
  );
}
