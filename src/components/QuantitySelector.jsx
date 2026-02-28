import { MinusIcon, PlusIcon } from './Icons';

const PRESETS = [1, 2, 5, 10, 25, 50, 100];

export default function QuantitySelector({ value, onChange }) {
  return (
    <div>
      <div style={s.row}>
        <button className="btn" style={s.btn} onClick={() => onChange(Math.max(1, value - 1))}>
          <MinusIcon />
        </button>
        <input
          style={s.input}
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        />
        <button className="btn" style={s.btn} onClick={() => onChange(value + 1)}>
          <PlusIcon />
        </button>
      </div>
      <div style={s.presets}>
        {PRESETS.map((p) => (
          <button
            key={p}
            className="btn"
            style={{
              ...s.presetBtn,
              ...(value === p ? s.presetActive : {}),
            }}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  btn: {
    width: 52,
    height: 52,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 'var(--radius)',
    fontSize: 20,
    flexShrink: 0,
  },
  input: {
    width: 90,
    height: 52,
    textAlign: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: 'none',
    borderRight: 'none',
    color: 'var(--text)',
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    outline: 'none',
  },
  presets: {
    display: 'flex',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  presetBtn: {
    padding: '6px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--mono)',
  },
  presetActive: {
    background: 'var(--amber-dim)',
    borderColor: 'var(--amber)',
    color: 'var(--amber)',
  },
};
