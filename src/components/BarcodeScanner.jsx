import { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, KeyboardIcon, CameraIcon, CheckIcon } from './Icons';

const REQUIRED_CONSECUTIVE = 3;
const DETECT_INTERVAL = 350;

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasDetectorApi, setHasDetectorApi] = useState(false);

  const [phase, setPhase] = useState('scanning');
  const [lockProgress, setLockProgress] = useState(0);
  const [detectedCode, setDetectedCode] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const consecutiveRef = useRef({ code: null, count: 0 });

  useEffect(() => {
    setHasDetectorApi('BarcodeDetector' in window);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  }, []);

  const dataUrlToFile = useCallback((dataUrl) => {
    if (!dataUrl) return null;
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], `scan-${Date.now()}.jpg`, { type: mime });
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (manualMode || phase === 'confirming') return;
    let active = true;
    let scanTimer = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
        }
        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({
            formats: [
              'ean_13', 'ean_8', 'upc_a', 'upc_e',
              'code_128', 'code_39', 'code_93',
              'itf', 'qr_code', 'data_matrix',
            ],
          });
          scanTimer = setInterval(() => scanOnce(detector), DETECT_INTERVAL);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setManualMode(true);
      }
    };

    const scanOnce = async (detector) => {
      if (!active || !videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const code = barcodes[0].rawValue;
          const cons = consecutiveRef.current;
          if (cons.code === code) {
            cons.count++;
          } else {
            cons.code = code;
            cons.count = 1;
          }
          setLockProgress(cons.count);
          if (cons.count >= 2) setPhase('locking');
          if (cons.count >= REQUIRED_CONSECUTIVE) {
            if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
            const img = captureFrame();
            setDetectedCode(code);
            setCapturedImage(img);
            setPhase('confirming');
            clearInterval(scanTimer);
            return;
          }
        } else {
          consecutiveRef.current = { code: null, count: 0 };
          setLockProgress(0);
          setPhase('scanning');
        }
      } catch {}
    };

    startCamera();
    return () => {
      active = false;
      if (scanTimer) clearInterval(scanTimer);
    };
  }, [manualMode, phase, captureFrame]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleConfirm = () => {
    stopCamera();
    const file = dataUrlToFile(capturedImage);
    onDetected(detectedCode, capturedImage, file);
  };

  const handleRetry = () => {
    setDetectedCode(null);
    setCapturedImage(null);
    setLockProgress(0);
    consecutiveRef.current = { code: null, count: 0 };
    setPhase('scanning');
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    if (navigator.vibrate) navigator.vibrate(100);
    stopCamera();
    onDetected(code, null, null);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Confirmation screen after successful barcode detection
  if (phase === 'confirming') {
    return (
      <div style={s.overlay}>
        <div style={s.confirmContainer} className="animate-slide-up">
          {capturedImage && (
            <div style={s.confirmImageWrap}>
              <img src={capturedImage} alt="Scanned" style={s.confirmImage} />
              <div style={s.confirmImageBadge}>Scan capture</div>
            </div>
          )}
          <div style={s.confirmBarcodeCard}>
            <div style={s.confirmLabel}>BARCODE DETECTED</div>
            <div style={s.confirmCode}>{detectedCode}</div>
          </div>
          <p style={s.confirmHint}>
            Is this correct? This image will be saved as the first photo.
          </p>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleRetry}>
              Retry
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleConfirm}>
              <CheckIcon size={18} /> Confirm
            </button>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 4 }} onClick={() => setManualMode(true)}>
            <KeyboardIcon size={16} /> Enter manually instead
          </button>
        </div>
      </div>
    );
  }

  // Manual barcode entry fallback
  if (manualMode) {
    return (
      <div style={s.overlay}>
        <div style={s.manualCard} className="animate-slide-up">
          <h2 style={s.manualTitle}>Enter Barcode</h2>
          <p style={s.manualSub}>Type or paste the barcode / part number</p>
          <input
            autoFocus
            className="input"
            style={{ fontFamily: 'var(--mono)', fontSize: 20, textAlign: 'center', marginTop: 16 }}
            placeholder="e.g. 4006381333931"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            inputMode="text"
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleManualSubmit} disabled={!manualCode.trim()}>Confirm</button>
          </div>
          {hasDetectorApi && (
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => { setManualMode(false); setPhase('scanning'); }}>
              <CameraIcon size={18} /> Try camera instead
            </button>
          )}
        </div>
      </div>
    );
  }

  // Live camera scanning with lock-on detection
  const progressPct = Math.min(100, (lockProgress / REQUIRED_CONSECUTIVE) * 100);
  const isLocking = phase === 'locking';
  const cornerColor = isLocking ? '#22C55E' : 'var(--amber)';

  return (
    <div style={s.overlay}>
      <video ref={videoRef} autoPlay playsInline muted style={s.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={s.vignette} />

      {/* Scan frame */}
      <div style={s.frame}>
        <div style={{ ...s.corner, top: 0, left: 0, borderTop: `3px solid ${cornerColor}`, borderLeft: `3px solid ${cornerColor}` }} />
        <div style={{ ...s.corner, top: 0, right: 0, borderTop: `3px solid ${cornerColor}`, borderRight: `3px solid ${cornerColor}` }} />
        <div style={{ ...s.corner, bottom: 0, left: 0, borderBottom: `3px solid ${cornerColor}`, borderLeft: `3px solid ${cornerColor}` }} />
        <div style={{ ...s.corner, bottom: 0, right: 0, borderBottom: `3px solid ${cornerColor}`, borderRight: `3px solid ${cornerColor}` }} />
        {!isLocking && <div style={s.scanLine} />}
        {isLocking && (
          <div style={s.progressBarBg}>
            <div style={{ ...s.progressBarFill, width: `${progressPct}%` }} />
          </div>
        )}
      </div>

      {/* Top bar */}
      <div style={s.topBar}>
        <button style={s.closeBtn} onClick={handleClose}><XIcon /></button>
        <div style={s.topTitle}>{isLocking ? 'Hold steady...' : 'Scan Barcode'}</div>
      </div>

      {/* Guide text */}
      <div style={s.guideArea}>
        <div style={{
          ...s.guideBox,
          background: isLocking ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.6)',
          borderColor: isLocking ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
        }}>
          <p style={s.guideText}>
            {isLocking
              ? 'Barcode detected — keep holding...'
              : 'Hold the phone at arm\'s length so the whole box is visible. Center the barcode in the frame and hold steady.'}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={s.bottomBar}>
        {!hasDetectorApi && (
          <p style={{ color: 'var(--amber)', fontSize: 13, textAlign: 'center', maxWidth: 280, marginBottom: 8 }}>
            BarcodeDetector API not available. Use manual entry or Chrome on Android.
          </p>
        )}
        <button className="btn" style={s.manualBtn} onClick={() => setManualMode(true)}>
          <KeyboardIcon /> Enter manually
        </button>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 },
  vignette: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none', zIndex: 1 },
  frame: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 280, height: 180, zIndex: 2 },
  corner: { position: 'absolute', width: 36, height: 36, borderRadius: 3, transition: 'border-color 0.2s' },
  scanLine: { position: 'absolute', top: 0, left: 14, right: 14, height: 2, background: 'var(--amber)', boxShadow: '0 0 16px var(--amber)', animation: 'scanPulse 2.5s ease-in-out infinite' },
  progressBarBg: { position: 'absolute', bottom: -12, left: 14, right: 14, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  progressBarFill: { height: '100%', background: '#22C55E', borderRadius: 2, transition: 'width 0.3s ease-out', boxShadow: '0 0 8px rgba(34,197,94,0.5)' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, zIndex: 3, background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: 700 },
  closeBtn: { width: 42, height: 42, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  guideArea: { position: 'absolute', top: '50%', left: 16, right: 16, transform: 'translateY(calc(-50% + 130px))', zIndex: 3, display: 'flex', justifyContent: 'center' },
  guideBox: { maxWidth: 320, padding: '12px 16px', borderRadius: 12, border: '1px solid', transition: 'all 0.3s' },
  guideText: { color: '#fff', fontSize: 13, lineHeight: 1.5, textAlign: 'center', margin: 0 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' },
  manualBtn: { padding: '12px 28px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius)', color: '#fff', fontSize: 15, fontWeight: 600, gap: 8 },
  manualCard: { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 24, margin: '0 16px', maxWidth: 400, width: '100%', zIndex: 10 },
  manualTitle: { fontSize: 22, fontWeight: 700, margin: 0 },
  manualSub: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 },
  confirmContainer: { padding: '24px 20px', maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 10 },
  confirmImageWrap: { width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', border: '2px solid var(--border)' },
  confirmImage: { width: '100%', height: 220, objectFit: 'cover', display: 'block' },
  confirmImageBadge: { position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: 'var(--amber)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 },
  confirmBarcodeCard: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', textAlign: 'center' },
  confirmLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 },
  confirmCode: { fontSize: 26, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--amber)', wordBreak: 'break-all' },
  confirmHint: { color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', margin: 0 },
};
