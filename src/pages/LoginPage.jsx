import { useState } from 'react';
import { LockIcon, BoxIcon } from '../components/Icons';

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

export default function LoginPage({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (password === APP_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={s.container}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>

      <div style={s.card} className="animate-slide-up">
        <div style={s.iconWrap}>
          <BoxIcon size={32} />
        </div>

        <h1 style={s.title}>Parts Vault</h1>
        <p style={s.subtitle}>Enter password to continue</p>

        <div
          style={{
            ...s.inputWrap,
            animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
            borderColor: error ? 'var(--red)' : 'var(--border)',
          }}
        >
          <LockIcon size={18} />
          <input
            autoFocus
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={s.input}
          />
        </div>

        {error && (
          <p style={s.error}>Wrong password. Try again.</p>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 20 }}
          onClick={handleSubmit}
          disabled={!password}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'var(--bg)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'var(--amber-dim)',
    color: 'var(--amber)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    margin: 0,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    transition: 'border-color 0.15s',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    fontSize: 17,
    outline: 'none',
    letterSpacing: '0.1em',
  },
  error: {
    color: 'var(--red)',
    fontSize: 13,
    marginTop: 10,
    fontWeight: 600,
  },
};
