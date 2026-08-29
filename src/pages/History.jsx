import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { loadHistory } from '../context/AppContext';

// ── Helpers ───────────────────────────────────────────────────
function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function conditionColor(cond) {
  if (!cond) return 'var(--color-muted)';
  if (cond.includes('Oily')) return '#2B8A6C';
  if (cond.includes('Dry'))  return '#B06030';
  return 'var(--color-brand-text)';
}
function conditionGradient(cond) {
  if (!cond) return 'linear-gradient(135deg,var(--color-tint-neutral),var(--color-field-border))';
  if (cond.includes('Oily')) return 'linear-gradient(135deg,#C8E8DC,#9DCFBC)';
  if (cond.includes('Dry'))  return 'linear-gradient(135deg,#F0D8B8,#E0B888)';
  return 'linear-gradient(135deg,#D8E8A8,#BECA5C44)';
}
function conditionIcon(cond) {
  if (!cond) return null;
  if (cond.includes('Oily')) return '#6BAF92';
  if (cond.includes('Dry'))  return 'var(--color-alert)';
  return 'var(--color-success)';
}

// ── SVG Icons ─────────────────────────────────────────────────
const ScanIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);
const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const ClipboardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .22s ease', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const FaceIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".4">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
    <path d="M9 15s1 2 3 2 3-2 3-2"/>
  </svg>
);
const DropIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// ── Shared sub-components ─────────────────────────────────────
function ConfBar({ value, color = 'var(--color-brand)', label, result }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--color-body)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{result} · {pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--color-tint-neutral)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

function Chip({ children, bg = 'var(--color-surface-tint)', color = 'var(--color-brand-text)', border = '#E2E7C9' }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: '999px', padding: '3px 10px', fontFamily: "'Spline Sans Mono'", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'inline-block' }}>
      {children}
    </span>
  );
}

