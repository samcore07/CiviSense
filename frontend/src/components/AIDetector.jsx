import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  Send,
  Trash2,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck
} from './Icons';

export default function AIDetector({ API, onPrefillComplaint, onDirectFileComplaint }) {
  const [mode, setMode] = useState('live'); // 'live' | 'upload'
  const [selectedModel, setSelectedModel] = useState('all'); // 'all' | 'pothole' | 'waterlogging' | 'garbage'

  // Live Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [liveCounts, setLiveCounts] = useState({
    potholes: 0,
    waterlogging: 0,
    garbage: 0,
    total: 0
  });
  const [liveConfidence, setLiveConfidence] = useState({
    potholes: 0,
    waterlogging: 0,
    garbage: 0
  });
  const [lastDetections, setLastDetections] = useState([]);

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const sendLoopRef = useRef(null);

  // Upload Analyzer State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  // WebSocket URL calculation
  const getWebSocketUrl = () => {
    const base = API.replace(/^http/, 'ws');
    return `${base}/ws`;
  };

  // ----------------------------------------------------
  // LIVE CAMERA WEBSOCKET PIPELINE
  // ----------------------------------------------------
  const startCamera = async () => {
    setConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setConnecting(false);
          initWebSocket();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera: ' + err.message);
      setConnecting(false);
    }
  };

  const stopCamera = () => {
    if (sendLoopRef.current) {
      clearTimeout(sendLoopRef.current);
      sendLoopRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    setCameraActive(false);
    setLiveCounts({ potholes: 0, waterlogging: 0, garbage: 0, total: 0 });
    setLastDetections([]);
  };

  const initWebSocket = () => {
    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('CIVISENSE Live Camera WebSocket connected');
        scheduleFrameSend();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.detections) {
            renderDetections(data.detections);
            setLastDetections(data.detections);

            const potholes = data.pothole_detections || [];
            const water = data.waterlogging_detections || [];
            const garbage = data.garbage_detections || [];

            setLiveCounts({
              potholes: potholes.length,
              waterlogging: water.length,
              garbage: garbage.length,
              total: data.count || 0
            });

            setLiveConfidence({
              potholes: potholes.length ? Math.max(...potholes.map((d) => d.confidence)) : 0,
              waterlogging: water.length ? Math.max(...water.map((d) => d.confidence)) : 0,
              garbage: garbage.length ? Math.max(...garbage.map((d) => d.confidence)) : 0
            });
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WS error:', err);
      };

      ws.onclose = () => {
        console.log('WS disconnected');
      };
    } catch (err) {
      console.error('Failed to open WS:', err);
    }
  };

  const scheduleFrameSend = () => {
    if (!streamRef.current || !socketRef.current) return;

    sendLoopRef.current = setTimeout(async () => {
      await sendCurrentFrame();
      scheduleFrameSend();
    }, 280); // ~3.5 FPS inference loop
  };

  const sendCurrentFrame = async () => {
    const video = videoRef.current;
    const capture = captureCanvasRef.current;
    const socket = socketRef.current;

    if (!video || !capture || !socket || socket.readyState !== WebSocket.OPEN) return;
    if (video.readyState < 2) return;

    const scale = Math.min(1, 640 / Math.max(video.videoWidth || 640, video.videoHeight || 480));
    capture.width = Math.round(video.videoWidth * scale);
    capture.height = Math.round(video.videoHeight * scale);

    const ctx = capture.getContext('2d');
    ctx.drawImage(video, 0, 0, capture.width, capture.height);

    const blob = await new Promise((res) => capture.toBlob(res, 'image/jpeg', 0.8));
    if (blob && socket.readyState === WebSocket.OPEN) {
      socket.send(await blob.arrayBuffer());
    }
  };

  const renderDetections = (detections) => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;

    if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
    }

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    detections.forEach((d) => {
      const x = d.x1 * overlay.width;
      const y = d.y1 * overlay.height;
      const w = (d.x2 - d.x1) * overlay.width;
      const h = (d.y2 - d.y1) * overlay.height;

      // Filter out full-frame false-positives (boxes covering almost the entire video frame)
      if (w > overlay.width * 0.85 && h > overlay.height * 0.78) return;

      const cls = (d.class || '').toLowerCase();
      let color = '#38BDF8'; // Pothole default cyan/blue
      let label = 'POTHOLE';

      if (cls.includes('water')) {
        color = '#F59E0B'; // Amber
        label = 'WATERLOGGING';
      } else if (cls.includes('garbage') || cls.includes('trash') || cls.includes('waste') || cls.includes('litter')) {
        color = '#10B981'; // Emerald
        label = 'GARBAGE';
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Label background & text
      const tag = `${label} ${(d.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 13px var(--font-mono, monospace)';
      const tw = ctx.measureText(tag).width;

      const ly = Math.max(20, y);
      ctx.fillStyle = color;
      ctx.fillRect(x, ly - 18, tw + 10, 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tag, x + 5, ly - 3);
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Quick Register From Camera Snapshot
  const handleRegisterFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;

    const snap = document.createElement('canvas');
    snap.width = video.videoWidth || 640;
    snap.height = video.videoHeight || 480;
    const ctx = snap.getContext('2d');
    ctx.drawImage(video, 0, 0, snap.width, snap.height);

    snap.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `civisense_cam_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Determine most urgent category
      let category = 'pothole';
      if (liveCounts.waterlogging > 0) category = 'waterlogging';
      if (liveCounts.garbage > 0 && liveCounts.potholes === 0) category = 'garbage';

      if (onPrefillComplaint) {
        onPrefillComplaint({
          photoFile: file,
          photoPreview: URL.createObjectURL(file),
          category,
          severity: 4,
          description: `Live AI Camera Capture: Automated detection flagged active ${category.toUpperCase()} defect on road surface. Verified in real time.`
        });
      }
    }, 'image/jpeg', 0.9);
  };

  // ----------------------------------------------------
  // IMAGE UPLOAD ANALYZER PIPELINE
  // ----------------------------------------------------
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setAnalysisResult(null);
      setAnalysisError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadFile) return;

    setAnalyzing(true);
    setAnalysisError('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch(`${API}/api/detect/image?model=${selectedModel}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Inference failed');
      }

      setAnalysisResult(data);
    } catch (err) {
      setAnalysisError(err.message || 'Detection failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyAnalysisToComplaint = () => {
    if (!analysisResult || !uploadFile) return;
    const cat = (analysisResult.top_category && analysisResult.top_category !== 'none') ? analysisResult.top_category : 'garbage';

    if (onPrefillComplaint) {
      onPrefillComplaint({
        photoFile: uploadFile,
        photoPreview: analysisResult.annotated_image || uploadPreview,
        category: cat,
        severity: analysisResult.suggested_severity || 4,
        description: analysisResult.ai_description || `AI automated inspection report for ${cat}.`
      });
    }
  };

  const handleDirectFileComplaint = () => {
    if (!analysisResult || !uploadFile) return;
    const cat = (analysisResult.top_category && analysisResult.top_category !== 'none') ? analysisResult.top_category : 'garbage';
    const payload = {
      photoFile: uploadFile,
      photoPreview: analysisResult.annotated_image || uploadPreview,
      category: cat,
      severity: analysisResult.suggested_severity || 4,
      description: analysisResult.ai_description || `AI automated inspection report for ${cat}.`
    };

    if (onDirectFileComplaint) {
      onDirectFileComplaint(payload);
    } else if (onPrefillComplaint) {
      onPrefillComplaint(payload);
    }
  };

  return (
    <div className="ai-detector-wrapper" style={{ marginTop: '12px' }}>
      {/* Header bar */}
      <div className="app-panel" style={{ marginBottom: '18px' }}>
        <div className="app-panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="preview-eyebrow" style={{ color: 'var(--accent-cyan)' }}>
                CIVISENSE AI VISION ENGINE
              </span>
            </div>
            <h3 className="app-panel-title" style={{ marginTop: '4px' }}>
              Multi-Defect Visual Intelligence Workstation
            </h3>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-subtle)', padding: '4px', borderRadius: 'var(--radius-pill)' }}>
            <button
              className={`category-chip-btn ${mode === 'live' ? 'active' : ''}`}
              style={{ margin: 0, padding: '6px 16px', fontSize: '13px' }}
              onClick={() => setMode('live')}
            >
              <Camera size={14} /> Live Camera Scanner
            </button>
            <button
              className={`category-chip-btn ${mode === 'upload' ? 'active' : ''}`}
              style={{ margin: 0, padding: '6px 16px', fontSize: '13px' }}
              onClick={() => setMode('upload')}
            >
              <Layers size={14} /> Image File Analyzer
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '12px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#38BDF8' }}></span>
            Potholes
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }}></span>
            Waterlogging
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }}></span>
            Garbage & Litter
          </span>
        </div>
      </div>

      {/* ---------------- LIVE SCANNER MODE ---------------- */}
      {mode === 'live' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px' }}>
          <section className="app-panel">
            {/* Camera Viewport */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '520px',
                minHeight: '360px',
                background: '#070B13',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: cameraActive ? 'block' : 'none'
                }}
              />
              <canvas
                ref={overlayRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  objectFit: 'contain'
                }}
              />
              <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

              {!cameraActive && (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <Camera size={44} style={{ color: 'var(--accent-cyan)', opacity: 0.8, marginBottom: '12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Real-Time Defect Detection Scanner
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '6px auto 16px' }}>
                    Stream high-speed camera frames directly for instant road defect tracking.
                  </p>
                  <button
                    className="btn-pill-primary"
                    disabled={connecting}
                    onClick={startCamera}
                    style={{ padding: '10px 24px', fontSize: '14px' }}
                  >
                    {connecting ? 'Initializing Optical Sensor...' : 'Start Live Camera Scanner'}
                  </button>
                </div>
              )}

              {/* Live Overlay HUD when active */}
              {cameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#F8FAFC',
                    zIndex: 10
                  }}
                >
                  <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s infinite', display: 'inline-block' }}></span>
                    STREAMING
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>|</span>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>AI: Apple Silicon GPU (MPS)</span>
                </div>
              )}
            </div>

            {/* Camera Controls & Metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {cameraActive ? (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={stopCamera}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      Stop Camera
                    </button>
                    <button
                      className="btn-pill-primary"
                      onClick={handleRegisterFromCamera}
                      style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Send size={13} /> Convert Detection to Ticket
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-pill-primary"
                    onClick={startCamera}
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    Start Scanner
                  </button>
                )}
              </div>

              {/* Live HUD Counters */}
              <div style={{ display: 'flex', gap: '14px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#38BDF8' }}>
                  Potholes: <strong>{liveCounts.potholes}</strong>
                </span>
                <span style={{ color: '#F59E0B' }}>
                  Water: <strong>{liveCounts.waterlogging}</strong>
                </span>
                <span style={{ color: '#10B981' }}>
                  Garbage: <strong>{liveCounts.garbage}</strong>
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ---------------- IMAGE UPLOAD ANALYZER MODE ---------------- */}
      {mode === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: uploadPreview ? '1fr 1fr' : '1fr', gap: '18px' }}>
          {/* Upload & Select Panel */}
          <section className="app-panel">
            <div className="app-panel-header">
              <div>
                <span className="preview-eyebrow">IMAGE INFERENCE WORKSTATION</span>
                <h3 className="app-panel-title">Upload Road Photograph</h3>
              </div>
            </div>

            {/* Model Target Filter */}
            <div style={{ marginBottom: '14px' }}>
              <label className="demo-label">Target Models</label>
              <div className="category-chips-row" style={{ marginTop: '4px' }}>
                {[
                  { key: 'all', label: 'All 3 Models (Recommended)' },
                  { key: 'pothole', label: '🕳️ Potholes Only' },
                  { key: 'waterlogging', label: '🌊 Waterlogging Only' },
                  { key: 'garbage', label: '🗑️ Garbage Only' }
                ].map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    className={`category-chip-btn ${selectedModel === m.key ? 'active' : ''}`}
                    onClick={() => setSelectedModel(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone */}
            {!uploadPreview ? (
              <label className="file-dropzone" style={{ display: 'block', padding: '36px 20px', cursor: 'pointer' }}>
                <Camera size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Click to Browse or Drag Image Here
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports JPEG, PNG, WebP up to 12 MB
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div style={{ position: 'relative' }}>
                <div className="photo-preview-box" style={{ maxHeight: '280px' }}>
                  <img src={uploadPreview} alt="Selected photograph" style={{ objectFit: 'contain' }} />
                  <button
                    type="button"
                    className="photo-clear-btn"
                    onClick={() => {
                      setUploadFile(null);
                      setUploadPreview(null);
                      setAnalysisResult(null);
                    }}
                    title="Remove image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-submit-incident"
                  disabled={analyzing}
                  onClick={handleRunAnalysis}
                  style={{ marginTop: '14px', width: '100%' }}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw size={15} className="spin" /> Running AI Detection...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Run Neural Defect Analysis
                    </>
                  )}
                </button>
              </div>
            )}

            {analysisError && (
              <div className="notification-banner error" style={{ marginTop: '12px' }}>
                {analysisError}
              </div>
            )}
          </section>

          {/* Analysis Results Visual Feedback */}
          {analysisResult && (
            <section className="app-panel">
              <div className="app-panel-header">
                <div>
                  <span className="preview-eyebrow" style={{ color: '#10B981' }}>
                    INFERENCE COMPLETED
                  </span>
                  <h3 className="app-panel-title">Visual Annotations & Metrics</h3>
                </div>
                {analysisResult.top_category && analysisResult.top_category !== 'none' ? (
                  <span className="app-user-role-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> {analysisResult.top_category.toUpperCase()} DETECTED
                  </span>
                ) : (
                  <span className="app-user-role-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> NO DEFECTS DETECTED
                  </span>
                )}
              </div>

              {/* Annotated bounding box image */}
              {analysisResult.annotated_image && (
                <div className="photo-preview-box" style={{ maxHeight: '300px', marginBottom: '14px' }}>
                  <img src={analysisResult.annotated_image} alt="Annotated Detection Result" style={{ objectFit: 'contain' }} />
                </div>
              )}

              {/* Metrics Pill Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div className="app-stat-card" style={{ padding: '10px' }}>
                  <div className="num" style={{ fontSize: '20px', color: '#38BDF8' }}>
                    {analysisResult.pothole_count || 0}
                  </div>
                  <div className="desc" style={{ fontSize: '11px' }}>Potholes</div>
                </div>
                <div className="app-stat-card" style={{ padding: '10px' }}>
                  <div className="num" style={{ fontSize: '20px', color: '#F59E0B' }}>
                    {analysisResult.waterlogging_count || 0}
                  </div>
                  <div className="desc" style={{ fontSize: '11px' }}>Waterlogging</div>
                </div>
                <div className="app-stat-card" style={{ padding: '10px' }}>
                  <div className="num" style={{ fontSize: '20px', color: '#10B981' }}>
                    {analysisResult.garbage_count || 0}
                  </div>
                  <div className="desc" style={{ fontSize: '11px' }}>Garbage / Waste</div>
                </div>
              </div>

              {/* Breakdown of detected defect entities */}
              {analysisResult.detections && analysisResult.detections.length > 0 ? (
                <div style={{ background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                    Identified Defect Objects ({analysisResult.detections.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {analysisResult.detections.map((d, idx) => {
                      const isGarbage = d.class === 'garbage';
                      const isWater = d.class === 'waterlogging';
                      const color = isGarbage ? '#10B981' : isWater ? '#F59E0B' : '#38BDF8';
                      const bg = isGarbage ? 'rgba(16, 185, 129, 0.12)' : isWater ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)';
                      const icon = isGarbage ? '🗑️' : isWater ? '🌊' : '🕳️';
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            background: 'var(--bg-surface)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12px'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <span>{icon}</span>
                            <span style={{ textTransform: 'capitalize' }}>{d.class}</span>
                            {d.raw_class && d.raw_class !== d.class && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                                ({d.raw_class})
                              </span>
                            )}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: bg, color }}>
                            {(d.confidence * 100).toFixed(1)}% match
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No civic defect patterns exceeded confidence threshold.
                </div>
              )}

              {/* Synthesized AI Description Box */}
              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Synthesized Complaint Summary
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {analysisResult.ai_description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Confidence: {(analysisResult.top_confidence * 100).toFixed(1)}%</span>
                  <span>Suggested Hazard Severity: {analysisResult.suggested_severity} / 5</span>
                </div>
              </div>

              {/* Action Buttons: Direct File to Status or Edit in Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={handleDirectFileComplaint}
                  style={{ width: '100%', padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Send size={14} /> File Complaint & Forward to Status
                </button>
                <button
                  type="button"
                  className="btn-text"
                  onClick={handleApplyAnalysisToComplaint}
                  style={{ width: '100%', padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)' }}
                >
                  <ClipboardCheck size={14} /> Review & Edit in Registration Form
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
