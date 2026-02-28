import { BoxIcon, ListIcon, ScanIcon } from './Icons';

export default function Header({ sessionCount, onOpenList, onOpenScanner }) {
  return (
    <header style={s.header}>
      <div style={s.left}>
        <BoxIcon size={22} />
        <span style={s.title}>Parts Vault</span>
      </div>
      <div style={s.right}>
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
};