// Scan card with graceful image fallback
// apiImageUrl = server-stored URL from /api/tracking/dashboard (never expires)
// det.image_url = blob URL from localStorage (expires on page reload)
function ScanCard({ s, idx, total, apiImageUrl }) {
  const [imgError, setImgError] = useState(false);
  const det  = s.detection;
  const cond = det.final_condition ?? '';
  const [skin, acne] = cond.split('_');
  const cc   = conditionColor(cond);
  const grad = conditionGradient(cond);

  // Prefer the API URL (permanent server link) over the local blob URL
  const imageUrl = apiImageUrl || det.image_url || null;

  return (
    <div className="sk-scan-card" style={{
      background: 'var(--color-surface)', border: '2px solid var(--color-field-border)', borderRadius: 18,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 6px 22px rgba(35,36,28,.12)',
      animationDelay: `${idx * 70}ms`,
    }}>
      {/* Hero area — image OR gradient fallback */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: grad }}>
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt="Skin scan"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        ) : (
          /* Condition-gradient fallback — informative even without photo */
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ color: cc }}><FaceIcon /></div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', color: cc, opacity: 0.65, textTransform: 'uppercase' }}>
              {imgError ? 'Photo unavailable' : 'No photo'}
            </div>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,30,10,.55) 0%, transparent 55%)' }} />
        {/* Scan number badge */}
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(35,36,28,.72)', backdropFilter: 'blur(6px)', borderRadius: '999px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: 'var(--color-brand)', letterSpacing: '.06em' }}>#{total - idx}</span>
        </div>
        {/* Condition tag bottom-right */}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <span style={{ background: 'rgba(246,244,236,.92)', backdropFilter: 'blur(6px)', borderRadius: '999px', padding: '4px 10px', fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: cc, border: `1px solid ${cc}44` }}>
            {acne === 'Acne' ? '⚠ Acne' : '✓ Clear'}
          </span>
        </div>
        {/* Skin type bottom-left */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 12px' }}>
          <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 20, color: '#F6F4EC', textShadow: '0 1px 6px rgba(0,0,0,.4)' }}>
            {skin} skin
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: 'var(--color-muted)', letterSpacing: '.04em' }}>
            {formatDate(s.date)} · {formatTime(s.date)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {acne === 'Acne'
              ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8A86C', display: 'inline-block', boxShadow: '0 0 0 2px #F0D5A844' }} />
              : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-brand)', display: 'inline-block', boxShadow: '0 0 0 2px #BECA5C33' }} />
            }
          </div>
        </div>

        {/* Confidence bars */}
        <div>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 8 }}>AI Confidence</div>
          <ConfBar label="Skin type" result={det.skin_type} value={det.skin_conf} color={cc} />
          <ConfBar label="Acne detection" result={det.acne_status === 'Acne' ? 'Acne' : 'Clear'} value={det.acne_conf} color={acne === 'Acne' ? '#E8A86C' : 'var(--color-brand)'} />
        </div>

        {/* Remedy chip */}
        {s.selectedRemedy && (
          <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-hairline)' }}>
            <Chip bg="var(--color-surface-tint)" color="var(--color-brand-text)" border="var(--color-header-line)">🌿 {s.selectedRemedy.name}</Chip>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel components ───────────────────────────────────────────
// ScansPanel uses API detections directly (server-stored image URLs, never expire).
// Falls back to localStorage sessions only if API returned nothing.
function ScansPanel({ sessions, apiDetections = [] }) {
  // Build remedy lookup from localStorage: { detection_id/id → selectedRemedy }
  const remedyMap = {};
  sessions.forEach(s => {
    const did = s.detection?.detection_id ?? s.detection?.id;
    if (did && s.selectedRemedy) remedyMap[did] = s.selectedRemedy;
  });

  if (apiDetections.length > 0) {
    // PRIMARY PATH — use API detections with their permanent image_url values
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {apiDetections.map((det, i) => {
          // Wrap API detection into a shape ScanCard expects
          const s = {
            detection: det,
            date: det.detected_at,
            selectedRemedy: remedyMap[det.id] ?? null,
          };
          return (
            <ScanCard
              key={det.id ?? i}
              s={s}
              idx={i}
              total={apiDetections.length}
              apiImageUrl={det.image_url}   // real server URL — always loads
            />
          );
        })}
      </div>
    );
  }

  // FALLBACK PATH — API unavailable, use localStorage sessions (images may be expired blobs)
  const scans = sessions.filter(s => s.detection);
  if (scans.length === 0) return <EmptyState icon={<ScanIcon />} msg="No scan data recorded yet." />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
      {scans.map((s, i) => (
        <ScanCard key={s.id ?? i} s={s} idx={i} total={scans.length} apiImageUrl={null} />
      ))}
    </div>
  );
}

