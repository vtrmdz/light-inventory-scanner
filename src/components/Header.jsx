import { BoxIcon, ListIcon, ScanIcon } from './Icons';
import { T } from '../lib/i18n';

export default function Header({ sessionCount, onOpenList, onOpenScanner, lang, setLang }) {
  return (
    <header style={s.header}>
      <div style={s.left}>
        <BoxIcon size={22} />
        <span style={s.title}>{T[lang].appName}</span>
      </div>
      <div style={s.right}>
        <button style={s.langBtn} onClick={() => setLang(lang === 'en' ? 'es' : 'en')}>
          {T[lang].langToggle}
        </button>
        <div className="badge badge-amber">{sessionCount}</div>
        <button className="btn-icon" onClick={onOpenList} aria-label="View list">
          <ListIcon size={22} />
        </button>
        <button className="btn-icon" onClick={onOpenScanner} aria-label="Scan">
          <ScanIcon size={22} />
        </button>
      </div>
    </header>
  );
}

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--amber)',
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  langBtn: {
    padding: '4px 10px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font)',
  },
};
