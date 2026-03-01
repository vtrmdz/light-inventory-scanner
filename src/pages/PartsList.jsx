import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchIcon, ScanIcon, BoxIcon, LoaderIcon, ChevronLeftIcon } from '../components/Icons';
import { getParts } from '../lib/api';
import { T } from '../lib/i18n';

export default function PartsList({ onSelectPart, onBack, onScan, refreshTrigger, lang }) {
  const [parts, setParts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const searchTimeout = useRef(null);
  const listRef = useRef(null);

  const t = T[lang];

  const fetchPage = useCallback(async (pageNum, searchQuery, append = false) => {
    setLoading(true);
    try {
      const result = await getParts({ page: pageNum, search: searchQuery });
      setParts((prev) => append ? [...prev, ...result.data] : result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (err) {
      console.error('Fetch parts error:', err);
    }
    setLoading(false);
    setInitialLoad(false);
  }, []);

  // Initial load + refresh trigger
  useEffect(() => {
    setPage(0);
    fetchPage(0, search, false);
  }, [refreshTrigger]);

  // Search with debounce
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0);
      fetchPage(0, search, false);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, search, true);
  };

  // Scroll-based load more
  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      loadMore();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={s.topBar}>
        <button className="btn btn-ghost" style={{ marginLeft: -10 }} onClick={onBack}>
          <ChevronLeftIcon /> {t.back}
        </button>
        <div className="badge badge-amber">{total} {t.parts}</div>
      </div>

      <div style={s.searchWrap}>
        <SearchIcon size={18} />
        <input
          style={s.searchInput}
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-icon" onClick={onScan} aria-label="Scan to search" style={{ color: 'var(--amber)' }}>
          <ScanIcon size={20} />
        </button>
      </div>

      <div ref={listRef} style={s.list} onScroll={handleScroll}>
        {initialLoad ? (
          <div style={s.centered}>
            <LoaderIcon size={24} />
          </div>
        ) : parts.length === 0 ? (
          <div style={s.centered}>
            <BoxIcon size={32} />
            <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>
              {search ? t.noMatch : t.noPartsYet}
            </p>
          </div>
        ) : (
          <>
            {parts.map((part) => (
              <button
                key={part.id}
                style={s.item}
                onClick={() => onSelectPart(part)}
              >
                <div style={s.itemLeft}>
                  {part.photos?.[0] ? (
                    <img src={part.photos[0]} alt="" style={s.thumb} />
                  ) : (
                    <div style={s.thumbPlaceholder}><BoxIcon size={18} /></div>
                  )}
                  <div style={s.itemInfo}>
                    <div style={s.itemBarcode}>{part.barcode}</div>
                    <div style={s.itemMeta}>
                      {t.qty}: {part.quantity}
                      {part.location ? ` · ${part.location}` : ''}
                      {(part.photos?.length || 0) > 0
                        ? ` · ${part.photos.length} ${part.photos.length > 1 ? t.photos_ : t.photo}`
                        : ''}
                    </div>
                    {part.notes && (
                      <div style={s.itemNotes}>{part.notes}</div>
                    )}
                  </div>
                </div>
                <div style={s.itemTime}>
                  {formatTime(part.updated_at, lang)}
                </div>
              </button>
            ))}

            {hasMore && (
              <button
                className="btn btn-secondary"
                style={{ width: '100%', margin: '12px 0' }}
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? <LoaderIcon size={16} /> : t.loadMore}
              </button>
            )}

            {!hasMore && parts.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
                {lang === 'es' ? `Todas las ${total} piezas cargadas` : `All ${total} parts loaded`}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(dateStr, lang) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return T[lang].justNow;
  if (diffMin < 60) return lang === 'es' ? `Hace ${diffMin}m` : `${diffMin}m ago`;
  if (diffHr < 24) return lang === 'es' ? `Hace ${diffHr}h` : `${diffHr}h ago`;

  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'short', day: 'numeric' });
}

const s = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '0 16px 12px',
    padding: '10px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    fontSize: 15,
    outline: 'none',
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: '0 16px 100px',
    WebkitOverflowScrolling: 'touch',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: 'var(--text-secondary)',
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textAlign: 'left',
    marginBottom: 8,
    fontFamily: 'var(--font)',
    color: 'var(--text)',
    transition: 'background 0.1s',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    flexShrink: 0,
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemBarcode: {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  itemNotes: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 2,
    fontStyle: 'italic',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTime: {
    fontSize: 11,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
