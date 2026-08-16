import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { loadHistory } from '../context/AppContext';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function conditionColor(cond) {
  if (!cond) return '#9C9A8C';
  if (cond.includes('Oily')) return '#6BAF92';
  if (cond.includes('Dry'))  return '#C0744E';
  return '#5E6A2A';
}

function ConfBar({ value, color = '#BECA5C' }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#ECEADF', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#9C9A8C', flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

function Chip({ children, bg = '#F4F6EA', color = '#5E6A2A', border = '#E2E7C9' }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: '999px', padding: '3px 10px',
      fontFamily: "'Spline Sans Mono'", fontSize: 9.5,
      letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 8 }}>
      {children}
    </div>
  );
}

// ── Detail panels ────────────────────────────────────────────

function ScansPanel({ sessions }) {
  const scans = sessions.filter(s => s.detection);
  if (scans.length === 0) {
    return <EmptyDetail icon="🔬" msg="No scan data recorded yet." />;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
      {scans.map((s, i) => {
        const det  = s.detection;
        const cond = det.final_condition ?? '';
        const [skin, acne] = cond.split('_');
        return (
          <div key={s.id ?? i} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, overflow: 'hidden' }}>
            {/* Thumbnail */}
            <div style={{ height: 120, background: '#ECEADF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {det.image_url
                ? <img src={det.image_url} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 36 }}>📷</span>
              }
              <span style={{
                position: 'absolute', top: 8, left: 8,
                background: 'rgba(0,0,0,.45)', color: '#fff',
                fontFamily: "'Spline Sans Mono'", fontSize: 9, padding: '3px 8px', borderRadius: 6,
              }}>
                #{scans.length - i}
              </span>
            </div>
            {/* Info */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: conditionColor(cond), lineHeight: 1.1 }}>
                    {skin} skin
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9C9A8C', marginTop: 2 }}>
                    {acne === 'Acne' ? 'Acne present' : 'No acne'}
                  </div>
                </div>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: '#9C9A8C', textAlign: 'right', lineHeight: 1.5 }}>
                  {formatDate(s.date)}<br />{formatTime(s.date)}
                </div>
              </div>
              <SectionLabel>AI Confidence</SectionLabel>
              <div style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#6B6A60' }}>Skin type</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#5E6A2A' }}>{det.skin_type}</span>
                </div>
                <ConfBar value={det.skin_conf} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#6B6A60' }}>Acne detection</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#5E6A2A' }}>{det.acne_status}</span>
                </div>
                <ConfBar value={det.acne_conf} color={acne === 'Acne' ? '#E8A86C' : '#BECA5C'} />
              </div>
              {s.selectedRemedy && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0EDE4' }}>
                  <Chip>🌿 {s.selectedRemedy.name}</Chip>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RemediesPanel({ sessions }) {
  const withRemedy = sessions.filter(s => s.selectedRemedy);
  if (withRemedy.length === 0) {
    return <EmptyDetail icon="🌿" msg="No remedies have been selected yet." />;
  }

  // Group by remedy name to show frequency
  const byRemedy = {};
  withRemedy.forEach(s => {
    const name = s.selectedRemedy.name;
    if (!byRemedy[name]) byRemedy[name] = { remedy: s.selectedRemedy, sessions: [] };
    byRemedy[name].sessions.push(s);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.values(byRemedy).map(({ remedy, sessions: rsessions }) => (
        <div key={remedy.name} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#23241C', marginBottom: 4 }}>
                🌿 {remedy.name}
              </div>
              {remedy.category && (
                <Chip bg="#F4F6EA" color="#5E6A2A" border="#D5DBA8">{remedy.category}</Chip>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 28, color: '#7E9A3E', lineHeight: 1 }}>{rsessions.length}</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#9C9A8C', marginTop: 2 }}>
                TIME{rsessions.length !== 1 ? 'S' : ''} SELECTED
              </div>
            </div>
          </div>

          {/* Conditions it was prescribed for */}
          <SectionLabel>Prescribed for</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {[...new Set(rsessions.map(s => s.detection?.final_condition).filter(Boolean))].map(cond => (
              <Chip key={cond} bg="#F0FAF0" color={conditionColor(cond)} border="#C5E0C5">
                {cond.replace('_', ' + ')}
              </Chip>
            ))}
            {rsessions.every(s => !s.detection?.final_condition) && (
              <span style={{ fontSize: 12, color: '#9C9A8C' }}>—</span>
            )}
          </div>

          {/* Session timeline */}
          <SectionLabel>Usage history</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rsessions.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#F6F4EC', borderRadius: 9 }}>
                <span style={{ fontSize: 12.5, color: '#23241C' }}>{formatDate(s.date)}</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {s.tracking?.enabled && (
                    <Chip bg="#EEF0DC" color="#7E9A3E" border="#D5DBA8">
                      {s.tracking.frequency} tracking
                    </Chip>
                  )}
                  {s.detection?.final_condition && (
                    <Chip bg="#F0F0F0" color="#57564E" border="#E0DCCC">
                      {s.detection.final_condition.split('_')[0]}
                    </Chip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingPanel({ sessions }) {
  const tracked = sessions.filter(s => s.tracking?.enabled);
  if (tracked.length === 0) {
    return <EmptyDetail icon="📈" msg="No tracking has been enabled yet. Select a remedy and enable tracking to start monitoring progress." />;
  }

  const freqCount = { weekly: 0, monthly: 0 };
  tracked.forEach(s => { if (s.tracking.frequency) freqCount[s.tracking.frequency] = (freqCount[s.tracking.frequency] ?? 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        {freqCount.weekly > 0 && (
          <div style={{ background: '#EEF0DC', border: '1px solid #BECA5C', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26, color: '#5E6A2A' }}>{freqCount.weekly}</div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#7E9A3E', marginTop: 2 }}>WEEKLY</div>
          </div>
        )}
        {freqCount.monthly > 0 && (
          <div style={{ background: '#F4F6EA', border: '1px solid #D5DBA8', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26, color: '#5E6A2A' }}>{freqCount.monthly}</div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#7E9A3E', marginTop: 2 }}>MONTHLY</div>
          </div>
        )}
      </div>

      {tracked.map((s, i) => (
        <div key={s.id ?? i} style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>

          {/* Frequency badge */}
          <div style={{
            width: 52, height: 52, borderRadius: 13, flexShrink: 0,
            background: s.tracking.frequency === 'weekly' ? '#EEF0DC' : '#F4F6EA',
            border: '1.5px solid #D5DBA8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18 }}>{s.tracking.frequency === 'weekly' ? '7' : '30'}</span>
            <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 7.5, color: '#7E9A3E', letterSpacing: '.05em' }}>DAYS</span>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5, color: '#23241C' }}>
                {s.tracking.frequency === 'weekly' ? 'Weekly' : 'Monthly'} tracking
              </span>
              <Chip bg="#EEF0DC" color="#5E6A2A" border="#BECA5C">Active</Chip>
            </div>
            {s.selectedRemedy && (
              <div style={{ fontSize: 13, color: '#57564E', marginBottom: 6 }}>
                <span style={{ color: '#9C9A8C' }}>Remedy:</span> <strong>{s.selectedRemedy.name}</strong>
              </div>
            )}
            {s.detection?.final_condition && (
              <div style={{ fontSize: 13, color: '#57564E' }}>
                <span style={{ color: '#9C9A8C' }}>Condition:</span> {s.detection.final_condition.replace('_', ' + ')}
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: '#9C9A8C' }}>{formatDate(s.date)}</div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: '#CFCCBE' }}>{formatTime(s.date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionsPanel({ sessions }) {
  if (sessions.length === 0) {
    return <EmptyDetail icon="📋" msg="No sessions recorded yet." />;
  }
  return (
    <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, overflow: 'hidden' }}>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 100px 90px', gap: 12, padding: '12px 20px', background: '#F6F4EC', borderBottom: '1px solid #E6E3D8' }}>
        {['#', 'Date', 'Condition', 'Remedy', 'Tracking'].map(h => (
          <div key={h} style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C' }}>{h}</div>
        ))}
      </div>
      {sessions.map((s, i) => {
        const cond = s.detection?.final_condition;
        const [skin, acne] = cond ? cond.split('_') : [null, null];
        return (
          <div key={s.id ?? i} style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 1fr 100px 90px', gap: 12,
            padding: '13px 20px', borderBottom: i < sessions.length - 1 ? '1px solid #F0EDE4' : 'none',
            alignItems: 'center',
          }}>
            {/* # */}
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 16, color: '#C9C5B4' }}>
              {String(sessions.length - i).padStart(2, '0')}
            </div>
            {/* Date */}
            <div>
              <div style={{ fontSize: 12.5, color: '#23241C', fontWeight: 500 }}>{formatDate(s.date)}</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: '#CFCCBE' }}>{formatTime(s.date)}</div>
            </div>
            {/* Condition */}
            <div>
              {skin
                ? <>
                    <div style={{ fontSize: 12.5, color: conditionColor(cond), fontWeight: 600 }}>{skin}</div>
                    <div style={{ fontSize: 11, color: '#9C9A8C' }}>{acne === 'Acne' ? 'Acne present' : 'No acne'}</div>
                  </>
                : <span style={{ fontSize: 12, color: '#CFCCBE' }}>—</span>
              }
            </div>
            {/* Remedy */}
            <div style={{ fontSize: 12, color: s.selectedRemedy ? '#3E6A1A' : '#CFCCBE', fontWeight: s.selectedRemedy ? 600 : 400 }}>
              {s.selectedRemedy ? `🌿 ${s.selectedRemedy.name}` : '—'}
            </div>
            {/* Tracking */}
            <div>
              {s.tracking?.enabled
                ? <Chip bg="#EEF0DC" color="#5E6A2A" border="#BECA5C">{s.tracking.frequency}</Chip>
                : <span style={{ fontSize: 11, color: '#CFCCBE' }}>—</span>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyDetail({ icon, msg }) {
  return (
    <div style={{ padding: '44px 24px', textAlign: 'center', background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, color: '#9C9A8C', maxWidth: 320, margin: '0 auto' }}>{msg}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function History() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [sessions, setSessions]       = useState([]);
  const [expandedId, setExpandedId]   = useState(null);
  const [selectedCard, setSelectedCard] = useState(null); // 'scans'|'remedies'|'tracking'|'sessions'

  useEffect(() => {
    if (state.user?.id) setSessions(loadHistory(state.user.id));
  }, [state.user]);

  const userName    = state.user?.name  ?? 'User';
  const userEmail   = state.user?.email ?? '';
  const userInitial = userName.charAt(0).toUpperCase();

  const totalScans    = sessions.filter(s => s.detection).length;
  const totalRemedies = sessions.filter(s => s.selectedRemedy).length;
  const trackingOn    = sessions.filter(s => s.tracking?.enabled).length;
  const latestCond    = sessions[0]?.detection?.final_condition ?? null;

  const CARDS = [
    { id: 'scans',    label: 'Skin Scans',        value: totalScans,      icon: '🔬', tint: '#EEF0DC', activeBorder: '#BECA5C', activeText: '#5E6A2A' },
    { id: 'remedies', label: 'Remedies Selected',  value: totalRemedies,   icon: '🌿', tint: '#F4F6EA', activeBorder: '#9AB862', activeText: '#4A5C1E' },
    { id: 'tracking', label: 'Tracking Enabled',   value: trackingOn,      icon: '📈', tint: '#F0EDE4', activeBorder: '#B0B87A', activeText: '#575E1E' },
    { id: 'sessions', label: 'Sessions Total',      value: sessions.length, icon: '📋', tint: '#F8F5EE', activeBorder: '#C8C4B0', activeText: '#57564E' },
  ];

  function toggleCard(id) {
    setSelectedCard(prev => prev === id ? null : id);
  }

  function renderDetailPanel() {
    if (!selectedCard) return null;
    const cfg = CARDS.find(c => c.id === selectedCard);
    return (
      <div style={{
        marginBottom: 32, border: `1.5px solid ${cfg.activeBorder}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 18px rgba(0,0,0,.06)',
      }}>
        {/* Panel header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', background: cfg.tint, borderBottom: `1px solid ${cfg.activeBorder}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{cfg.icon}</span>
            <div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#23241C', lineHeight: 1.1 }}>{cfg.label}</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: '#9C9A8C', marginTop: 2 }}>
                {cfg.value} record{cfg.value !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button onClick={() => setSelectedCard(null)} style={{
            background: 'rgba(0,0,0,.06)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#57564E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        {/* Panel body */}
        <div style={{ padding: '20px 20px' }}>
          {selectedCard === 'scans'    && <ScansPanel    sessions={sessions} />}
          {selectedCard === 'remedies' && <RemediesPanel sessions={sessions} />}
          {selectedCard === 'tracking' && <TrackingPanel sessions={sessions} />}
          {selectedCard === 'sessions' && <SessionsPanel sessions={sessions} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <main style={{ maxWidth: 1020, margin: '0 auto', padding: '40px 44px 70px' }}>

        {/* ── Profile header ── */}
        <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 18, padding: '30px 32px', marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#6E7733', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 32, flexShrink: 0 }}>
            {userInitial}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9AA646', marginBottom: 4 }}>Account</div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 32, margin: '0 0 4px', letterSpacing: '-.01em' }}>{userName}</h2>
            <div style={{ fontSize: 13.5, color: '#9C9A8C' }}>{userEmail}</div>
          </div>
          {latestCond && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 6 }}>Current condition</div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: conditionColor(latestCond) }}>
                {latestCond.replace('_', ' + ')}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats row — clickable ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>
            Click a card to see details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            {CARDS.map(({ id, label, value, icon, tint, activeBorder, activeText }) => {
              const isActive = selectedCard === id;
              return (
                <button
                  key={id}
                  onClick={() => toggleCard(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: isActive ? tint : '#fff',
                    border: `${isActive ? '2px' : '1px'} solid ${isActive ? activeBorder : '#E6E3D8'}`,
                    borderRadius: 14, padding: isActive ? '17px 19px' : '18px 20px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    boxShadow: isActive ? `0 0 0 3px ${activeBorder}33` : 'none',
                    transition: 'all .15s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = tint; e.currentTarget.style.borderColor = activeBorder; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E6E3D8'; } }}
                >
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 28, lineHeight: 1, color: isActive ? activeText : '#23241C' }}>
                      {value}
                    </div>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: isActive ? activeText : '#9C9A8C', marginTop: 4 }}>
                      {label}
                    </div>
                  </div>
                  {isActive && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: activeBorder }}>▲</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Detail panel (rendered when a card is selected) ── */}
        {renderDetailPanel()}

        {/* ── Full activity timeline ── */}
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
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#C9C5B4', flexShrink: 0, minWidth: 30 }}>
                      {String(sessions.length - idx).padStart(2, '0')}
                    </span>
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.06em', color: '#9C9A8C' }}>{formatDate(session.date)}</div>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, color: '#CFCCBE' }}>{formatTime(session.date)}</div>
                    </div>
                    {cond ? (
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: conditionColor(cond), lineHeight: 1.1 }}>{skinPart} skin</div>
                        <div style={{ fontSize: 12, color: '#9C9A8C', marginTop: 2 }}>{acnePart === 'Acne' ? 'Acne present' : 'No acne'}</div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 13, color: '#9C9A8C' }}>No scan data</div>
                    )}
                    {session.selectedRemedy ? (
                      <span style={{ background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E6A2A', flexShrink: 0 }}>
                        🌿 {session.selectedRemedy.name}
                      </span>
                    ) : (
                      <span style={{ background: '#F8F6F0', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#CFCCBE', flexShrink: 0 }}>No remedy</span>
                    )}
                    {session.tracking?.enabled && (
                      <span style={{ background: '#EEF0DC', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7E9A3E', flexShrink: 0 }}>
                        {session.tracking.frequency} tracking
                      </span>
                    )}
                    <span style={{ color: '#B6B4A8', fontSize: 14, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #F0EDE4', padding: '20px 22px', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                      {session.detection && (
                        <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                          <SectionLabel>AI Analysis</SectionLabel>
                          {[
                            { label: 'Skin Type',   result: session.detection.skin_type,   conf: session.detection.skin_conf },
                            { label: 'Acne Status', result: session.detection.acne_status, conf: session.detection.acne_conf },
                          ].map(({ label, result, conf }) => (
                            <div key={label} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#6B6A60' }}>{label}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#5E6A2A' }}>{result} · {Math.round((conf ?? 0) * 100)}%</span>
                              </div>
                              <ConfBar value={conf} />
                            </div>
                          ))}
                        </div>
                      )}
                      {session.advices?.length > 0 && (
                        <div style={{ flex: '1 1 220px', minWidth: 220 }}>
                          <SectionLabel>Lifestyle Advice</SectionLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {session.advices.map(a => (
                              <div key={a.tag} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#3a3a2a', lineHeight: 1.45 }}>
                                <span style={{ flexShrink: 0 }}>{a.icon}</span>
                                <span>{a.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {session.answers && Object.keys(session.answers).length > 0 && (
                        <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                          <SectionLabel>Your Answers</SectionLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { key: 'water', label: '💧 Water' },
                              { key: 'stress', label: '🧘 Stress' },
                              { key: 'sleep', label: '🌙 Sleep' },
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
