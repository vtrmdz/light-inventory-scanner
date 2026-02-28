import { useRef } from 'react';
import { CameraIcon, UploadIcon, XIcon } from './Icons';

/**
 * PhotoCapture with two distinct buttons:
 *  - "Take" → opens phone camera directly (capture="environment")
 *  - "Upload" → opens gallery/file picker (no capture attr)
 */
export default function PhotoCapture({ photos, onAdd, onRemove }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const processFiles = (fileList) => {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onAdd({
          id: Date.now() + Math.random(),
          dataUrl: e.target.result,
          file,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {/* Existing photo thumbnails */}
      {photos.map((photo) => (
        <div key={photo.id || photo} style={s.thumb}>
          <img
            src={typeof photo === 'string' ? photo : photo.dataUrl}
            alt="Part photo"
            style={s.thumbImg}
          />
          {photo.isScanCapture && (
            <div style={s.scanBadge}>SCAN</div>
          )}
          <button style={s.removeBtn} onClick={() => onRemove(photo.id || photo)}>
            <XIcon size={12} />
          </button>
        </div>
      ))}

      {/* Take photo — opens camera */}
      <button style={s.addBtn} onClick={() => cameraRef.current?.click()}>
        <CameraIcon size={20} />
        <span style={s.addBtnLabel}>Camera</span>
      </button>

      {/* Upload from gallery */}
      <button style={s.addBtn} onClick={() => galleryRef.current?.click()}>
        <UploadIcon size={20} />
        <span style={s.addBtnLabel}>Gallery</span>
      </button>

      {/* Hidden camera input — capture="environment" forces camera on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) processFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Hidden gallery input — NO capture attr, opens file picker / gallery */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) processFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

const s = {
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid var(--border)',
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  scanBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    background: 'rgba(0,0,0,0.7)',
    color: 'var(--amber)',
    padding: '1px 5px',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    borderRadius: '50%',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  addBtn: {
    width: 72,
    height: 72,
    borderRadius: 'var(--radius-sm)',
    border: '2px dashed var(--border)',
    background: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    fontFamily: 'var(--font)',
    flexShrink: 0,
  },
  addBtnLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: 600,
  },
};
