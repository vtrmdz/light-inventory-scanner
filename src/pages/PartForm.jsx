import { useState, useEffect } from 'react';
import { ChevronLeftIcon, TrashIcon, LoaderIcon } from '../components/Icons';
import PhotoCapture from '../components/PhotoCapture';
import QuantitySelector from '../components/QuantitySelector';
import { getPartByBarcode, createPart, updatePart, addToPart, uploadPhotos, deletePart } from '../lib/api';

export default function PartForm({ barcode, existingPart, scanPhoto, lastLocation, onSaved, onBack, onDeleted, showToast }) {
  const [loading, setLoading] = useState(!existingPart && !!barcode);
  const [part, setPart] = useState(existingPart || null);
  const [mode, setMode] = useState(existingPart ? 'edit' : 'lookup');

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(lastLocation || '');
  const [newPhotos, setNewPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inject scan capture photo as first new photo
  useEffect(() => {
    if (scanPhoto?.dataUrl && scanPhoto?.file) {
      setNewPhotos([{
        id: 'scan-capture-' + Date.now(),
        dataUrl: scanPhoto.dataUrl,
        file: scanPhoto.file,
        isScanCapture: true,
      }]);
    }
  }, [scanPhoto]);

  // Look up barcode on mount
  useEffect(() => {
    if (existingPart) {
      populateFromPart(existingPart);
      setMode('edit');
      return;
    }
    if (!barcode) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const found = await getPartByBarcode(barcode);
        if (cancelled) return;
        if (found) {
          setPart(found);
          populateFromPart(found);
          setMode('addMore');
        } else {
          setMode('new');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to look up barcode', 'error');
        setMode('new');
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [barcode, existingPart]);

  const populateFromPart = (p) => {
    setQuantity(p.quantity || 1);
    setNotes(p.notes || '');
    setLocation(p.location || '');
    setExistingPhotos(p.photos || []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let uploadedUrls = [];
      const filesToUpload = newPhotos.filter((p) => p.file).map((p) => p.file);
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadPhotos(barcode || part?.barcode, filesToUpload);
      }

      let result;

      if (mode === 'new') {
        result = await createPart({
          barcode,
          quantity,
          notes,
          location,
          photos: uploadedUrls,
        });
        showToast(`Created: ${barcode} × ${quantity}`);
      } else if (mode === 'addMore') {
        result = await addToPart(part, {
          quantity,
          photos: uploadedUrls,
          notes: notes !== (part.notes || '') ? notes : undefined,
          location: location !== (part.location || '') ? location : undefined,
        });
        showToast(`Added ${quantity} more to ${part.barcode} (total: ${result.quantity})`);
      } else if (mode === 'edit') {
        result = await updatePart(part.id, {
          quantity,
          notes,
          location,
          photos: [...existingPhotos, ...uploadedUrls],
        });
        showToast(`Updated: ${part.barcode}`);
      }

      onSaved(result);
    } catch (err) {
      console.error(err);
      showToast('Save failed: ' + (err.message || 'Unknown error'), 'error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deletePart(part.id);
      showToast(`Deleted: ${part.barcode}`);
      onDeleted?.(part.id);
    } catch (err) {
      showToast('Delete failed', 'error');
    }
    setDeleting(false);
  };

  const handleRemoveExistingPhoto = (url) => {
    setExistingPhotos((prev) => prev.filter((p) => p !== url));
  };

  const handleRemoveNewPhoto = (id) => {
    setNewPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div style={s.centered}>
        <LoaderIcon size={28} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Looking up barcode...</p>
      </div>
    );
  }

  const isExisting = mode === 'edit' || mode === 'addMore';
  const displayBarcode = barcode || part?.barcode || '—';

  return (
    <div className="animate-slide-up" style={{ padding: 16 }}>
      <button className="btn btn-ghost" style={{ marginBottom: 12, marginLeft: -10 }} onClick={onBack}>
        <ChevronLeftIcon /> Back
      </button>

      {/* Barcode card */}
      <div className="card" style={{ marginBottom: 20, position: 'relative' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
          BARCODE
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--amber)', wordBreak: 'break-all' }}>
          {displayBarcode}
        </div>
        {isExisting && (
          <div className="badge badge-green" style={{ position: 'absolute', top: 14, right: 14 }}>
            EXISTS
          </div>
        )}
        {mode === 'new' && (
          <div className="badge badge-amber" style={{ position: 'absolute', top: 14, right: 14 }}>
            NEW
          </div>
        )}
      </div>

      {/* Mode switcher for existing parts */}
      {isExisting && (
        <div style={s.modeSwitch}>
          <button
            className="btn"
            style={{ ...s.modeBtn, ...(mode === 'addMore' ? s.modeBtnActive : {}) }}
            onClick={() => { setMode('addMore'); setQuantity(1); }}
          >
            Add More
          </button>
          <button
            className="btn"
            style={{ ...s.modeBtn, ...(mode === 'edit' ? s.modeBtnActive : {}) }}
            onClick={() => { setMode('edit'); setQuantity(part.quantity); }}
          >
            Edit Entry
          </button>
        </div>
      )}

      {/* Existing info summary when adding more */}
      {mode === 'addMore' && part && (
        <div style={s.existingSummary}>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Current qty:</span>
            <span style={s.summaryValue}>{part.quantity}</span>
          </div>
          {part.location && (
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Location:</span>
              <span style={s.summaryValue}>{part.location}</span>
            </div>
          )}
          {(part.photos?.length || 0) > 0 && (
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Photos:</span>
              <span style={s.summaryValue}>{part.photos.length} existing</span>
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
      <div style={{ marginBottom: 20 }}>
        <label className="label">
          {mode === 'addMore' ? 'Quantity to add' : 'Total Quantity'}
        </label>
        <QuantitySelector value={quantity} onChange={setQuantity} />
      </div>

      {/* Existing photos (edit mode only) */}
      {mode === 'edit' && existingPhotos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label className="label">
            Existing Photos <span className="label-hint">({existingPhotos.length})</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {existingPhotos.map((url, i) => (
              <div key={i} style={s.existingThumb}>
                <img src={url} alt="" style={s.existingThumbImg} />
                <button style={s.thumbRemove} onClick={() => handleRemoveExistingPhoto(url)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New photos (includes scan capture as first) */}
      <div style={{ marginBottom: 20 }}>
        <label className="label">
          {mode === 'addMore' ? 'Add Photos' : 'Photos'}{' '}
          <span className="label-hint">({newPhotos.length} new)</span>
        </label>
        <PhotoCapture
          photos={newPhotos}
          onAdd={(photo) => setNewPhotos((prev) => [...prev, photo])}
          onRemove={handleRemoveNewPhoto}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="label">
          Location / Shelf <span className="label-hint">(optional)</span>
        </label>
        <input
          className="input"
          placeholder="e.g. Shelf A3, Bin 12, Pallet 7"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="label">
          Notes <span className="label-hint">(optional)</span>
        </label>
        <input
          className="input"
          placeholder="e.g. damaged box, opened, mixed lot"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <LoaderIcon size={18} /> : null}
          {saving
            ? 'Saving...'
            : mode === 'addMore'
              ? `Add ${quantity} More`
              : mode === 'new'
                ? 'Create Entry'
                : 'Save Changes'
          }
        </button>
      </div>

      {mode === 'edit' && part && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={handleDelete}
            disabled={deleting}
          >
            <TrashIcon />
            {confirmDelete ? 'Tap again to confirm delete' : 'Delete this part'}
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: 'var(--text-secondary)' },
  modeSwitch: { display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 20, border: '1px solid var(--border)' },
  modeBtn: { flex: 1, padding: '10px 12px', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 },
  modeBtnActive: { background: 'var(--amber-dim)', color: 'var(--amber)' },
  existingSummary: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 20 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
  summaryLabel: { fontSize: 13, color: 'var(--text-muted)' },
  summaryValue: { fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text)' },
  existingThumb: { width: 64, height: 64, borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)', flexShrink: 0 },
  existingThumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbRemove: { position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
