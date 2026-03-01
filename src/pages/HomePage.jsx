import { ScanIcon, ListIcon, BoxIcon } from '../components/Icons';
import { T } from '../lib/i18n';

export default function HomePage({ sessionCount, onScan, onOpenList, lang }) {
  const t = T[lang];
  return (
    <div style={s.container} className="animate-fade-in">
      {/* Big scan CTA */}
      <button style={s.scanBtn} onClick={onScan}>
        <div style={s.scanIconWrap}>
          <ScanIcon size={36} />
        </div>
        <span style={s.scanText}>{t.scanBarcode}</span>
        <span style={s.scanSub}>{t.scanSub}</span>
      </button>

      {/* Quick stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statValue}>{sessionCount}</div>
          <div style={s.statLabel}>{t.thisSession}</div>
        </div>
        <button style={s.actionCard} onClick={onOpenList}>
          <ListIcon size={22} />
          <span style={s.actionLabel}>{t.browseAll}</span>
        </button>
      </div>

      {/* Tips */}
      <div style={s.tipsCard}>
        <h3 style={s.tipsTitle}>{t.quickTips}</h3>
        <div style={s.tip}>
          <span>{t.tip1a}<strong>{t.tip1b}</strong>{t.tip1c}</span>
        </div>
        <div style={s.tip}>
          <span>{t.tip2}</span>
        </div>
        <div style={s.tip}>
          <span>{t.tip3}</span>
        </div>
        <div style={s.tip}>
          <span>{t.tip4}</span>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: {
    padding: '20px 16px 100px',
  },
  scanBtn: {
    width: '100%',
    padding: '44px 24px 36px',
    background: 'linear-gradient(145deg, rgba(245,166,35,0.12), rgba(245,166,35,0.04))',
    border: '2px dashed rgba(245,166,35,0.4)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font)',
    transition: 'transform 0.1s, border-color 0.2s',
  },
  scanIconWrap: {
    color: 'var(--amber)',
    marginBottom: 8,
  },
  scanText: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  scanSub: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    fontFamily: 'var(--mono)',
    color: 'var(--amber)',
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  actionCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font)',
    transition: 'background 0.1s',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  tipsCard: {
    marginTop: 24,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 14,
    letterSpacing: '0.02em',
  },
  tip: {
    display: 'flex',
    gap: 10,
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 16,
    flexShrink: 0,
  },
};
