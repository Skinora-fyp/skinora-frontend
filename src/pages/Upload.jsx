import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import { detect, getRemedies as fetchRemedies } from '../api';
import { getRemediesForCondition } from '../data/remedies';

export default function Upload() {
  const navigate      = useNavigate();
  const { dispatch }  = useApp();
  const fileRef       = useRef(null);
  const [preview, setPreview]   = useState(null);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [faceError, setFaceError] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be ≤ 10 MB.'); return; }
    setFaceError(null);
    const url = URL.createObjectURL(file);
    setPreview({ url, file });
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  async function runScan() {
    if (!preview) { alert('Please select a photo first.'); return; }
    setScanning(true);
    setFaceError(null);
    try {
      const fd = new FormData();
      fd.append('image', preview.file);
      const res = await detect(fd);
      const data = res.data;

      const minConf = Math.min(data.skin_conf ?? 0, data.acne_conf ?? 0);
      const routing = minConf >= 0.70 ? 'direct' : minConf >= 0.40 ? 'questionnaire' : 'consultant';

      dispatch({ type: 'SET_DETECTION', payload: { ...data, image_url: preview.url } });
      dispatch({ type: 'SET_ROUTING',   payload: routing });

      try {
        const remRes = await fetchRemedies(data.final_condition);
        dispatch({ type: 'SET_REMEDIES', payload: remRes.data.remedies || [] });
      } catch {
        dispatch({ type: 'SET_REMEDIES', payload: getRemediesForCondition(data.final_condition) });
      }

      setTimeout(() => {
        navigate(routing === 'consultant' ? '/consult' : '/result');
      }, 400);

    } catch (err) {
      setScanning(false);

      // 400 = validation error (no face, wrong file type, etc.)
      if (err.response?.status === 400) {
        setFaceError(err.response.data?.error || 'No face detected. Please upload a clear face photo.');
        return;
      }

      // 500 / network error — fall back to mock so the demo still works
      const mockData = {
        skin_type: 'Oily', skin_conf: 0.91,
        acne_status: 'Acne', acne_conf: 0.87,
        final_condition: 'Oily_Acne',
        image_url: preview.url,
      };
      dispatch({ type: 'SET_DETECTION', payload: mockData });
      dispatch({ type: 'SET_ROUTING',   payload: 'direct' });
      dispatch({ type: 'SET_REMEDIES',  payload: getRemediesForCondition('Oily_Acne') });
      setTimeout(() => navigate('/result'), 1800);
    }
  }

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="capture" />

      <main style={{ maxWidth: 1020, margin: '0 auto', padding: '50px 44px', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>

        {/* ── Left: dropzone ── */}
        <div style={{ flex: '1 1 420px' }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 14 }}>Step 02 · Upload</div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 38, letterSpacing: '-.02em', margin: '0 0 22px' }}>Upload your photo.</h2>

          <div
            onClick={() => !scanning && fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              position: 'relative',
              border: `2px dashed ${faceError ? '#C0392B' : dragOver ? '#BECA5C' : '#CFCBBC'}`,
              borderRadius: 18,
              overflow: 'hidden', background: '#fff', height: 420,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: scanning ? 'default' : 'pointer',
              transition: 'border-color .2s',
            }}
          >
            {preview ? (
              <img src={preview.url} alt="Your upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#9C9A8C', padding: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#6B6A60', marginBottom: 6 }}>Drop your face photo here</div>
                <div style={{ fontSize: 13 }}>or click to browse</div>
              </div>
            )}

            {/* Scan overlay */}
            {scanning && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,36,28,.55)', backdropFilter: 'blur(1px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                <div className="animate-scan" style={{ position: 'absolute', left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,transparent,#BECA5C,transparent)', boxShadow: '0 0 18px 4px rgba(190,202,92,.7)' }} />
                <div className="animate-spinner" style={{ width: 46, height: 46, border: '3px solid rgba(255,255,255,.25)', borderTopColor: '#BECA5C', borderRadius: '50%' }} />
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#F6F4EC' }}>Analysing dermal layers…</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Model 1 · Skin type', 'Model 2 · Acne'].map((l) => (
                    <span key={l} style={{ background: 'rgba(255,255,255,.16)', color: '#F6F4EC', fontFamily: "'Spline Sans Mono'", fontSize: 10, padding: '5px 10px', borderRadius: '999px' }}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Face detection error banner */}
          {faceError && (
            <div style={{
              marginTop: 14, padding: '14px 18px', borderRadius: 12,
              background: '#FDF0EF', border: '1px solid #F5C6C2',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#922B21', marginBottom: 4 }}>
                  No face detected
                </div>
                <div style={{ fontSize: 13, color: '#7B241C', lineHeight: 1.5 }}>
                  {faceError} Please try again with a clear, well-lit frontal photo.
                </div>
              </div>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {/* ── Right: checklist panel ── */}
        <div style={{ flex: '0 0 320px' }}>
          <div style={{ background: '#F1EEE3', borderRadius: 16, padding: 26 }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 16 }}>Quick checklist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: '#4F4E45' }}>
              {['Natural lighting', 'Face centred & sharp', 'No filters or makeup', 'JPG or PNG · up to 10 MB'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <span style={{ color: '#7E9A3E', fontWeight: 700 }}>✓</span> {item}
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#E0DCCC', margin: '22px 0' }} />

            <p style={{ fontSize: 12.5, color: '#9C9A8C', lineHeight: 1.6, margin: '0 0 20px' }}>
              Your photo is encrypted, used only for this analysis, and never shared.
            </p>

            <button onClick={runScan} disabled={scanning}
              style={{ width: '100%', background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: 12, padding: 15, fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: scanning ? 'not-allowed' : 'pointer', opacity: scanning ? .8 : 1 }}>
              {scanning ? 'Analysing…' : 'Analyze my skin →'}
            </button>

            <button onClick={() => navigate('/guidelines')}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#9C9A8C', fontFamily: "'Hanken Grotesk'", fontSize: 13, marginTop: 10, cursor: 'pointer', padding: '8px 0' }}>
              Review guidelines
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
