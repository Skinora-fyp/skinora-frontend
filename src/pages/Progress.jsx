import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { detect, compareProgress, checkTrackingDue, getNotificationCount, downloadProgressReport, toggleReminders } from '../api';

const STATUS_CONFIG = {
  better:      { label: 'Improving',       color: '#3E7A2A', bg: '#F0FAF0', dot: '#5CB85C' },
  no_progress: { label: 'No change yet',   color: 'var(--color-warn-strong)', bg: 'var(--color-warn-bg)', dot: '#F0AD4E' },
  worse:       { label: 'Needs attention', color: 'var(--color-alert-strong)', bg: 'var(--color-alert-bg)', dot: '#D9534F' },
};

const PROGRESS_CONFIG = {
  improved:  {
    label: 'Skin improved',
    icon: '↑',
    accent: '#3E7A2A', bg: '#F0FAF0', border: '#A8D5A2',
    msg: 'Your skin is responding well to the remedy — keep going!',
    badge: { bg: '#EBF7EB', text: '#3E7A2A', border: '#A8D5A2' },
  },
  no_change: {
    label: 'No change yet',
    icon: '→',
    accent: 'var(--color-warn-strong)', bg: 'var(--color-warn-bg)', border: 'var(--color-warn-border)',
    msg: 'Some remedies take 2–4 weeks to show results. Give it more time or explore alternatives.',
    badge: { bg: 'var(--color-warn-bg)', text: 'var(--color-warn-strong)', border: 'var(--color-warn-border)' },
  },
  worse: {
    label: 'Needs attention',
    icon: '↓',
    accent: 'var(--color-alert-strong)', bg: 'var(--color-alert-bg)', border: '#EDBBAA',
    msg: 'Your skin may have reacted. Consider switching remedies or consulting a specialist.',
    badge: { bg: '#FDF0EC', text: 'var(--color-alert-strong)', border: '#EDBBAA' },
  },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  return `In ${diff} day${diff !== 1 ? 's' : ''}`;
}

// ── SVG Icons ──────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .22s ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// Persist comparison results across page refreshes (within browser session)
function loadStoredResults() {
  try { return JSON.parse(sessionStorage.getItem('sk_checkin_results') ?? '{}'); }
  catch { return {}; }
}

function saveStoredResults(obj) {
  try { sessionStorage.setItem('sk_checkin_results', JSON.stringify(obj)); } catch {}
}

