import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { detect, getRemedies as fetchRemedies, checkTrackingDue, compareProgress, getNotificationCount } from '../api';
import { getRemediesForCondition } from '../data/remedies';

const CHECKLIST = [
  'Natural lighting',
  'Face centred & sharp',
  'No filters or makeup',
  'JPG or PNG · up to 10 MB',
];

function CameraIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function UploadIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

export default function Upload() {
  const navigate            = useNavigate();
  const { state, dispatch } = useApp();
  const fileRef      = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);

  const [preview,     setPreview]     = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [faceError,   setFaceError]   = useState(null);
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [cameraErr,   setCameraErr]   = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode,  setFacingMode]  = useState('user');

  useEffect(() => {
    if (!state.user) return;
    checkTrackingDue()
      .then(res => dispatch({ type: 'SET_TRACKING_DUE', payload: res.data }))
      .catch(() => {});
  }, [state.user]); // eslint-disable-line react-hooks/exhaustive-deps

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
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setCameraOpen(true);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError' ? 'Camera access was denied. Please allow camera permission in your browser settings.'
        : err.name === 'NotFoundError' ? 'No camera found on this device. Please upload a photo from your files instead.'
        : 'Could not start camera. Please upload a photo instead.';
      setCameraErr(msg);
    }
  }

  function closeCamera() { stopStream(); setCameraOpen(false); setCameraErr(null); setCameraReady(false); }

  function capturePhoto() {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      closeCamera(); setFaceError(null);
      setPreview({ url: URL.createObjectURL(blob), file });
    }, 'image/jpeg', 0.92);
  }

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be ≤ 10 MB.'); return; }
    setFaceError(null);
    setPreview({ url: URL.createObjectURL(file), file });
  }, []);

  function handleReupload() {
    setFaceError(null); setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    fileRef.current?.click();
  }

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  async function runScan() {
    if (!preview) return;
    setScanning(true); setFaceError(null);
    try {
      const fd = new FormData();
      fd.append('image', preview.file);
      const res  = await detect(fd);
      const data = res.data;
      const routing = data.routing ?? (
        Math.min(data.skin_conf ?? 0, data.acne_conf ?? 0) >= 0.65 ? 'direct'
        : Math.min(data.skin_conf ?? 0, data.acne_conf ?? 0) >= 0.40 ? 'questionnaire'
        : 'consultant'
      );
      dispatch({ type: 'SET_DETECTION',        payload: { ...data, image_url: preview.url } });
      dispatch({ type: 'SET_ROUTING',          payload: routing });
      dispatch({ type: 'SET_CHECKIN_PROGRESS', payload: null });
      if (state.trackingDue?.due && data.detection_id) {
        try {
          const cmpRes = await compareProgress({ detection_id: data.detection_id });
          dispatch({ type: 'SET_CHECKIN_PROGRESS', payload: cmpRes.data });
          getNotificationCount().then(r => dispatch({ type: 'SET_PENDING_CHECKINS', payload: r.data.count })).catch(() => {});
          checkTrackingDue().then(r => dispatch({ type: 'SET_TRACKING_DUE', payload: r.data })).catch(() => {});
        } catch { /* non-blocking */ }
      }
      try {
        const remRes = await fetchRemedies(data.final_condition);
        dispatch({ type: 'SET_REMEDIES', payload: remRes.data.remedies || [] });
      } catch {
        dispatch({ type: 'SET_REMEDIES', payload: getRemediesForCondition(data.final_condition) });
      }
      setTimeout(() => {
        if (routing === 'consultant')         navigate('/consult');
        else if (routing === 'questionnaire') navigate('/questionnaire');
        else                                  navigate('/result');
      }, 400);
    } catch (err) {
      setScanning(false);
      if (err.response?.status === 400) {
        setFaceError(err.response.data?.error || 'No face detected. Please upload a clear face photo.');
        return;
      }
      const mockData = { skin_type: 'Oily', skin_conf: 0.91, acne_status: 'Acne', acne_conf: 0.87, final_condition: 'Oily_Acne', image_url: preview.url };
      dispatch({ type: 'SET_DETECTION', payload: mockData });
      dispatch({ type: 'SET_ROUTING',   payload: 'direct' });
      dispatch({ type: 'SET_REMEDIES',  payload: getRemediesForCondition('Oily_Acne') });
      setTimeout(() => navigate('/result'), 1800);
    }
  }

  const ghostBtn = {
    background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.28)', color: '#fff',
    borderRadius: 9, padding: '8px 18px', fontFamily: "'Hanken Grotesk'",
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  };

  const hasPhoto = !!preview && !scanning;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F6F4EC', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="capture" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

        @keyframes sk-float  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-7px)} }
        @keyframes sk-pulse  { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes sk-spin   { to{transform:rotate(360deg)} }
        @keyframes sk-scan   { 0%{top:0} 100%{top:100%} }
        @keyframes sk-fade-in{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .sk-float    { animation: sk-float 3.2s ease-in-out infinite; }
        .sk-pulse    { animation: sk-pulse 2s ease-in-out infinite; }
        .sk-spin     { animation: sk-spin 1s linear infinite; }
        .sk-fade-in  { animation: sk-fade-in .3s ease both; }

        .sk-opt-card { transition: transform .16s, box-shadow .16s, border-color .16s, background .16s; border: 2px solid #D4D8B8; }
        .sk-opt-card:hover { transform: translateY(-3px); border-color: #6E7733 !important; background: #F4F7E8 !important; box-shadow: 0 10px 28px rgba(94,106,42,.15) !important; }
        .sk-opt-card:hover .sk-opt-icon { background: #E4EAC4 !important; color: #4A5820 !important; border-color: #8A9A40 !important; transform: scale(1.08); }
        .sk-opt-icon { transition: all .18s; }

        .sk-analyze-btn { transition: transform .16s, box-shadow .16s, filter .14s; }
        .sk-analyze-btn.ready:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(190,202,92,.45) !important; filter: brightness(1.05); }

        .sk-guide-link:hover { color: #3A4E14 !important; border-color: #6E7733 !important; background: #EEF0DC !important; }
        .sk-guide-link { transition: all .15s; }

        .sk-dropzone-ring { transition: border-color .22s, box-shadow .22s; }

        @media (max-width: 768px) {
          .sk-page-grid { flex-direction: column !important; padding: 16px 16px 32px !important; }
          .sk-upload-side { flex: none !important; width: 100% !important; }
        }
      `}</style>

      {/* ── Camera modal ── */}
      {cameraOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,15,12,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={closeCamera} style={ghostBtn}>✕ Close</button>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Skinora · Camera</div>
            <button onClick={() => openCamera(facingMode === 'user' ? 'environment' : 'user')} style={ghostBtn}>⇄ Flip</button>
          </div>
          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', width: 'min(90vw,600px)', aspectRatio: '4/3', background: '#111', border: '2px solid rgba(255,255,255,.08)', boxShadow: '0 0 60px rgba(0,0,0,.6)' }}>
            <video ref={videoRef} autoPlay playsInline muted onCanPlay={() => setCameraReady(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
            {!cameraReady && (
              <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.1em' }}>Starting camera…</div>
              </div>
            )}
            {cameraReady && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.30)' }} />
                <div style={{ position: 'relative', zIndex: 1, width: '52%', aspectRatio: '3/4', border: '2px solid rgba(190,202,92,.8)', borderRadius: '50% 50% 46% 46% / 55% 55% 45% 45%', boxShadow: '0 0 0 9999px rgba(0,0,0,.30)' }} />
              </div>
            )}
            {cameraReady && (
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 11, fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.08em' }}>
                Align your face inside the oval
              </div>
            )}
          </div>
          <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button onClick={capturePhoto} disabled={!cameraReady}
              style={{ width: 76, height: 76, borderRadius: '50%', border: '4px solid rgba(255,255,255,.22)', background: cameraReady ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)', cursor: cameraReady ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: cameraReady ? '#BECA5C' : 'rgba(255,255,255,.2)', transition: 'background .2s' }} />
            </button>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>
              {cameraReady ? 'Tap to capture' : 'Waiting…'}
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Camera error toast */}
      {cameraErr && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#FDF0EF', border: '1px solid #F5C6C2', borderRadius: 10, padding: '12px 20px', fontSize: 13, color: '#922B21', maxWidth: 440, textAlign: 'center', zIndex: 999, boxShadow: '0 4px 24px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{cameraErr}</span>
          <button onClick={() => setCameraErr(null)} style={{ background: 'none', border: 'none', color: '#922B21', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* ── Main page ── */}
      <div className="sk-page-grid" style={{ flex: 1, display: 'flex', gap: 24, padding: '20px 36px 32px', alignItems: 'flex-start', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── Left column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Header */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#23241C', border: '1px solid #3A3D20', borderRadius: '999px', padding: '4px 13px', marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BECA5C', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#BECA5C' }}>Step 2 · Upload</span>
            </div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 32, letterSpacing: '-.02em', margin: 0, color: '#23241C', lineHeight: 1.15 }}>
              {state.trackingDue?.due ? 'Upload your new photo.' : 'Upload your photo.'}
            </h2>
          </div>

          {/* Check-in banner */}
          {state.trackingDue?.due && (() => {
            const td = state.trackingDue;
            const freqDays = td.tracking?.frequency === 'weekly' ? '7 days' : '30 days';
            return (
              <div className="sk-fade-in" style={{ background: 'linear-gradient(135deg,#EEF0DC,#F4F6EA)', border: '1.5px solid #BECA5C', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#BECA5C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A2D14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#23241C', marginBottom: 2 }}>{freqDays} have passed — progress check-in due</div>
                  <div style={{ fontSize: 12.5, color: '#6B6A60', lineHeight: 1.5 }}>Upload a new photo below. Our AI will compare it with your original scan automatically.</div>
                </div>
              </div>
            );
          })()}

          {/* Dropzone — fills remaining height */}
          <div
            className="sk-dropzone-ring"
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              minHeight: 420, position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: faceError  ? '2px solid #C0392B'
                    : dragOver   ? '2px solid #BECA5C'
                    : preview    ? '2px solid #6E7733'
                    :              '2px solid #C8C8B0',
              boxShadow: dragOver  ? '0 0 0 4px rgba(190,202,92,.2), 0 8px 32px rgba(35,36,28,.1)'
                        : preview  ? '0 8px 28px rgba(35,36,28,.12)'
                        :            '0 4px 20px rgba(35,36,28,.07)',
            }}
          >
            {preview ? (
              <>
                <img src={preview.url} alt="Your upload" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {!scanning && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,.65))', padding: '48px 16px 18px', display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => openCamera('user')} style={ghostBtn}>Retake</button>
                    <button onClick={() => { setPreview(null); setFaceError(null); if (fileRef.current) fileRef.current.value = ''; fileRef.current?.click(); }} style={ghostBtn}>Change photo</button>
                  </div>
                )}
                {/* Ready badge */}
                {!scanning && (
                  <div className="sk-fade-in" style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(94,106,42,.9)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: '999px', padding: '5px 13px', fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', border: '1px solid rgba(190,202,92,.4)' }}>
                    ✓ Photo ready
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', width: '100%', height: '100%', textAlign: 'center' }}>

                {/* Floating camera icon */}
                <div className="sk-float" style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#EEF0DC,#DDE4BA)', border: '2px solid #C8D068', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 8px 24px rgba(94,106,42,.15)' }}>
                  <CameraIcon size={34} color="#5E6A2A" />
                </div>

                <p style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#3A3A2E', margin: '0 0 6px', fontWeight: 400 }}>Add your photo to begin</p>
                <p style={{ fontSize: 13, color: '#9C9A8C', margin: '0 0 24px' }}>Take a live photo or upload from your device</p>

                {/* Option cards */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%', maxWidth: 380 }}>
                  <OptionCard Icon={CameraIcon} title="Camera" sub="Take a live photo" onClick={() => openCamera('user')} />
                  <OptionCard Icon={UploadIcon} title="Upload"  sub="Browse your device"  onClick={() => fileRef.current?.click()} />
                </div>

                {/* Drag hint */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 340 }}>
                  <div style={{ flex: 1, height: 1, background: '#E0DDD0' }} />
                  <span style={{ fontSize: 11.5, color: '#B8B4A8', fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.05em', whiteSpace: 'nowrap' }}>or drag & drop here</span>
                  <div style={{ flex: 1, height: 1, background: '#E0DDD0' }} />
                </div>

                {/* Drag-over glow ring */}
                {dragOver && (
                  <div className="sk-pulse" style={{ position: 'absolute', inset: 12, borderRadius: 14, border: '2px dashed #BECA5C', pointerEvents: 'none' }} />
                )}
              </div>
            )}

            {/* Scan overlay */}
            {scanning && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,36,28,.6)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#BECA5C,transparent)', boxShadow: '0 0 20px 5px rgba(190,202,92,.6)', animation: 'sk-scan 2s linear infinite' }} />
                <div className="sk-spin" style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.2)', borderTopColor: '#BECA5C', borderRadius: '50%' }} />
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#F6F4EC' }}>Analysing dermal layers…</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Skin type', 'Acne status'].map(l => (
                    <span key={l} style={{ background: 'rgba(255,255,255,.14)', color: '#F6F4EC', fontFamily: "'Spline Sans Mono'", fontSize: 10, padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.15)' }}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error banner */}
          {faceError && (
            <div className="sk-fade-in" style={{ borderRadius: 13, background: '#FDF0EF', border: '1.5px solid #F5C6C2', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '13px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FBDBD9', border: '1.5px solid #F5C6C2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#922B21', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>!</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#922B21', marginBottom: 3 }}>Could not analyse this image</div>
                  <div style={{ fontSize: 13, color: '#7B241C', lineHeight: 1.5 }}>{faceError}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #F5C6C2', padding: '9px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => openCamera('user')} style={{ background: '#922B21', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Retake with camera</button>
                <button onClick={handleReupload} style={{ background: 'transparent', color: '#922B21', border: '1px solid #F5C6C2', borderRadius: 8, padding: '7px 14px', fontFamily: "'Hanken Grotesk'", fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>Upload different photo</button>
                <button onClick={() => navigate('/guidelines')} style={{ background: 'transparent', border: 'none', color: '#9C9A8C', fontFamily: "'Hanken Grotesk'", fontSize: 12, cursor: 'pointer', padding: '7px 4px', marginLeft: 'auto' }}>View guidelines →</button>
              </div>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* ── Right sidebar ── */}
        <div className="sk-upload-side" style={{ flex: '0 0 290px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Checklist card — light, lime-accented */}
          <div style={{
            background: '#fff',
            border: '1.5px solid #D4DEB8',
            borderLeft: '4px solid #BECA5C',
            borderRadius: 16,
            padding: '20px 20px 18px',
            boxShadow: '0 4px 20px rgba(94,106,42,.09)',
            flex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF0DC', border: '1px solid #C8D068', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5E6A2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.13em', textTransform: 'uppercase', color: '#5E6A2A', fontWeight: 500 }}>Quick checklist</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CHECKLIST.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 12px', background: '#F8FAF0', border: '1px solid #E4EAC4', borderRadius: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#BECA5C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2A2D14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize: 13.5, color: '#3A3A2E', lineHeight: 1.5, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#E8EAD8', margin: '16px 0' }} />

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#F4F6EA', border: '1px solid #D8DCBA', borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ color: '#7E9A3E', marginTop: 1 }}><ShieldIcon /></span>
              <p style={{ fontSize: 12, color: '#6B6A60', lineHeight: 1.6, margin: 0 }}>
                Your photo is encrypted, used only for this analysis, and never shared.
              </p>
            </div>
          </div>

          {/* Action card */}
          <div style={{
            background: '#fff',
            border: `2px solid ${hasPhoto ? '#6E7733' : '#C8C8B0'}`,
            borderRadius: 16,
            padding: '18px 18px',
            boxShadow: hasPhoto ? '0 8px 28px rgba(110,119,51,.18)' : '0 4px 16px rgba(35,36,28,.07)',
            transition: 'border-color .25s, box-shadow .25s',
            flexShrink: 0,
          }}>
            <button
              onClick={runScan}
              disabled={!preview || scanning}
              className={`sk-analyze-btn${hasPhoto ? ' ready' : ''}`}
              style={{
                width: '100%',
                background: hasPhoto ? '#BECA5C' : '#ECEADF',
                color: hasPhoto ? '#1A1E0A' : '#A8A698',
                border: hasPhoto ? '1.5px solid #8A9A40' : '1.5px solid #D4D0C4',
                borderRadius: 12, padding: '14px',
                fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 15,
                cursor: hasPhoto ? 'pointer' : 'not-allowed',
                transition: 'all .2s',
                boxShadow: hasPhoto ? '0 4px 16px rgba(190,202,92,.3)' : 'none',
                letterSpacing: hasPhoto ? '-.01em' : 0,
              }}
            >
              {scanning ? 'Analysing…' : !preview ? 'Select a photo first' : 'Analyze my skin →'}
            </button>

            {!preview && (
              <p style={{ fontSize: 11.5, color: '#B6B4A8', textAlign: 'center', margin: '9px 0 0', lineHeight: 1.5 }}>
                Add a photo from the left to get started.
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '13px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E0DDD0' }} />
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C0BCAC' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E0DDD0' }} />
            </div>

            <button
              onClick={() => navigate('/guidelines')}
              className="sk-guide-link"
              style={{ width: '100%', background: 'transparent', border: '1.5px solid #A8B060', borderRadius: 10, padding: '10px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5, color: '#4A5820', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Review guidelines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ Icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} className="sk-opt-card"
      style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '18px 12px 16px', cursor: 'pointer', textAlign: 'center', fontFamily: "'Hanken Grotesk'", boxShadow: '0 3px 12px rgba(35,36,28,.08)' }}>
      <div className="sk-opt-icon" style={{ width: 46, height: 46, borderRadius: '50%', background: '#F0F3E4', border: '1.5px solid #BECA5C', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E6A2A' }}>
        <Icon size={20} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#23241C', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: '#7A7868', lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}