function RemediesPanel({ sessions }) {
  const withRemedy = sessions.filter(s => s.selectedRemedy);
  if (withRemedy.length === 0) return <EmptyState icon={<LeafIcon />} msg="No remedies selected yet." />;

  const byRemedy = {};
  withRemedy.forEach(s => {
    const name = s.selectedRemedy.name;
    if (!byRemedy[name]) byRemedy[name] = { remedy: s.selectedRemedy, sessions: [] };
    byRemedy[name].sessions.push(s);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.values(byRemedy).map(({ remedy, sessions: rs }, i) => (
        <div key={remedy.name} className="sk-panel-row" style={{ background: 'var(--color-surface)', border: '2px solid var(--color-field-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(35,36,28,.10)', animationDelay: `${i * 60}ms` }}>
          {/* Header */}
          <div style={{ background: 'var(--color-surface-tint)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E8CC', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink)' }}>
                <LeafIcon />
              </div>
              <div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: 'var(--color-ink)', lineHeight: 1.1 }}>{remedy.name}</div>
                {remedy.category && <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-success)', marginTop: 3, letterSpacing: '.06em' }}>{remedy.category}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 32, color: 'var(--color-success)', lineHeight: 1 }}>{rs.length}</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: 'var(--color-muted)', marginTop: 2, letterSpacing: '.08em' }}>TIME{rs.length !== 1 ? 'S' : ''} SELECTED</div>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: '16px 22px' }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 8 }}>Prescribed for</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {[...new Set(rs.map(s => s.detection?.final_condition).filter(Boolean))].map(cond => (
                <span key={cond} style={{ background: conditionGradient(cond), borderRadius: '999px', padding: '4px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, color: conditionColor(cond), border: `1px solid ${conditionColor(cond)}44`, fontWeight: 600 }}>
                  {cond.replace('_', ' + ')}
                </span>
              ))}
            </div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 8 }}>Usage history</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {rs.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: 'var(--color-canvas)', borderRadius: 10, border: '1px solid var(--color-tint-neutral)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--color-ink)', fontWeight: 500 }}>{formatDate(s.date)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {s.tracking?.enabled && <Chip bg="var(--color-surface-tint)" color="var(--color-brand-text)" border="var(--color-header-line)">{s.tracking.frequency}</Chip>}
                    {s.detection?.final_condition && (
                      <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: conditionColor(s.detection.final_condition) }}>
                        {s.detection.final_condition.split('_')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingPanel({ sessions }) {
  const tracked = sessions.filter(s => s.tracking?.enabled);
  if (tracked.length === 0) return <EmptyState icon={<ChartIcon />} msg="No tracking enabled yet. Select a remedy and enable tracking to monitor your progress." />;

  const weekly  = tracked.filter(s => s.tracking.frequency === 'weekly').length;
  const monthly = tracked.filter(s => s.tracking.frequency === 'monthly').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 4 }}>
        {[
          { label: 'Weekly', val: weekly, color: 'var(--color-brand)', bg: 'var(--color-surface-tint)', border: 'var(--color-header-line)', days: '7 days' },
          { label: 'Monthly', val: monthly, color: '#9AA646', bg: 'var(--color-surface-tint)', border: '#D5DBA8', days: '30 days' },
        ].filter(r => r.val > 0).map(r => (
          <div key={r.label} style={{ background: r.bg, border: `1.5px solid ${r.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'center', minWidth: 40 }}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 34, color: r.color, lineHeight: 1 }}>{r.val}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>{r.label}</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-success)', marginTop: 2 }}>check-in · every {r.days}</div>
            </div>
          </div>
        ))}
      </div>

      {tracked.map((s, i) => (
        <div key={s.id ?? i} className="sk-panel-row" style={{ background: 'var(--color-surface)', border: '2px solid var(--color-field-border)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', boxShadow: '0 4px 14px rgba(35,36,28,.10)', animationDelay: `${i * 60}ms` }}>
          <div style={{ width: 56, height: 56, borderRadius: 13, flexShrink: 0, background: s.tracking.frequency === 'weekly' ? 'var(--color-surface-tint)' : 'var(--color-surface-tint)', border: '1.5px solid #D5DBA8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: 'var(--color-brand-text)', lineHeight: 1 }}>{s.tracking.frequency === 'weekly' ? '7' : '30'}</div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 7.5, color: 'var(--color-success)', letterSpacing: '.05em' }}>DAYS</div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--color-ink)' }}>
                {s.tracking.frequency === 'weekly' ? 'Weekly' : 'Monthly'} tracking
              </span>
              <Chip bg="var(--color-surface-tint)" color="var(--color-brand-text)" border="var(--color-brand)">Active</Chip>
            </div>
            {s.selectedRemedy && <div style={{ fontSize: 13, color: 'var(--color-text2)', marginBottom: 5 }}><span style={{ color: 'var(--color-muted)' }}>Remedy:</span> <strong>{s.selectedRemedy.name}</strong></div>}
            {s.detection?.final_condition && <div style={{ fontSize: 13, color: 'var(--color-text2)' }}><span style={{ color: 'var(--color-muted)' }}>Condition:</span> {s.detection.final_condition.replace('_', ' + ')}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: 'var(--color-muted)' }}>{formatDate(s.date)}</div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-muted)', marginTop: 2 }}>{formatTime(s.date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionsPanel({ sessions }) {
  if (sessions.length === 0) return <EmptyState icon={<ClipboardIcon />} msg="No sessions recorded yet." />;
  return (
    <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-field-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(35,36,28,.10)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 1fr 90px', gap: 10, padding: '12px 20px', background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-field-border)' }}>
        {['#', 'Date', 'Condition', 'Remedy', 'Track'].map(h => (
          <div key={h} style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>{h}</div>
        ))}
      </div>
      {sessions.map((s, i) => {
        const cond = s.detection?.final_condition;
        const [skin, acne] = cond ? cond.split('_') : [null, null];
        return (
          <div key={s.id ?? i} className="sk-panel-row" style={{
            display: 'grid', gridTemplateColumns: '44px 1fr 1fr 1fr 90px', gap: 10,
            padding: '13px 20px', borderBottom: i < sessions.length - 1 ? '1px solid var(--color-hairline)' : 'none',
            alignItems: 'center', animationDelay: `${i * 40}ms`,
          }}>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 15, color: '#C9C5B4' }}>{String(sessions.length - i).padStart(2, '0')}</div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--color-ink)', fontWeight: 500 }}>{formatDate(s.date)}</div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-muted)' }}>{formatTime(s.date)}</div>
            </div>
            <div>
              {skin
                ? <><div style={{ fontSize: 12.5, color: conditionColor(cond), fontWeight: 600 }}>{skin}</div><div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{acne === 'Acne' ? 'Acne' : 'Clear'}</div></>
                : <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>—</span>
              }
            </div>
            <div style={{ fontSize: 12, color: s.selectedRemedy ? '#3E6A1A' : 'var(--color-muted)', fontWeight: s.selectedRemedy ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.selectedRemedy ? s.selectedRemedy.name : '—'}
            </div>
            <div>
              {s.tracking?.enabled ? <Chip bg="var(--color-surface-tint)" color="var(--color-brand-text)" border="var(--color-brand)">{s.tracking.frequency}</Chip>
                : <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ padding: '52px 24px', textAlign: 'center', background: 'var(--color-surface)', border: '1.5px dashed var(--color-field-border)', borderRadius: 16 }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F0EDE3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#BCBAB0' }}>{icon}</div>
      <div style={{ fontSize: 14, color: 'var(--color-muted)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>{msg}</div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function History() {
  const navigate   = useNavigate();
  const { state }  = useApp();
  const [sessions,     setSessions]     = useState([]);
  const [expandedId,   setExpandedId]   = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  // API detections fetched fresh — these have permanent server-stored image_url values
  const [apiDetections, setApiDetections] = useState([]);

  useEffect(() => {
    if (state.user?.id) setSessions(loadHistory(state.user.id));
  }, [state.user]);

  // Mirror exactly what Progress page does: fetch /api/tracking/dashboard for real image URLs
  useEffect(() => {
    if (!state.user) return;
    const token = sessionStorage.getItem('skinora_token');
    if (!token) return;
    fetch('/api/tracking/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setApiDetections(data.detections ?? []))
      .catch(() => {});
  }, [state.user]);

  const userName    = state.user?.name  ?? 'User';
  const userEmail   = state.user?.email ?? '';
  const userInitial = userName.charAt(0).toUpperCase();

  const totalScans    = apiDetections.length || sessions.filter(s => s.detection).length;
  const totalRemedies = sessions.filter(s => s.selectedRemedy).length;
  const trackingOn    = sessions.filter(s => s.tracking?.enabled).length;
  const latestCond    = sessions[0]?.detection?.final_condition ?? null;

  const CARDS = [
    { id: 'scans',    label: 'Skin Scans',       value: totalScans,      Icon: ScanIcon,      grad: 'var(--color-surface-tint)', activeBorder: 'var(--color-brand)', activeText: 'var(--color-brand-text)' },
    { id: 'remedies', label: 'Remedies Used',     value: totalRemedies,   Icon: LeafIcon,      grad: 'linear-gradient(135deg,#F0F4E8,#E4ECCC)', activeBorder: '#9AB862', activeText: '#4A5C1E' },
    { id: 'tracking', label: 'Tracking Plans',    value: trackingOn,      Icon: ChartIcon,     grad: 'linear-gradient(135deg,#F4F6EC,#E8EDCC)', activeBorder: '#B0B87A', activeText: '#575E1E' },
    { id: 'sessions', label: 'Total Sessions',    value: sessions.length, Icon: ClipboardIcon, grad: 'var(--color-tint-neutral)', activeBorder: '#C8C4B0', activeText: 'var(--color-text2)' },
  ];

  function toggleCard(id) { setSelectedCard(p => p === id ? null : id); }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

    @keyframes sk-fade-up  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes sk-card-in  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes sk-panel-in { from { opacity:0; transform:scaleY(.96); }    to { opacity:1; transform:scaleY(1); } }
    @keyframes sk-expand   { from { opacity:0; max-height:0; }             to { opacity:1; max-height:2000px; } }

    .sk-scan-card  { animation: sk-card-in .35s ease both; }
    .sk-scan-card:hover { transform:translateY(-4px); box-shadow:0 14px 38px rgba(94,106,42,.16) !important; transition:transform .18s, box-shadow .18s; }

    .sk-panel-row  { animation: sk-card-in .3s ease both; }

    .sk-stat-card  { animation: sk-fade-up .3s ease both; transition: transform .18s, box-shadow .18s, border-color .15s, background .15s; }
    .sk-stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(94,106,42,.14) !important; }

    .sk-detail-panel { animation: sk-panel-in .25s cubic-bezier(.34,1.2,.64,1) both; transform-origin: top; }

    .sk-timeline-row { transition: background .15s; cursor: pointer; }
    .sk-timeline-row:hover { background: var(--color-surface-tint) !important; }

    .sk-new-btn { transition: background .15s, transform .14s, box-shadow .15s; }
    .sk-new-btn:hover { background: #AABA4A !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(190,202,92,.38); }

    @media (max-width: 700px) {
      .sk-profile-grid { flex-direction: column !important; align-items: flex-start !important; }
      .sk-stats-grid   { grid-template-columns: 1fr 1fr !important; }
      .sk-sessions-table { display: none !important; }
      .sk-sessions-mobile { display: flex !important; }
    }
    @media (min-width: 701px) {
      .sk-sessions-mobile { display: none !important; }
    }
  `;

  return (
    <div style={{ background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />
      <style>{css}</style>

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '36px 36px 72px' }}>

        {/* ── Profile header ── */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 22, padding: '32px 36px', marginBottom: 28, border: '2px solid #D4DEB8', boxShadow: '0 6px 28px rgba(94,106,42,.13)', overflow: 'hidden', position: 'relative' }}>
          {/* Subtle decorative circles */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(190,202,92,.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(190,202,92,.08)', pointerEvents: 'none' }} />

          <div className="sk-profile-grid" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,var(--color-brand),var(--color-brand-deep2))', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 36, flexShrink: 0, boxShadow: '0 4px 16px rgba(190,202,92,.35)', fontWeight: 400 }}>
              {userInitial}
            </div>

            {/* Name + email */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: 4 }}>Account</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 34, margin: '0 0 5px', letterSpacing: '-.01em', color: 'var(--color-ink)' }}>{userName}</h2>
              <div style={{ fontSize: 13.5, color: 'var(--color-muted)' }}>{userEmail}</div>
            </div>

            {/* Latest condition */}
            {latestCond && (
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 6 }}>Current condition</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, color: conditionColor(latestCond), lineHeight: 1 }}>
                  {latestCond.replace('_', ' + ')}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Stat cards ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>
            Tap a card to view details
          </div>
          <div className="sk-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {CARDS.map(({ id, label, value, Icon, grad, activeBorder, activeText }, i) => {
              const isActive = selectedCard === id;
              return (
                <button key={id} className="sk-stat-card"
                  onClick={() => toggleCard(id)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 12,
                    background: isActive ? grad : 'var(--color-surface)',
                    border: `2px solid ${isActive ? activeBorder : 'var(--color-field-border)'}`,
                    borderRadius: 16, padding: '20px 20px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    boxShadow: isActive ? `0 8px 28px ${activeBorder}44` : '0 4px 14px rgba(35,36,28,.10)',
                    animationDelay: `${i * 60}ms`,
                  }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isActive ? 'rgba(255,255,255,.6)' : 'var(--color-surface-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? activeText : 'var(--color-success)', border: `1px solid ${isActive ? activeBorder + '44' : '#E4E8CC'}` }}>
                    <Icon />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 34, lineHeight: 1, color: isActive ? activeText : 'var(--color-ink)' }}>{value}</div>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: isActive ? activeText : 'var(--color-muted)', marginTop: 5 }}>{label}</div>
                  </div>
                  {isActive && (
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: activeBorder }}>
                      <ChevronIcon open={true} />
                      <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase' }}>Collapse</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Detail panel ── */}
        {selectedCard && (() => {
          const cfg = CARDS.find(c => c.id === selectedCard);
          return (
            <div className="sk-detail-panel" style={{ marginBottom: 32, border: `2px solid ${cfg.activeBorder}`, borderRadius: 18, overflow: 'hidden', boxShadow: `0 8px 32px ${cfg.activeBorder}44` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', background: cfg.grad, borderBottom: `1px solid ${cfg.activeBorder}44` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: cfg.activeText }}><cfg.Icon /></div>
                  <div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: 'var(--color-ink)', lineHeight: 1 }}>{cfg.label}</div>
                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-muted)', marginTop: 3 }}>{cfg.value} record{cfg.value !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedCard(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.07)', border: 'none', cursor: 'pointer', color: 'var(--color-text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
              </div>
              <div style={{ padding: '22px 22px' }}>
                {selectedCard === 'scans'    && <ScansPanel    sessions={sessions} apiDetections={apiDetections} />}
                {selectedCard === 'remedies' && <RemediesPanel sessions={sessions} />}
                {selectedCard === 'tracking' && <TrackingPanel sessions={sessions} />}
                {selectedCard === 'sessions' && <SessionsPanel sessions={sessions} />}
              </div>
            </div>
          );
        })()}

        {/* ── Activity timeline ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>Timeline</div>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 28, margin: 0, letterSpacing: '-.01em', color: 'var(--color-ink)' }}>Activity History</h3>
          </div>
          <button className="sk-new-btn" onClick={() => navigate('/guidelines')}
            style={{ background: 'var(--color-brand)', color: 'var(--color-brand-ink)', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 4px 14px rgba(190,202,92,.3)' }}>
            + New scan
          </button>
        </div>

        {sessions.length === 0 ? (
          <EmptyState icon={<ScanIcon />} msg="Complete your first skin scan to see your activity history here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(showAllSessions ? sessions : sessions.slice(0, 5)).map((session, idx) => {
              const isExpanded = expandedId === session.id;
              const cond = session.detection?.final_condition;
              const [skinPart, acnePart] = cond ? cond.split('_') : ['—', '—'];
              const cc = conditionColor(cond);
              const isLast = idx === sessions.length - 1;

              return (
                <div key={session.id} style={{ position: 'relative' }}>
                  {/* Timeline connector */}
                  {!isLast && (
                    <div style={{ position: 'absolute', left: 33, top: 62, bottom: -14, width: 2, background: 'var(--color-hairline)', zIndex: 0 }} />
                  )}

                  <div style={{ background: 'var(--color-surface)', border: `2px solid ${isExpanded ? '#B8CC60' : 'var(--color-field-border)'}`, borderRadius: 16, overflow: 'hidden', marginBottom: 14, position: 'relative', zIndex: 1, boxShadow: isExpanded ? '0 8px 28px rgba(94,106,42,.16)' : '0 4px 14px rgba(35,36,28,.10)' }}>

                    {/* Row header */}
                    <button className="sk-timeline-row"
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '18px 22px', background: isExpanded ? 'var(--color-surface-tint)' : 'var(--color-surface)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>

                      {/* Session number dot */}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: isExpanded ? 'var(--color-brand)' : 'var(--color-surface-tint)', border: `2px solid ${isExpanded ? 'var(--color-brand)' : '#E4E8CC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s, border-color .2s' }}>
                        <span style={{ fontFamily: "'Newsreader',serif", fontSize: 15, color: isExpanded ? 'var(--color-ink)' : '#C9C5B4', lineHeight: 1 }}>
                          {String(sessions.length - idx).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Date */}
                      <div style={{ flexShrink: 0, minWidth: 100 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--color-ink)', fontWeight: 600 }}>{formatDate(session.date)}</div>
                        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9.5, color: 'var(--color-muted)', marginTop: 2 }}>{formatTime(session.date)}</div>
                      </div>

                      {/* Condition */}
                      {cond ? (
                        <div style={{ flex: 1, minWidth: 130 }}>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: cc, lineHeight: 1.1 }}>{skinPart} skin</div>
                          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>{acnePart === 'Acne' ? 'Acne present' : 'No acne'}</div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, fontSize: 13, color: 'var(--color-muted)' }}>No scan data</div>
                      )}

                      {/* Remedy pill */}
                      {session.selectedRemedy ? (
                        <span style={{ background: 'var(--color-surface-tint)', border: '1px solid var(--color-header-line)', borderRadius: '999px', padding: '5px 13px', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-brand-text)', flexShrink: 0 }}>
                          🌿 {session.selectedRemedy.name}
                        </span>
                      ) : (
                        <span style={{ background: '#F4F2EC', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>No remedy</span>
                      )}

                      {/* Tracking badge */}
                      {session.tracking?.enabled && (
                        <span style={{ background: 'var(--color-surface-tint)', borderRadius: '999px', padding: '5px 12px', fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-success)', flexShrink: 0, border: '1px solid #D5DBA8' }}>
                          {session.tracking.frequency}
                        </span>
                      )}

                      <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}><ChevronIcon open={isExpanded} /></span>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ borderTop: '1.5px solid #E8EDD8', padding: '22px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, background: '#FAFDF4' }}>

                        {/* AI Analysis */}
                        {session.detection && (
                          <div>
                            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>AI Analysis</div>
                            <ConfBar label="Skin type"   result={session.detection.skin_type}   value={session.detection.skin_conf}  color={cc} />
                            <ConfBar label="Acne status" result={session.detection.acne_status === 'Acne' ? 'Acne' : 'Clear'} value={session.detection.acne_conf} color={acnePart === 'Acne' ? '#E8A86C' : 'var(--color-brand)'} />
                            <div style={{ marginTop: 10, padding: '10px 14px', background: conditionGradient(cond), borderRadius: 10, border: `1px solid ${cc}33` }}>
                              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: cc, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                {cond?.replace('_', ' + ') ?? '—'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Lifestyle Advice */}
                        {session.advices?.length > 0 && (
                          <div>
                            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Lifestyle Advice</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                              {session.advices.map(a => (
                                <div key={a.tag} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-hairline)' }}>
                                  <span style={{ flexShrink: 0, fontSize: 16 }}>{a.icon}</span>
                                  <span style={{ fontSize: 12.5, color: 'var(--color-ink)', lineHeight: 1.5 }}>{a.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Questionnaire answers */}
                        {session.answers && Object.keys(session.answers).length > 0 && (
                          <div>
                            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Your Profile</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {[
                                { key: 'water',  label: 'Water intake', Icon: DropIcon,  color: '#4A90D9' },
                                { key: 'stress', label: 'Stress level',  Icon: ZapIcon,   color: '#E8A86C' },
                                { key: 'sleep',  label: 'Sleep quality', Icon: MoonIcon,  color: '#7E6ABF' },
                              ].map(({ key, label, Icon, color }) => session.answers[key] ? (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-hairline)' }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                                    <Icon />
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginTop: 1 }}>{session.answers[key]}</div>
                                  </div>
                                </div>
                              ) : null)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* View all / collapse button */}
            {sessions.length > 5 && (
              <button
                onClick={() => setShowAllSessions(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', marginTop: 10, padding: '14px',
                  background: showAllSessions ? 'var(--color-surface-tint)' : 'var(--color-surface)',
                  border: '2px solid var(--color-field-border)', borderRadius: 14,
                  fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5,
                  color: 'var(--color-brand-text)', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(35,36,28,.06)',
                  transition: 'background .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-tint)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(94,106,42,.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = showAllSessions ? 'var(--color-surface-tint)' : 'var(--color-surface)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(35,36,28,.06)'; }}
              >
                {showAllSessions ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    Show less
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    View all {sessions.length} activities
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ── Medical disclaimer ── */}
        <div style={{ marginTop: 36, background: 'var(--color-alert-bg)', border: '1px solid color-mix(in srgb, var(--color-alert-strong) 25%, transparent)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'color-mix(in srgb, var(--color-alert-strong) 15%, var(--color-alert-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-alert-strong)', fontSize: 16 }}>⚕</div>
          <p style={{ fontSize: 12.5, color: 'var(--color-alert-strong)', lineHeight: 1.65, margin: 0 }}>
            <strong>Medical Disclaimer:</strong> Skinora recommendations are for educational purposes only and are not a substitute for professional medical advice. Consult a qualified dermatologist for persistent skin conditions.
          </p>
        </div>
      </main>
    </div>
  );
}