export default function Progress() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [tracking,       setTracking]       = useState(null);
  const [detections,     setDetections]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [remindersPaused, setRemindersPaused] = useState(false);
  const [togglingReminder, setTogglingReminder] = useState(false);

  const [preview,        setPreview]        = useState(null);
  const [scanning,       setScanning]       = useState(false);
  const [scanResult,     setScanResult]     = useState(null);
  const [faceError,      setFaceError]      = useState(null);
  const [expandedId,     setExpandedId]     = useState(null);
  const [showAll,        setShowAll]        = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Comparison results keyed by detection_id — persisted in sessionStorage
  const [checkinResults, setCheckinResults] = useState(loadStoredResults);

  const fileRef    = useRef(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [cameraErr,   setCameraErr]   = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode,  setFacingMode]  = useState('user');

  useEffect(() => {
    if (!state.user) return;
    const token = sessionStorage.getItem('skinora_token');
    fetch('/api/tracking/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const active = (data.trackings ?? []).find(t => t.is_active) ?? (data.trackings ?? [])[0] ?? null;
        setTracking(active);
        setRemindersPaused(active?.reminders_paused ?? false);
        setDetections(data.detections ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state.user]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  useEffect(() => () => stopStream(), []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function openCamera(mode = facingMode) {
    setCameraErr(null); setCameraReady(false); stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setCameraOpen(true);
    } catch (err) {
      setCameraErr(
        err.name === 'NotAllowedError' ? 'Camera access denied. Allow camera in browser settings.' :
        err.name === 'NotFoundError'   ? 'No camera found. Upload a photo instead.' :
        'Could not start camera. Please upload a photo instead.'
      );
    }
  }

  function closeCamera() { stopStream(); setCameraOpen(false); setCameraErr(null); setCameraReady(false); }

  function capturePhoto() {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      closeCamera();
      setFaceError(null);
      setPreview({ url: URL.createObjectURL(blob), file: new File([blob], 'checkin.jpg', { type: 'image/jpeg' }) });
    }, 'image/jpeg', 0.92);
  }

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be ≤ 10 MB.'); return; }
    setFaceError(null);
    setPreview({ url: URL.createObjectURL(file), file });
  }, []);

  async function runCheckin() {
    if (!preview) return;
    setScanning(true); setFaceError(null);
    try {
      const fd = new FormData();
      fd.append('image', preview.file);
      const res  = await detect(fd);
      const data = res.data;

      let comparison = null;
      if (data.detection_id) {
        try {
          const cmpRes = await compareProgress({ detection_id: data.detection_id });
          comparison = cmpRes.data;
          dispatch({ type: 'SET_CHECKIN_PROGRESS', payload: comparison });

          // ── Persist comparison result keyed by detection_id ────────────
          const updated = { ...checkinResults, [data.detection_id]: { ...comparison, checkedAt: new Date().toISOString() } };
          setCheckinResults(updated);
          saveStoredResults(updated);

          getNotificationCount()
            .then(r => dispatch({ type: 'SET_PENDING_CHECKINS', payload: r.data.count }))
            .catch(() => {});
          checkTrackingDue()
            .then(r => dispatch({ type: 'SET_TRACKING_DUE', payload: r.data }))
            .catch(() => {});
        } catch {}
      }

      setScanResult({ detection: data, comparison });

      // Refresh history
      const token = sessionStorage.getItem('skinora_token');
      fetch('/api/tracking/dashboard', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          setDetections(d.detections ?? []);
          const upd = (d.trackings ?? []).find(t => t.is_active) ?? (d.trackings ?? [])[0] ?? null;
          if (upd) { setTracking(upd); setRemindersPaused(upd.reminders_paused ?? false); }
        })
        .catch(() => {});

    } catch (err) {
      setFaceError(err.response?.data?.error || 'No face detected. Please use a clear, well-lit face photo.');
    } finally {
      setScanning(false);
    }
  }

  async function handleDownloadPdf() {
    const detId = scanResult?.detection?.detection_id;
    if (!detId || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const res = await downloadProgressReport(detId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = 'skinora-progress-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleToggleReminders() {
    if (!tracking || togglingReminder) return;
    const next = !remindersPaused;
    setTogglingReminder(true);
    try {
      await toggleReminders(tracking.id, next);
      setRemindersPaused(next);
    } catch {}
    setTogglingReminder(false);
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
        <AppHeader activeStep="track" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 20 }}>
          <div className="sk-loader-ring" />
          <span style={{ color: 'var(--color-muted)', fontSize: 14, fontFamily: "'Spline Sans Mono'", letterSpacing: '.08em' }}>Loading your progress…</span>
        </div>
        <style>{`@keyframes sk-spin { to { transform: rotate(360deg); } } .sk-loader-ring { width:40px;height:40px;border:3px solid var(--color-hairline);border-top-color:var(--color-brand);border-radius:50%;animation:sk-spin .8s linear infinite; }`}</style>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div style={{ background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
        <AppHeader activeStep="track" />
        <main style={{ maxWidth: 520, margin: '0 auto', padding: '100px 32px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-surface-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 24px rgba(94,106,42,.18)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 32, letterSpacing: '-.02em', margin: '0 0 14px', color: 'var(--color-ink)' }}>
            No active tracking yet.
          </h2>
          <p style={{ fontSize: 14.5, color: 'var(--color-body)', lineHeight: 1.7, marginBottom: 32 }}>
            Complete a skin scan, select a remedy, and set up progress tracking to see your journey here.
          </p>
          <button onClick={() => navigate('/upload')}
            style={{ background: 'var(--color-brand)', color: 'var(--color-brand-ink)', border: 'none', borderRadius: '999px', padding: '14px 32px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(190,202,92,.35)' }}>
            Start a skin scan →
          </button>
        </main>
      </div>
    );
  }

  const isDue     = state.trackingDue?.due ?? false;
  const statusCfg = STATUS_CONFIG[tracking.last_status] ?? { label: 'Tracking active', color: 'var(--color-brand-text)', bg: 'var(--color-surface-tint)', dot: 'var(--color-brand)' };
  const comparedCount = Object.keys(checkinResults).length;
  const displayedDetections = showAll ? detections : detections.slice(0, 5);

  const ghostBtn = {
    background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,.3)', color: '#F6F4EC',
    borderRadius: 9, padding: '8px 16px', fontFamily: "'Hanken Grotesk'",
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

    @keyframes sk-spin     { to { transform: rotate(360deg); } }
    @keyframes sk-card-in  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes sk-expand   { from { opacity:0; transform:scaleY(.94); } to { opacity:1; transform:scaleY(1); } }
    @keyframes sk-pulse-ring {
      0%  { transform: scale(1);   opacity: .9; }
      70% { transform: scale(2.4); opacity: 0;  }
      100%{ transform: scale(1);   opacity: 0;  }
    }

    .sk-hist-card {
      animation: sk-card-in .3s ease both;
      cursor: pointer;
      transition: box-shadow .18s, border-color .15s, background .15s;
    }
    .sk-hist-card:hover { box-shadow: 0 6px 22px rgba(35,36,28,.1) !important; }

    .sk-expand-panel {
      animation: sk-expand .22s cubic-bezier(.34,1.2,.64,1) both;
      transform-origin: top;
    }

    .sk-pulse-dot {
      position: relative;
      display: inline-block;
      border-radius: 50%;
    }
    .sk-pulse-dot::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: inherit;
      animation: sk-pulse-ring 1.8s ease-out infinite;
    }

    .sk-view-all-btn { transition: background .15s, color .15s, transform .14s; }
    .sk-view-all-btn:hover { background: var(--color-brand) !important; color: var(--color-brand-ink) !important; transform: translateY(-1px); }

    .sk-upload-opt { transition: background .15s, border-color .15s, transform .15s, box-shadow .15s; }
    .sk-upload-opt:hover { background: var(--color-surface-tint) !important; border-color: var(--color-brand) !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(94,106,42,.14); }

    .sk-scan-btn { transition: background .15s, transform .14s, box-shadow .15s; }
    .sk-scan-btn:hover:not(:disabled) { background: #AABA4A !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(190,202,92,.38); }

    .sk-compared-badge { display: inline-flex; align-items: center; gap: 4px; font-family: 'Spline Sans Mono'; font-size: 9px; letter-spacing: .06em; text-transform: uppercase; color: #3E7A2A; background: #EBF7EB; border: 1px solid #A8D5A2; padding: 2px 8px; border-radius: 5px; }

    @media (max-width: 800px) {
      .sk-progress-grid { flex-direction: column !important; }
    }
  `;

  return (
    <div style={{ background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <style>{css}</style>

      {/* ── Camera modal ── */}
      {cameraOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,15,12,.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={closeCamera} style={ghostBtn}>✕ Close</button>
            <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Progress Check-in</span>
            <button onClick={() => openCamera(facingMode === 'user' ? 'environment' : 'user')} style={ghostBtn}>⇄ Flip</button>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
            {!cameraReady && <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 14 }}>Starting camera…</div>}
            <video ref={videoRef} autoPlay playsInline muted
              onLoadedData={() => setCameraReady(true)}
              style={{ width: '100%', borderRadius: 16, transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', display: cameraReady ? 'block' : 'none' }} />
            <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 260, border: '2.5px solid rgba(190,202,92,.85)', borderRadius: '50%', pointerEvents: 'none' }} />
          </div>
          {cameraErr && <div style={{ color: '#F5A623', fontSize: 13, marginTop: 14, padding: '0 32px', textAlign: 'center' }}>{cameraErr}</div>}
          {cameraReady && (
            <button onClick={capturePhoto} style={{ marginTop: 28, width: 68, height: 68, borderRadius: '50%', background: 'var(--color-brand)', border: '4px solid rgba(255,255,255,.5)', cursor: 'pointer', flexShrink: 0 }} />
          )}
          <div style={{ marginTop: 14, fontFamily: "'Spline Sans Mono'", fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em' }}>
            Same lighting as your baseline scan for best comparison
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 70px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 10 }}>
            Progress Tracking
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 40, letterSpacing: '-.025em', margin: 0, color: 'var(--color-ink)', lineHeight: 1.1 }}>
              Your skin journey.
            </h2>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: statusCfg.bg, color: statusCfg.color, fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: '999px', border: `1px solid ${statusCfg.dot}55` }}>
                <span className="sk-pulse-dot" style={{ width: 8, height: 8, background: statusCfg.dot, display: 'inline-block' }} />
                {statusCfg.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-canvas-alt)', color: 'var(--color-text2)', fontSize: 12.5, padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--color-field-border)' }}>
                🌿 {tracking.remedy_name ?? 'Active remedy'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDue ? 'var(--color-surface-tint)' : 'var(--color-canvas-alt)', color: isDue ? 'var(--color-brand-text)' : 'var(--color-text2)', fontSize: 12.5, padding: '6px 14px', borderRadius: '999px', border: `1px solid ${isDue ? 'var(--color-brand)' : 'var(--color-field-border)'}`, fontWeight: isDue ? 700 : 400 }}>
                {isDue ? '📅 Check-in due now' : `🔔 Next: ${daysUntil(tracking.next_reminder) ?? '—'}`}
              </span>
              <button
                onClick={handleToggleReminders}
                disabled={togglingReminder}
                title={remindersPaused ? 'Turn email reminders back on' : 'Pause email reminders'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: remindersPaused ? 'var(--color-canvas)' : 'var(--color-surface-tint)',
                  color: remindersPaused ? 'var(--color-muted)' : 'var(--color-brand-text)',
                  fontSize: 12.5, padding: '6px 14px', borderRadius: '999px',
                  border: `1.5px solid ${remindersPaused ? 'var(--color-field-border)' : '#B8CC70'}`,
                  fontFamily: "'Hanken Grotesk'", fontWeight: 600,
                  cursor: togglingReminder ? 'default' : 'pointer',
                  opacity: togglingReminder ? 0.65 : 1,
                  transition: 'background .14s, color .14s, border-color .14s',
                }}
              >
                {remindersPaused ? '🔕 Reminders off' : '🔔 Reminders on'}
              </button>
            </div>
          </div>
        </div>

        {/* ── How tracking works — only when there are no compared results yet ── */}
        {comparedCount === 0 && detections.length > 1 && (
          <div style={{ background: 'var(--color-surface-tint)', border: '1px solid var(--color-header-line)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-ink)' }}>
              <InfoIcon />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-ink)', marginBottom: 4 }}>How progress tracking works</div>
              <div style={{ fontSize: 13, color: 'var(--color-brand-text)', lineHeight: 1.6 }}>
                Each time a check-in is due, upload a new face photo on the right. Skinora's AI compares it to your
                <strong> baseline scan</strong> and measures how your skin has changed. Results are saved in your history below.
              </div>
            </div>
          </div>
        )}

        <div className="sk-progress-grid" style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ══════════════════════════════════════════
              LEFT — Scan History
          ══════════════════════════════════════════ */}
          <div style={{ flex: '1 1 340px', minWidth: 290 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                  Scan History
                </div>
                <div style={{ fontSize: 12, color: '#BCBAB0', marginTop: 2 }}>
                  {detections.length} upload{detections.length !== 1 ? 's' : ''}
                  {comparedCount > 0 && <span style={{ color: '#5CB85C', fontWeight: 600 }}> · {comparedCount} compared this session</span>}
                </div>
              </div>
              {isDue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--color-surface-tint)', border: '1px solid var(--color-brand)', borderRadius: '999px', padding: '4px 11px' }}>
                  <span className="sk-pulse-dot" style={{ width: 7, height: 7, background: 'var(--color-brand)', display: 'inline-block' }} />
                  <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-brand-text)', fontWeight: 600 }}>Check-in due</span>
                </div>
              )}
            </div>

            {detections.length === 0 ? (
              <div style={{ background: 'var(--color-surface)', border: '1.5px dashed var(--color-field-border)', borderRadius: 16, padding: '36px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0EDE3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#BCBAB0' }}>
                  <CameraIcon />
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>No scans yet — upload your first photo to get started.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {displayedDetections.map((det, idx) => {
                    const isBaseline = det.id === tracking.detection_id;
                    const isExpanded = expandedId === det.id;
                    const result     = checkinResults[det.id] ?? null; // comparison result if available
                    const pc         = result ? (PROGRESS_CONFIG[result.progress] ?? PROGRESS_CONFIG.no_change) : null;

                    return (
                      <div key={det.id} style={{ animationDelay: `${idx * 55}ms` }}>

                        {/* History card row */}
                        <div
                          className="sk-hist-card"
                          onClick={() => setExpandedId(isExpanded ? null : det.id)}
                          style={{
                            display: 'flex', gap: 13, alignItems: 'center',
                            background: isExpanded ? 'var(--color-surface-tint)' : 'var(--color-surface)',
                            border: `1.5px solid ${
                              isBaseline ? 'var(--color-brand)'
                              : pc       ? pc.border
                              : isExpanded ? '#C8D88A' : 'var(--color-hairline)'
                            }`,
                            borderRadius: isExpanded ? '13px 13px 0 0' : 13,
                            padding: '12px 14px',
                            boxShadow: isExpanded ? '0 4px 16px rgba(94,106,42,.1)' : '0 2px 8px rgba(35,36,28,.05)',
                          }}
                        >
                          {/* Thumbnail */}
                          <div style={{
                            width: 60, height: 60, borderRadius: 11, overflow: 'hidden', flexShrink: 0,
                            background: 'var(--color-tint-neutral)', border: `1.5px solid ${pc ? pc.border : 'var(--color-field-border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', transition: 'border-color .15s',
                          }}>
                            {det.image_url
                              ? <img src={det.image_url} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ color: '#BCBAB0' }}><CameraIcon /></span>
                            }
                            {/* Compared indicator — green circle check */}
                            {pc && (
                              <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: pc.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-surface)' }}>
                                <CheckIcon size={9} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                              <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: 'var(--color-brand-text)', background: 'var(--color-surface-tint)', padding: '2px 8px', borderRadius: 5, border: '1px solid var(--color-header-line)' }}>
                                {det.final_condition}
                              </span>
                              {isBaseline && (
                                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-brand-deep2)', background: 'var(--color-surface-tint)', border: '1px solid var(--color-brand)', padding: '2px 7px', borderRadius: 5 }}>
                                  Baseline
                                </span>
                              )}
                              {idx === 0 && !isBaseline && !pc && (
                                <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9AA646', background: 'var(--color-surface-tint)', padding: '2px 7px', borderRadius: 5 }}>
                                  Latest
                                </span>
                              )}
                              {pc && (
                                <span className="sk-compared-badge">
                                  <CheckIcon size={9} /> {pc.label}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--color-ink)', fontWeight: 600, marginBottom: 3 }}>
                              {det.skin_type} skin · {det.acne_status === 'Acne' ? 'Acne present' : 'No acne'}
                            </div>
                            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: 'var(--color-muted)', letterSpacing: '.04em' }}>
                              {formatDate(det.detected_at)}
                              {pc && result.checkedAt && (
                                <span style={{ color: 'var(--color-success)' }}> · compared {formatDate(result.checkedAt)}</span>
                              )}
                            </div>
                          </div>

                          <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}>
                            <ChevronIcon open={isExpanded} />
                          </span>
                        </div>

                        {/* ── Expanded panel ── */}
                        {isExpanded && (
                          <div className="sk-expand-panel"
                            style={{ background: 'var(--color-surface)', border: `1.5px solid ${pc ? pc.border : '#C8D88A'}`, borderTop: 'none', borderRadius: '0 0 13px 13px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(94,106,42,.1)' }}>

                            {/* Detection photo */}
                            {det.image_url ? (
                              <div style={{ position: 'relative', height: 200, background: 'var(--color-tint-neutral)' }}>
                                <img src={det.image_url} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,30,10,.5) 0%, transparent 55%)' }} />
                                <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: 17, color: '#F6F4EC' }}>
                                    {isBaseline ? 'Baseline scan' : 'Check-in scan'}
                                  </div>
                                  <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: 'rgba(246,244,236,.65)', marginTop: 2 }}>{formatDate(det.detected_at)}</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-tint-neutral)', color: '#BCBAB0' }}>
                                <CameraIcon />
                              </div>
                            )}

                            <div style={{ padding: '16px 18px 20px' }}>

                              {/* Detection metrics */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 12 }}>
                                {[
                                  ['Skin type',   det.skin_type,   `${Math.round((det.skin_conf ?? 0) * 100)}% confidence`],
                                  ['Acne status', det.acne_status === 'Acne' ? 'Acne present' : 'Clear', `${Math.round((det.acne_conf ?? 0) * 100)}% confidence`],
                                ].map(([label, val, sub]) => (
                                  <div key={label} style={{ background: 'var(--color-surface-tint)', borderRadius: 10, padding: '10px 13px', border: '1px solid #E4E8CC' }}>
                                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>{val}</div>
                                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: 'var(--color-success)' }}>{sub}</div>
                                  </div>
                                ))}
                              </div>

                              {/* ── Comparison result (if available from this session) ── */}
                              {pc && result ? (
                                <div style={{ background: pc.bg, border: `1.5px solid ${pc.border}`, borderRadius: 12, padding: '14px 16px' }}>
                                  <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: pc.accent, marginBottom: 10 }}>
                                    Progress comparison result
                                  </div>

                                  {/* What these scores mean */}
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(255,255,255,.5)', borderRadius: 9, padding: '10px 12px', marginBottom: 12, border: `1px solid ${pc.border}` }}>
                                    <div style={{ color: pc.accent, flexShrink: 0, marginTop: 1 }}><InfoIcon /></div>
                                    <div style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.55 }}>
                                      <strong>How scores work:</strong> Skinora compares your baseline scan to this check-in.
                                      It checks skin condition and acne confidence — a higher skin confidence + lower acne confidence = healthier score.
                                      The delta (%) shows how much it changed.
                                    </div>
                                  </div>

                                  {/* Before / After labels */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                    {[
                                      { label: 'Baseline scan', cond: result.old_condition, caption: 'Your starting skin condition' },
                                      { label: 'This check-in', cond: result.new_condition, caption: 'Skin condition in this scan' },
                                    ].map(({ label, cond, caption }) => (
                                      <div key={label} style={{ background: 'rgba(255,255,255,.6)', borderRadius: 9, padding: '10px 12px', border: `1px solid ${pc.border}` }}>
                                        <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>{cond ?? '—'}</div>
                                        <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{caption}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Delta */}
                                  {result.delta != null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.6)', borderRadius: 10, border: `1px solid ${pc.border}` }}>
                                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: pc.accent, color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                        {pc.icon}
                                      </div>
                                      <div>
                                        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: pc.accent, lineHeight: 1 }}>{pc.label}</div>
                                        <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: pc.accent, marginTop: 3 }}>
                                          {result.progress === 'improved' ? '+' : result.progress === 'worse' ? '−' : '±'}{Math.round(Math.abs(result.delta) * 100)}% skin health score change
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <p style={{ fontSize: 12.5, color: 'var(--color-ink)', lineHeight: 1.6, margin: '12px 0 0' }}>{pc.msg}</p>
                                </div>

                              ) : isBaseline ? (
                                /* Baseline info card */
                                <div style={{ background: 'linear-gradient(135deg,var(--color-surface-tint),var(--color-surface-tint))', borderRadius: 11, padding: '13px 15px', border: '1px solid var(--color-header-line)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <div style={{ color: 'var(--color-brand-text)', flexShrink: 0, marginTop: 2 }}><InfoIcon /></div>
                                  <div style={{ fontSize: 12.5, color: 'var(--color-brand-text)', lineHeight: 1.55 }}>
                                    This is your <strong>baseline scan</strong> — the reference point all future check-ins are compared against.
                                    No comparison is done on the baseline itself.
                                  </div>
                                </div>

                              ) : (
                                /* Non-baseline, result from a previous session (not in sessionStorage) */
                                <div style={{ background: '#F8FAF0', borderRadius: 11, padding: '13px 15px', border: '1px solid #E4E8CC', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <div style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }}><InfoIcon /></div>
                                  <div style={{ fontSize: 12.5, color: 'var(--color-text2)', lineHeight: 1.55 }}>
                                    This scan was uploaded as a check-in. Its comparison result is stored in your account.
                                    <br/>
                                    <span style={{ color: 'var(--color-muted)', fontSize: 11.5 }}>Full history view with all results is coming soon.</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* View all / collapse */}
                {detections.length > 5 && (
                  <button
                    className="sk-view-all-btn"
                    onClick={() => setShowAll(s => !s)}
                    style={{ marginTop: 14, width: '100%', background: '#F4F6E8', border: '1.5px solid var(--color-header-line)', color: 'var(--color-brand-text)', borderRadius: 12, padding: '12px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {showAll
                      ? (<><ChevronIcon open={true} /> Show less</>)
                      : (<>View all {detections.length} scans <ChevronIcon open={false} /></>)
                    }
                  </button>
                )}
              </>
            )}
          </div>

          {/* ══════════════════════════════════════════
              RIGHT — Check-in upload & result
          ══════════════════════════════════════════ */}
          <div style={{ flex: '1 1 340px', minWidth: 290 }}>

            {/* Due banner */}
            {isDue && !scanResult && (
              <div style={{ background: 'linear-gradient(135deg,#23241C,#5E6A2A)', borderRadius: 16, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18, boxShadow: '0 8px 28px rgba(35,36,28,.2)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-ink)' }}>
                  <CalendarIcon />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#F6F4EC', marginBottom: 5 }}>
                    Your {tracking.frequency} check-in is due!
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(246,244,236,.72)', lineHeight: 1.55 }}>
                    Upload a new face photo. Our AI will compare it to your baseline and measure how your skin has changed.
                  </div>
                </div>
              </div>
            )}

            {/* ── Scan result (after check-in completes) ── */}
            {scanResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {scanResult.comparison && (() => {
                  const pc = PROGRESS_CONFIG[scanResult.comparison.progress] ?? PROGRESS_CONFIG.no_change;
                  const deltaPct = scanResult.comparison.delta != null ? Math.round(Math.abs(scanResult.comparison.delta) * 100) : null;
                  return (
                    <div style={{ background: pc.bg, border: `2px solid ${pc.border}`, borderRadius: 18, padding: '22px', boxShadow: '0 8px 28px rgba(35,36,28,.1)' }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: pc.accent, marginBottom: 14 }}>
                        Check-in result
                      </div>

                      {/* Result headline */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <div style={{ width: 58, height: 58, borderRadius: '50%', background: pc.accent, color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, boxShadow: `0 4px 14px ${pc.accent}55` }}>
                          {pc.icon}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 28, color: pc.accent, lineHeight: 1 }}>{pc.label}</div>
                          {deltaPct != null && (
                            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: pc.accent, marginTop: 5 }}>
                              {scanResult.comparison.progress === 'improved' ? '+' : scanResult.comparison.progress === 'worse' ? '−' : '±'}{deltaPct}% skin health score
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score explanation */}
                      <div style={{ background: 'rgba(255,255,255,.5)', border: `1px solid ${pc.border}`, borderRadius: 10, padding: '11px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ color: pc.accent, flexShrink: 0 }}><InfoIcon /></div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.55 }}>
                          <strong>Skin health score</strong> is computed by the AI from your skin type confidence and acne detection confidence —
                          it measures how much your skin condition has improved since your baseline scan.
                        </div>
                      </div>

                      {/* Before / After */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                        {[
                          { label: 'Baseline scan',  url: scanResult.comparison.old_image_url, cond: scanResult.comparison.old_condition, caption: 'Your starting condition' },
                          { label: 'This check-in',  url: scanResult.comparison.new_image_url, cond: scanResult.comparison.new_condition, caption: 'Your current condition' },
                        ].map(({ label, url, cond, caption }) => (
                          <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 6 }}>{label}</div>
                            <div style={{ height: 110, borderRadius: 10, overflow: 'hidden', background: 'var(--color-tint-neutral)', border: `1.5px solid ${pc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {url ? <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   : <span style={{ color: '#BCBAB0' }}><CameraIcon /></span>}
                            </div>
                            {cond && <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, color: pc.accent, marginTop: 5, fontWeight: 600 }}>{cond}</div>}
                            <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 2 }}>{caption}</div>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.6, margin: '0 0 16px' }}>{pc.msg}</p>

                      {scanResult.comparison.progress === 'worse'
                        ? <button onClick={() => navigate('/consult')} style={{ width: '100%', background: pc.accent, color: 'var(--color-surface)', border: 'none', borderRadius: '999px', padding: '13px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Talk to a specialist →</button>
                        : scanResult.comparison.progress === 'no_change'
                        ? <button onClick={() => navigate('/remedies')} style={{ width: '100%', background: pc.accent, color: 'var(--color-surface)', border: 'none', borderRadius: '999px', padding: '13px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Explore other remedies →</button>
                        : <div style={{ textAlign: 'center', padding: '11px', background: `${pc.accent}18`, borderRadius: 10, fontSize: 14, color: pc.accent, fontWeight: 700 }}>✓ Keep using {tracking.remedy_name ?? 'your remedy'}!</div>
                      }

                      {/* Report section */}
                      <div style={{ marginTop: 16, borderTop: `1px solid ${pc.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {scanResult.comparison.report_emailed && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,.55)', border: `1px solid ${pc.border}`, borderRadius: 10, padding: '10px 14px' }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>📧</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: pc.accent }}>Report emailed to you</div>
                              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>Full PDF report has been sent to your email.</div>
                            </div>
                          </div>
                        )}
                        <button onClick={handleDownloadPdf} disabled={downloadingPdf}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'rgba(255,255,255,.7)', border: `1.5px solid ${pc.border}`, borderRadius: '999px', padding: '11px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, color: pc.accent, cursor: downloadingPdf ? 'default' : 'pointer', opacity: downloadingPdf ? 0.7 : 1 }}>
                          ⬇ {downloadingPdf ? 'Generating PDF…' : 'Download PDF Report'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Latest scan row */}
                <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-hairline)', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 13, alignItems: 'center' }}>
                  {preview?.url && <img src={preview.url} alt="New scan" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1.5px solid var(--color-field-border)', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>Saved to your history</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>{scanResult.detection.final_condition?.replace('_', ' · ')}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
                      Skin {Math.round((scanResult.detection.skin_conf ?? 0) * 100)}% · Acne {Math.round((scanResult.detection.acne_conf ?? 0) * 100)}%
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink)', flexShrink: 0 }}>
                    <CheckIcon size={12} />
                  </div>
                </div>

                <button onClick={() => { setPreview(null); setScanResult(null); setFaceError(null); }}
                  style={{ width: '100%', background: 'transparent', border: '1.5px solid var(--color-field-border)', color: 'var(--color-text2)', borderRadius: '999px', padding: '12px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Upload another photo
                </button>
              </div>

            ) : (
              /* ── Upload card ── */
              <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-hairline)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(35,36,28,.08)' }}>

                <div style={{ background: 'linear-gradient(135deg,#23241C,#5E6A2A)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 4 }}>
                      {isDue ? 'Check-in upload' : 'Upload anytime'}
                    </div>
                    <div style={{ fontSize: 15, color: '#F6F4EC', fontWeight: 600 }}>
                      {isDue ? 'Time for your check-in!' : 'Track your skin progress.'}
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(190,202,92,.2)', border: '1.5px solid rgba(190,202,92,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)', flexShrink: 0 }}>
                    <CameraIcon />
                  </div>
                </div>

                {preview ? (
                  <div>
                    <div style={{ position: 'relative', height: 250, background: 'var(--color-tint-neutral)' }}>
                      <img src={preview.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => { setPreview(null); setFaceError(null); }}
                        style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 'none', color: '#F6F4EC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    {faceError && (
                      <div style={{ margin: '14px 18px 0', padding: '12px 15px', background: 'var(--color-alert-bg)', border: '1.5px solid #EDBBAA', borderRadius: 10, fontSize: 13, color: 'var(--color-alert-strong)' }}>{faceError}</div>
                    )}
                    <div style={{ padding: '16px 20px 20px' }}>
                      <button onClick={runCheckin} disabled={scanning}
                        className="sk-scan-btn"
                        style={{ width: '100%', background: scanning ? '#D8DC9A' : 'var(--color-brand)', color: 'var(--color-brand-ink)', border: 'none', borderRadius: '999px', padding: '15px', fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.8 : 1 }}>
                        {scanning ? 'Analysing your skin…' : 'Analyse & compare →'}
                      </button>
                    </div>
                  </div>

                ) : (
                  <div style={{ padding: '20px 20px 22px' }}>
                    <div style={{ display: 'flex', gap: 13, marginBottom: 18 }}>
                      <button onClick={() => openCamera('user')} className="sk-upload-opt"
                        style={{ flex: 1, background: 'var(--color-canvas)', border: '1.5px solid var(--color-field-border)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--color-surface-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 11px', color: 'var(--color-brand-text)' }}>
                          <CameraIcon />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-ink)', marginBottom: 3 }}>Take photo</div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Open camera</div>
                      </button>
                      <button onClick={() => fileRef.current?.click()} className="sk-upload-opt"
                        style={{ flex: 1, background: 'var(--color-canvas)', border: '1.5px solid var(--color-field-border)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--color-surface-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 11px', color: 'var(--color-brand-text)' }}>
                          <UploadIcon />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-ink)', marginBottom: 3 }}>Upload photo</div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>From device</div>
                      </button>
                    </div>
                    {cameraErr && (
                      <div style={{ padding: '10px 14px', background: 'var(--color-alert-bg)', border: '1.5px solid #EDBBAA', borderRadius: 10, fontSize: 12.5, color: 'var(--color-alert-strong)', marginBottom: 14 }}>{cameraErr}</div>
                    )}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--color-surface-tint)', borderRadius: 11, border: '1px solid #E4E8CC' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: 'var(--color-ink)' }}>
                        <CheckIcon size={10} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text2)', lineHeight: 1.55 }}>
                        Use <strong>the same lighting</strong> as your baseline scan. Results are saved to your history automatically.
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                  </div>
                )}
              </div>
            )}

            {/* Journey stats */}
            {!scanResult && detections.length > 0 && (
              <div style={{ marginTop: 18, background: 'linear-gradient(135deg,#23241C,#2D3010)', borderRadius: 16, padding: '18px 22px', boxShadow: '0 6px 24px rgba(35,36,28,.18)' }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 16 }}>
                  Journey stats
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    ['Total scans',     detections.length],
                    ['Check-ins done',  comparedCount],
                    ['Days tracking',   tracking.created_at ? Math.max(0, Math.floor((Date.now() - new Date(tracking.created_at)) / 86400000)) : '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Newsreader',serif", fontSize: 30, color: '#F6F4EC', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(246,244,236,.5)', marginTop: 6 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {tracking.frequency && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarIcon />
                    <span style={{ fontSize: 12, color: 'rgba(246,244,236,.55)' }}>
                      {tracking.frequency} check-in schedule · next {daysUntil(tracking.next_reminder) ?? 'TBD'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
