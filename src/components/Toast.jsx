import { useEffect } from 'react';
import { CheckIcon, XIcon } from './Icons';

export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const bg =
    type === 'success' ? 'var(--green)' :
    type === 'error' ? 'var(--red)' : 'var(--blue)';

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: 'calc(24px + var(--safe-bottom))',
        left: 16,
        right: 16,
        maxWidth: 488,
        margin: '0 auto',
        padding: '14px 18px',
        borderRadius: 'var(--radius)',
        background: bg,
        color: '#fff',
        fontSize: 15,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {type === 'success' && <CheckIcon size={18} />}
      {type === 'error' && <XIcon size={18} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          padding: '4px 6px',
          cursor: 'pointer',
          display: 'flex',
        }}
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
