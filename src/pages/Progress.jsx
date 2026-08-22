import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { detect, compareProgress, checkTrackingDue, getNotificationCount, downloadProgressReport } from '../api';

const STATUS_CONFIG = {
  better:      { label: 'Improving',      color: '#3E7A2A', bg: '#F0FAF0', dot: '#5CB85C' },
  no_progress: { label: 'No change yet',  color: '#8A6B1E', bg: '#FFF8E6', dot: '#F0AD4E' },
  worse:       { label: 'Needs attention',color: '#B05E3C', bg: '#FDF4F0', dot: '#D9534F' },
};

const PROGRESS_CONFIG = {
  improved: { label: 'Improved',           icon: '↑', accent: '#3E7A2A', bg: '#F0FAF0', border: '#A8D5A2', msg: 'Your skin is responding well. Keep using your remedy!' },
  no_change:{ label: 'No change yet',      icon: '→', accent: '#8A6B1E', bg: '#FFF8E6', border: '#F0DFA0', msg: 'Skin looks similar. Some remedies need more time — consider exploring alternatives.' },
  worse:    { label: 'Regression detected',icon: '↓', accent: '#B05E3C', bg: '#FDF4F0', border: '#EDBBAA', msg: 'Skin appears to have reacted. Consider switching remedies or consulting a specialist.' },
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

export default function Progress() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  // Dashboard data
  const [tracking,   setTracking]   = useState(null);
  const [detections, setDetections] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Check-in state
  const [preview,     setPreview]     = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [scanResult,  setScanResult]  = useState(null);
  const [faceError,   setFaceError]   = useState(null);
  const [selectedDet,   setSelectedDet]   = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Camera state
  const fileRef    = useRef(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [cameraErr,   setCameraErr]   = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode,  setFacingMode]  = useState('user');

  // ── Load dashboard on mount ────────────────────────────────
  useEffect(() => {
    if (!state.user) return;
    const token = sessionStorage.getItem('skinora_token');
    fetch('/api/tracking/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const active = (data.trackings ?? []).find(t => t.is_active) ?? (data.trackings ?? [])[0] ?? null;
        setTracking(active);
        setDetections(data.detections ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state.user]);

  // ── Camera wiring ──────────────────────────────────────────
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

  // ── Run check-in scan + compare ───────────────────────────
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
          // Resolve notifications → clear badge immediately
          getNotificationCount()
            .then(r => dispatch({ type: 'SET_PENDING_CHECKINS', payload: r.data.count }))
            .catch(() => {});
          checkTrackingDue()
            .then(r => dispatch({ type: 'SET_TRACKING_DUE', payload: r.data }))
            .catch(() => {});
        } catch {}
      }

      setScanResult({ detection: data, comparison });

      // Refresh history + tracking status
      const token = sessionStorage.getItem('skinora_token');
      fetch('/api/tracking/dashboard', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          setDetections(d.detections ?? []);
          const upd = (d.trackings ?? []).find(t => t.is_active) ?? (d.trackings ?? [])[0] ?? null;
          if (upd) setTracking(upd);
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

  // ── Loading / empty states ─────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
        <AppHeader activeStep="track" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9C9A8C', fontSize: 15 }}>
          Loading your progress…
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
        <AppHeader activeStep="track" />
        <main style={{ maxWidth: 580, margin: '0 auto', padding: '90px 44px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 22 }}>🌿</div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 34, letterSpacing: '-.02em', margin: '0 0 14px' }}>
            No active tracking yet.
          </h2>
          <p style={{ fontSize: 15, color: '#6B6A60', lineHeight: 1.7, marginBottom: 30 }}>
            Complete a skin scan, select a remedy, and set up progress tracking to see your journey here.
          </p>
          <button onClick={() => navigate('/upload')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '14px 30px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Start a skin scan →
          </button>
        </main>
      </div>
    );
  }

  const isDue    = state.trackingDue?.due ?? false;
  const statusCfg = STATUS_CONFIG[tracking.last_status] ?? { label: 'Tracking active', color: '#5E6A2A', bg: '#F4F6EA', dot: '#BECA5C' };

  const ghostBtn = { background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 9, padding: '8px 16px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: 'pointer' };

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Camera modal ── */}
      {cameraOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,15,12,.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={closeCamera} style={ghostBtn}>✕ Close</button>
            <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Progress Check-in</span>
            <button onClick={() => openCamera(facingMode === 'user' ? 'environment' : 'user')} style={ghostBtn}>⇄ Flip</button>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
            {!cameraReady && (
              <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9C9A8C', fontSize: 14 }}>Starting camera…</div>
            )}
            <video ref={videoRef} autoPlay playsInline muted
              onLoadedData={() => setCameraReady(true)}
              style={{ width: '100%', borderRadius: 16, transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', display: cameraReady ? 'block' : 'none' }} />
            <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 260, border: '2.5px solid rgba(190,202,92,.85)', borderRadius: '50%', pointerEvents: 'none' }} />
          </div>
          {cameraErr && <div style={{ color: '#F5A623', fontSize: 13, marginTop: 14, padding: '0 32px', textAlign: 'center' }}>{cameraErr}</div>}
          {cameraReady && (
            <button onClick={capturePhoto}
              style={{ marginTop: 28, width: 68, height: 68, borderRadius: '50%', background: '#BECA5C', border: '4px solid rgba(255,255,255,.5)', cursor: 'pointer', flexShrink: 0 }} />
          )}
          <div style={{ marginTop: 14, fontFamily: "'Spline Sans Mono'", fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em' }}>
            Same lighting as your original scan for best comparison
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 44px 70px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>
            Progress Tracking
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 38, letterSpacing: '-.02em', margin: 0 }}>
              Your skin journey.
            </h2>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: statusCfg.bg, color: statusCfg.color, fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: '999px', border: `1px solid ${statusCfg.dot}44` }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusCfg.dot, display: 'inline-block' }} />
                {statusCfg.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1EEE3', color: '#57564E', fontSize: 12.5, padding: '6px 14px', borderRadius: '999px', border: '1px solid #E0DCCC' }}>
                🌿 {tracking.remedy_name ?? 'Active remedy'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDue ? '#EEF0DC' : '#F1EEE3', color: isDue ? '#5E6A2A' : '#57564E', fontSize: 12.5, padding: '6px 14px', borderRadius: '999px', border: `1px solid ${isDue ? '#BECA5C' : '#E0DCCC'}`, fontWeight: isDue ? 700 : 400 }}>
                {isDue ? '📅 Check-in due now' : `🔔 Next: ${daysUntil(tracking.next_reminder) ?? '—'}`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>

          {/* ══════════════════════════════════════════
              LEFT COLUMN — Scan History
          ══════════════════════════════════════════ */}
          <div style={{ flex: '1 1 340px', minWidth: 290 }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 14 }}>
              Scan History · {detections.length} scan{detections.length !== 1 ? 's' : ''}
            </div>

            {detections.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '32px 24px', textAlign: 'center', color: '#9C9A8C', fontSize: 14 }}>
                No scans yet — upload your first photo to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {detections.map((det, idx) => {
                  const isBaseline = det.id === tracking.detection_id;
                  const isSelected = selectedDet?.id === det.id;
                  return (
                    <button key={det.id}
                      onClick={() => setSelectedDet(isSelected ? null : det)}
                      style={{ display: 'flex', gap: 13, alignItems: 'center', background: isSelected ? '#F4F6EA' : '#fff', border: `1.5px solid ${isBaseline ? '#BECA5C' : isSelected ? '#C8D88A' : '#E6E3D8'}`, borderRadius: 13, padding: '12px 14px', textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'background .1s' }}>

                      {/* Thumbnail */}
                      <div style={{ width: 58, height: 58, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#ECEADF', border: '1px solid #E0DCCC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {det.image_url
                          ? <img src={det.image_url} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 22 }}>📷</span>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                          <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#5E6A2A', background: '#EEF0DC', padding: '2px 8px', borderRadius: 5 }}>
                            {det.final_condition}
                          </span>
                          {isBaseline && (
                            <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: '#8B9633', background: '#F4F6EA', border: '1px solid #BECA5C', padding: '2px 7px', borderRadius: 5 }}>
                              Baseline
                            </span>
                          )}
                          {idx === 0 && !isBaseline && (
                            <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9AA646', background: '#F4F6EA', padding: '2px 7px', borderRadius: 5 }}>
                              Latest
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#23241C', fontWeight: 600, marginBottom: 2 }}>
                          {det.skin_type} skin · {det.acne_status === 'Acne' ? 'Acne present' : 'No acne'}
                        </div>
                        <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#9C9A8C', letterSpacing: '.04em' }}>
                          {formatDate(det.detected_at)} · {Math.round((det.skin_conf ?? 0) * 100)}% / {Math.round((det.acne_conf ?? 0) * 100)}%
                        </div>
                      </div>

                      {/* Expand chevron */}
                      <span style={{ fontSize: 11, color: '#CFCBBC', flexShrink: 0 }}>
                        {isSelected ? '▲' : '▼'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Expanded scan detail ── */}
            {selectedDet && (
              <div style={{ marginTop: 14, background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, overflow: 'hidden' }}>
                {selectedDet.image_url ? (
                  <img src={selectedDet.image_url} alt="Scan detail"
                    style={{ width: '100%', maxHeight: 340, objectFit: 'contain', background: '#ECEADF', display: 'block' }} />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECEADF', fontSize: 44 }}>📷</div>
                )}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#9C9A8C', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{formatDate(selectedDet.detected_at)}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#23241C', marginBottom: 10 }}>
                    {selectedDet.final_condition?.replace('_', ' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      ['Skin type',   `${selectedDet.skin_type} (${Math.round((selectedDet.skin_conf ?? 0) * 100)}%)`],
                      ['Acne status', `${selectedDet.acne_status === 'Acne' ? 'Acne present' : 'No acne'} (${Math.round((selectedDet.acne_conf ?? 0) * 100)}%)`],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: '#F4F6EA', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#3a3a2a' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
              RIGHT COLUMN — Check-in upload & result
          ══════════════════════════════════════════ */}
          <div style={{ flex: '1 1 340px', minWidth: 290 }}>

            {/* Due banner */}
            {isDue && !scanResult && (
              <div style={{ background: 'linear-gradient(135deg,#EEF0DC,#F4F6EA)', border: '1.5px solid #BECA5C', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: '#BECA5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📅</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#23241C', marginBottom: 4 }}>
                    Your {tracking.frequency} check-in is due!
                  </div>
                  <div style={{ fontSize: 13, color: '#6B6A60', lineHeight: 1.5 }}>
                    Upload a new photo below. Our AI will compare it with your baseline and tell you how your skin has changed.
                  </div>
                </div>
              </div>
            )}

            {/* ── Scan result (shown after check-in completes) ── */}
            {scanResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Progress result card */}
                {scanResult.comparison && (() => {
                  const pc = PROGRESS_CONFIG[scanResult.comparison.progress] ?? PROGRESS_CONFIG.no_change;
                  const deltaPct = scanResult.comparison.delta != null ? Math.round(Math.abs(scanResult.comparison.delta) * 100) : null;
                  return (
                    <div style={{ background: pc.bg, border: `1.5px solid ${pc.border}`, borderRadius: 16, padding: '22px 22px' }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: pc.accent, marginBottom: 14 }}>
                        Check-in Result
                      </div>

                      {/* Score row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: pc.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                          {pc.icon}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26, color: pc.accent, lineHeight: 1 }}>{pc.label}</div>
                          {deltaPct != null && (
                            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: pc.accent, marginTop: 4 }}>
                              {scanResult.comparison.progress === 'improved' ? '+' : scanResult.comparison.progress === 'worse' ? '−' : '±'}{deltaPct}% skin health score
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Before / After */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                        {[
                          { label: 'Before', url: scanResult.comparison.old_image_url, cond: scanResult.comparison.old_condition },
                          { label: 'After',  url: scanResult.comparison.new_image_url, cond: scanResult.comparison.new_condition },
                        ].map(({ label, url, cond }) => (
                          <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 6 }}>{label}</div>
                            <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', background: '#ECEADF', border: `1px solid ${pc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {url
                                ? <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 28 }}>📷</span>
                              }
                            </div>
                            {cond && <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 9, color: '#7E9A3E', marginTop: 5 }}>{cond}</div>}
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: 13.5, color: '#3a3a2a', lineHeight: 1.6, margin: '0 0 16px' }}>{pc.msg}</p>

                      {scanResult.comparison.progress === 'worse'
                        ? <button onClick={() => navigate('/consult')} style={{ width: '100%', background: pc.accent, color: '#fff', border: 'none', borderRadius: '999px', padding: '12px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Talk to a specialist →</button>
                        : scanResult.comparison.progress === 'no_change'
                        ? <button onClick={() => navigate('/remedies')} style={{ width: '100%', background: pc.accent, color: '#fff', border: 'none', borderRadius: '999px', padding: '12px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Explore other remedies →</button>
                        : <div style={{ textAlign: 'center', fontSize: 14, color: pc.accent, fontWeight: 600 }}>✓ Keep using {tracking.remedy_name ?? 'your remedy'}!</div>
                      }

                      {/* ── Report section ── */}
                      <div style={{ marginTop: 16, borderTop: `1px solid ${pc.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

                        {/* Email confirmation badge */}
                        {scanResult.comparison.report_emailed && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,.55)', border: `1px solid ${pc.border}`, borderRadius: 10, padding: '10px 14px' }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>📧</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: pc.accent }}>Report emailed to you</div>
                              <div style={{ fontSize: 11.5, color: '#9C9A8C', marginTop: 2 }}>A full PDF report with your results has been sent to your registered email.</div>
                            </div>
                          </div>
                        )}

                        {/* Download button */}
                        <button
                          onClick={handleDownloadPdf}
                          disabled={downloadingPdf}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'rgba(255,255,255,.7)', border: `1.5px solid ${pc.border}`, borderRadius: '999px', padding: '11px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, color: pc.accent, cursor: downloadingPdf ? 'default' : 'pointer', opacity: downloadingPdf ? 0.7 : 1 }}>
                          <span style={{ fontSize: 16 }}>⬇</span>
                          {downloadingPdf ? 'Generating PDF…' : 'Download PDF Report'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* New detection summary */}
                <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 10 }}>Latest scan</div>
                  <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                    {preview?.url && (
                      <img src={preview.url} alt="New scan" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #E0DCCC', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#23241C' }}>
                        {scanResult.detection.final_condition?.replace('_', ' · ')}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#9C9A8C', marginTop: 3 }}>
                        Skin {Math.round((scanResult.detection.skin_conf ?? 0) * 100)}% · Acne {Math.round((scanResult.detection.acne_conf ?? 0) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setPreview(null); setScanResult(null); setFaceError(null); }}
                  style={{ width: '100%', background: 'transparent', border: '1px solid #D5D1C2', color: '#57564E', borderRadius: '999px', padding: '12px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Upload another photo
                </button>
              </div>

            ) : (
              /* ── Upload area ── */
              <div style={{ background: '#fff', border: '1px solid #E6E3D8', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #F0EDE4' }}>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: isDue ? '#7E9A3E' : '#9C9A8C', marginBottom: 6 }}>
                    {isDue ? 'Check-in upload' : 'Upload new scan'}
                  </div>
                  <div style={{ fontSize: 14.5, color: '#23241C', fontWeight: 600 }}>
                    {isDue ? 'Take or upload a photo to see your progress.' : 'You can scan your skin anytime.'}
                  </div>
                </div>

                {preview ? (
                  /* Preview state */
                  <div>
                    <div style={{ position: 'relative', height: 240, background: '#ECEADF' }}>
                      <img src={preview.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => { setPreview(null); setFaceError(null); }}
                        style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,.45)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                    {faceError && (
                      <div style={{ margin: '14px 18px 0', padding: '11px 15px', background: '#FDF4F0', border: '1px solid #EDBBAA', borderRadius: 10, fontSize: 13, color: '#B05E3C' }}>
                        {faceError}
                      </div>
                    )}
                    <div style={{ padding: '14px 18px 18px' }}>
                      <button onClick={runCheckin} disabled={scanning}
                        style={{ width: '100%', background: scanning ? '#D8DC9A' : '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '14px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.8 : 1 }}>
                        {scanning ? 'Analysing your skin…' : 'Analyse & compare →'}
                      </button>
                    </div>
                  </div>

                ) : (
                  /* Option cards */
                  <div style={{ padding: '18px 18px 20px' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <button onClick={() => openCamera('user')}
                        style={{ flex: 1, background: '#F6F4EC', border: '1.5px solid #E0DCCC', borderRadius: 12, padding: '18px 12px', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#23241C' }}>Take photo</div>
                        <div style={{ fontSize: 11.5, color: '#9C9A8C', marginTop: 3 }}>Open camera</div>
                      </button>
                      <button onClick={() => fileRef.current?.click()}
                        style={{ flex: 1, background: '#F6F4EC', border: '1.5px solid #E0DCCC', borderRadius: 12, padding: '18px 12px', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#23241C' }}>Upload photo</div>
                        <div style={{ fontSize: 11.5, color: '#9C9A8C', marginTop: 3 }}>From device</div>
                      </button>
                    </div>
                    {cameraErr && (
                      <div style={{ padding: '10px 14px', background: '#FDF4F0', border: '1px solid #EDBBAA', borderRadius: 10, fontSize: 12.5, color: '#B05E3C', marginBottom: 12 }}>{cameraErr}</div>
                    )}
                    <div style={{ fontSize: 12, color: '#9C9A8C', textAlign: 'center', lineHeight: 1.5 }}>
                      Use the same lighting as your previous scans for the best comparison.
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])} />
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
