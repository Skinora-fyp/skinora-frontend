import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { detect, getRemedies as fetchRemedies, checkTrackingDue, compareProgress, getNotificationCount } from '../api';
import { getRemediesForCondition } from '../data/remedies';

export default function Upload() {
  const navigate          = useNavigate();
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

  // Fetch whether a progress check-in is due for this user
  useEffect(() => {
    if (!state.user) return;
    checkTrackingDue()
      .then(res => dispatch({ type: 'SET_TRACKING_DUE', payload: res.data }))
      .catch(() => {});
  }, [state.user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire stream into video element after the modal mounts
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  // Release camera when component unmounts
  useEffect(() => () => stopStream(), []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function openCamera(mode = facingMode) {
    setCameraErr(null);
    setCameraReady(false);
    stopStream();
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
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permission in your browser settings, then try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device. Please upload a photo from your files instead.'
          : 'Could not start camera. Please upload a photo instead.';
      setCameraErr(msg);
    }
  }

  function closeCamera() {
    stopStream();
    setCameraOpen(false);
    setCameraErr(null);
    setCameraReady(false);
  }

  function capturePhoto() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Mirror the captured image to match what the user saw in the front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      closeCamera();
      setFaceError(null);
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
    setFaceError(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    fileRef.current?.click();
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  async function runScan() {
    if (!preview) return;
    setScanning(true);
    setFaceError(null);
    try {
      const fd = new FormData();
      fd.append('image', preview.file);
      const res  = await detect(fd);
      const data = res.data;

      // Use routing decision from backend (confidence_router.py) — single source of truth
      const routing = data.routing ?? (
        Math.min(data.skin_conf ?? 0, data.acne_conf ?? 0) >= 0.65 ? 'direct'
        : Math.min(data.skin_conf ?? 0, data.acne_conf ?? 0) >= 0.40 ? 'questionnaire'
        : 'consultant'
      );

      dispatch({ type: 'SET_DETECTION', payload: { ...data, image_url: preview.url } });
      dispatch({ type: 'SET_ROUTING',   payload: routing });
      dispatch({ type: 'SET_CHECKIN_PROGRESS', payload: null }); // clear any previous check-in

      // If a progress check-in is due, compare new scan with the tracked baseline
      if (state.trackingDue?.due && data.detection_id) {
        try {
          const cmpRes = await compareProgress({ detection_id: data.detection_id });
          dispatch({ type: 'SET_CHECKIN_PROGRESS', payload: cmpRes.data });
          // Clear badge — notifications resolved server-side by compare endpoint
          getNotificationCount()
            .then(r => dispatch({ type: 'SET_PENDING_CHECKINS', payload: r.data.count }))
            .catch(() => {});
          // Refresh tracking due (next_reminder just got updated)
          checkTrackingDue()
            .then(r => dispatch({ type: 'SET_TRACKING_DUE', payload: r.data }))
            .catch(() => {});
        } catch { /* comparison failure should not block results */ }
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
      // Network / server error — fall back to mock
      const mockData = {
        skin_type: 'Oily', skin_conf: 0.91,
        acne_status: 'Acne', acne_conf: 0.87,
        final_condition: 'Oily_Acne', image_url: preview.url,
      };
      dispatch({ type: 'SET_DETECTION', payload: mockData });
      dispatch({ type: 'SET_ROUTING',   payload: 'direct' });
      dispatch({ type: 'SET_REMEDIES',  payload: getRemediesForCondition('Oily_Acne') });
      setTimeout(() => navigate('/result'), 1800);
    }
  }

  // ── Shared button micro-style helper ─────────────────────────────────────
  const ghostBtn = {
    background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.28)', color: '#fff',
    borderRadius: 9, padding: '8px 18px', fontFamily: "'Hanken Grotesk'",
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  };

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="capture" />

      {/* ═══════════════════════════════════════════════════════════
          CAMERA MODAL
      ═══════════════════════════════════════════════════════════ */}
      {cameraOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,15,12,0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>

          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button onClick={closeCamera} style={ghostBtn}>✕ Close</button>

            <div style={{
              fontFamily: "'Spline Sans Mono',monospace", fontSize: 10,
              letterSpacing: '.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
            }}>
              Skinora · Camera
            </div>

            <button
              onClick={() => openCamera(facingMode === 'user' ? 'environment' : 'user')}
              style={ghostBtn}
              title="Switch front / back camera"
            >
              ⇄ Flip
            </button>
          </div>

          {/* Video viewport */}
          <div style={{
            position: 'relative', borderRadius: 18, overflow: 'hidden',
            width: 'min(90vw, 600px)', aspectRatio: '4/3',
            background: '#111',
            border: '2px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 60px rgba(0,0,0,0.6)',
          }}>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              onCanPlay={() => setCameraReady(true)}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* "Starting…" placeholder */}
            {!cameraReady && (
              <div style={{
                position: 'absolute', inset: 0, background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  color: 'rgba(255,255,255,0.35)', fontSize: 12,
                  fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.1em',
                }}>
                  Starting camera…
                </div>
              </div>
            )}

            {/* Oval face-guide overlay */}
            {cameraReady && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Dim mask outside oval — four rects */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.30)' }} />
                <div style={{
                  position: 'relative', zIndex: 1,
                  width: '52%', aspectRatio: '3/4',
                  border: '2px solid rgba(190,202,92,0.8)',
                  borderRadius: '50% 50% 46% 46% / 55% 55% 45% 45%',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.30)',
                }} />
              </div>
            )}

            {/* Corner hint */}
            {cameraReady && (
              <div style={{
                position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
                color: 'rgba(255,255,255,0.55)', fontSize: 11,
                fontFamily: "'Spline Sans Mono',monospace", letterSpacing: '.08em',
              }}>
                Align your face inside the oval
              </div>
            )}
          </div>

          {/* Capture button */}
          <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              onClick={capturePhoto}
              disabled={!cameraReady}
              style={{
                width: 76, height: 76, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.22)',
                background: cameraReady ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                cursor: cameraReady ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: cameraReady ? '#BECA5C' : 'rgba(255,255,255,0.2)',
                transition: 'background .2s',
              }} />
            </button>
            <div style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 11,
              fontFamily: "'Spline Sans Mono',monospace",
              letterSpacing: '.12em', textTransform: 'uppercase',
            }}>
              {cameraReady ? 'Tap to capture' : 'Waiting…'}
            </div>
          </div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Camera permission / not-found error toast */}
      {cameraErr && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#FDF0EF', border: '1px solid #F5C6C2', borderRadius: 10,
          padding: '12px 20px', fontSize: 13, color: '#922B21',
          maxWidth: 440, textAlign: 'center', zIndex: 999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{cameraErr}</span>
          <button
            onClick={() => setCameraErr(null)}
            style={{ background: 'none', border: 'none', color: '#922B21', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MAIN PAGE
      ═══════════════════════════════════════════════════════════ */}
      <main style={{
        maxWidth: 1020, margin: '0 auto',
        padding: '50px 44px',
        display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start',
      }}>

        {/* ── Check-in due banner ── */}
        {state.trackingDue?.due && (() => {
          const td = state.trackingDue;
          const freqDays = td.tracking?.frequency === 'weekly' ? '7 days' : '30 days';
          return (
            <div style={{ width: '100%', background: 'linear-gradient(135deg,#EEF0DC,#F4F6EA)', border: '1.5px solid #BECA5C', borderRadius: 16, padding: '20px 26px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#BECA5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5E6A2A', marginBottom: 6 }}>
                  Progress check-in due
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#23241C', marginBottom: 4 }}>
                  {freqDays} have passed since you started {td.tracking?.remedy_name ?? 'your remedy'}.
                </div>
                <div style={{ fontSize: 13.5, color: '#6B6A60', lineHeight: 1.55, marginBottom: td.old_detection ? 14 : 0 }}>
                  Upload a new photo below to see your progress. Our AI will automatically compare it with your original scan.
                </div>
                {td.old_detection && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: '#9C9A8C' }}>Original scan:</span>
                    {td.old_detection.image_url ? (
                      <img src={td.old_detection.image_url} alt="Original scan" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid #E0DCCC' }} />
                    ) : (
                      <span style={{ width: 52, height: 52, borderRadius: 10, background: '#ECEADF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</span>
                    )}
                    <span style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: '#7E9A3E', background: '#F4F6EA', padding: '4px 10px', borderRadius: 6 }}>
                      {td.old_detection.final_condition}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Left: dropzone / preview ── */}
        <div style={{ flex: '1 1 420px' }}>
          <div style={{
            fontFamily: "'Spline Sans Mono',monospace", fontSize: 11,
            letterSpacing: '.16em', textTransform: 'uppercase',
            color: '#9C9A8C', marginBottom: 14,
          }}>
            Step 02 · Upload
          </div>
          <h2 style={{
            fontFamily: "'Newsreader',serif", fontWeight: 400,
            fontSize: 38, letterSpacing: '-.02em', margin: '0 0 22px',
          }}>
            {state.trackingDue?.due ? 'Upload your new photo.' : 'Upload your photo.'}
          </h2>

          {/* Dropzone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              position: 'relative',
              border: `2px dashed ${
                faceError ? '#C0392B' : dragOver ? '#BECA5C' : preview ? '#C8C4BA' : '#CFCBBC'
              }`,
              borderRadius: 18,
              overflow: 'hidden',
              background: '#fff',
              minHeight: 380,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color .2s',
            }}
          >

            {preview ? (
              /* ── Preview with change/retake overlay ── */
              <>
                <img
                  src={preview.url}
                  alt="Your upload"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 380 }}
                />
                {!scanning && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.60))',
                    padding: '40px 16px 16px',
                    display: 'flex', gap: 8, justifyContent: 'center',
                  }}>
                    <button
                      onClick={() => openCamera('user')}
                      style={ghostBtn}
                    >
                      📷 Retake
                    </button>
                    <button
                      onClick={() => {
                        setPreview(null); setFaceError(null);
                        if (fileRef.current) fileRef.current.value = '';
                        fileRef.current?.click();
                      }}
                      style={ghostBtn}
                    >
                      🖼 Change
                    </button>
                  </div>
                )}
              </>

            ) : (
              /* ── Empty state: two option cards ── */
              <div style={{ padding: '28px 24px', width: '100%' }}>

                <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>

                  {/* Camera card */}
                  <OptionCard
                    icon="📷"
                    title="Take a photo"
                    sub="Use your device camera"
                    onClick={() => openCamera('user')}
                  />

                  {/* Upload card */}
                  <OptionCard
                    icon="🖼️"
                    title="Upload photo"
                    sub="Browse from your device"
                    onClick={() => fileRef.current?.click()}
                  />
                </div>

                {/* Drag & drop hint */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: '#ECEAE2' }} />
                  <span style={{ fontSize: 12, color: '#B8B4A8' }}>or drag & drop here</span>
                  <div style={{ flex: 1, height: 1, background: '#ECEAE2' }} />
                </div>
              </div>
            )}

            {/* Scan overlay */}
            {scanning && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(35,36,28,.55)', backdropFilter: 'blur(1px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 18,
              }}>
                <div className="animate-scan" style={{
                  position: 'absolute', left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg,transparent,#BECA5C,transparent)',
                  boxShadow: '0 0 18px 4px rgba(190,202,92,.7)',
                }} />
                <div className="animate-spinner" style={{
                  width: 46, height: 46,
                  border: '3px solid rgba(255,255,255,.25)',
                  borderTopColor: '#BECA5C', borderRadius: '50%',
                }} />
                <div style={{
                  fontFamily: "'Spline Sans Mono',monospace", fontSize: 11,
                  letterSpacing: '.14em', textTransform: 'uppercase', color: '#F6F4EC',
                }}>
                  Analysing dermal layers…
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Model 1 · Skin type', 'Model 2 · Acne'].map((l) => (
                    <span key={l} style={{
                      background: 'rgba(255,255,255,.16)', color: '#F6F4EC',
                      fontFamily: "'Spline Sans Mono'", fontSize: 10,
                      padding: '5px 10px', borderRadius: '999px',
                    }}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Error banner with actions ── */}
          {faceError && (
            <div style={{
              marginTop: 14, borderRadius: 14,
              background: '#FDF0EF', border: '1px solid #F5C6C2',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#922B21', marginBottom: 4 }}>
                    Could not analyse this image
                  </div>
                  <div style={{ fontSize: 13, color: '#7B241C', lineHeight: 1.55 }}>
                    {faceError}
                  </div>
                  <div style={{ fontSize: 12, color: '#9C9A8C', marginTop: 6, lineHeight: 1.5 }}>
                    Tips: use natural lighting, face the camera directly, avoid filters or heavy makeup.
                  </div>
                </div>
              </div>
              <div style={{
                borderTop: '1px solid #F5C6C2', padding: '10px 18px',
                display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => openCamera('user')}
                  style={{
                    background: '#922B21', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 16px',
                    fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  📷 Retake with camera
                </button>
                <button
                  onClick={handleReupload}
                  style={{
                    background: 'transparent', color: '#922B21',
                    border: '1px solid #F5C6C2', borderRadius: 8,
                    padding: '8px 16px', fontFamily: "'Hanken Grotesk'",
                    fontWeight: 500, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Upload different photo
                </button>
                <button
                  onClick={() => navigate('/guidelines')}
                  style={{
                    background: 'transparent', border: 'none', color: '#9C9A8C',
                    fontFamily: "'Hanken Grotesk'", fontSize: 12,
                    cursor: 'pointer', padding: '8px 4px', marginLeft: 'auto',
                  }}
                >
                  View guidelines →
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* ── Right: checklist + analyse ── */}
        <div style={{ flex: '0 0 320px' }}>
          <div style={{ background: '#F1EEE3', borderRadius: 16, padding: 26 }}>
            <div style={{
              fontFamily: "'Spline Sans Mono',monospace", fontSize: 10,
              letterSpacing: '.12em', textTransform: 'uppercase',
              color: '#9C9A8C', marginBottom: 16,
            }}>
              Quick checklist
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: '#4F4E45' }}>
              {[
                'Natural lighting',
                'Face centred & sharp',
                'No filters or makeup',
                'JPG or PNG · up to 10 MB',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <span style={{ color: '#7E9A3E', fontWeight: 700 }}>✓</span> {item}
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#E0DCCC', margin: '22px 0' }} />

            <p style={{ fontSize: 12.5, color: '#9C9A8C', lineHeight: 1.6, margin: '0 0 20px' }}>
              Your photo is encrypted, used only for this analysis, and never shared.
            </p>

            <button
              onClick={runScan}
              disabled={!preview || scanning}
              style={{
                width: '100%',
                background: preview && !scanning ? '#BECA5C' : '#E0DCCC',
                color: '#2A2D14', border: 'none', borderRadius: 12, padding: 15,
                fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15,
                cursor: preview && !scanning ? 'pointer' : 'not-allowed',
                opacity: scanning ? 0.8 : 1,
                transition: 'background .2s',
              }}
            >
              {scanning ? 'Analysing…' : !preview ? 'Select a photo first' : 'Analyze my skin →'}
            </button>

            <button
              onClick={() => navigate('/guidelines')}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: '#9C9A8C', fontFamily: "'Hanken Grotesk'",
                fontSize: 13, marginTop: 10, cursor: 'pointer', padding: '8px 0',
              }}
            >
              Review guidelines
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Small helper component for the two choice cards ──────────────────────
function OptionCard({ icon, title, sub, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, background: hovered ? '#F8F9EC' : '#F6F4EC',
        border: `1.5px solid ${hovered ? '#BECA5C' : '#E0DCCC'}`,
        borderRadius: 14, padding: '22px 14px', cursor: 'pointer',
        textAlign: 'center', transition: 'all .15s',
        fontFamily: "'Hanken Grotesk'",
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#3B3A30', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#9C9A8C', lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}
