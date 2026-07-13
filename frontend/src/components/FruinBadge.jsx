const FRUIN_CONFIG = {
  A: { label: 'Free Flow',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
  B: { label: 'Reasonably Free', color: '#84cc16', bg: 'rgba(132,204,22,0.12)', border: 'rgba(132,204,22,0.3)' },
  C: { label: 'Stable Flow',     color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)' },
  D: { label: 'Constrained',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  E: { label: 'Critical',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)' },
  F: { label: 'Crush Imminent',  color: '#fca5a5', bg: 'rgba(127,29,29,0.4)',   border: 'rgba(239,68,68,0.6)' },
};

const SIZE_STYLES = {
  sm: { padding: '2px 8px',  fontSize: '11px', fontWeight: 700 },
  md: { padding: '4px 12px', fontSize: '13px', fontWeight: 700 },
  lg: { padding: '6px 16px', fontSize: '16px', fontWeight: 800 },
};

/**
 * FruinBadge — displays a Fruin Level-of-Service badge (A–F).
 * Level F pulses with a red glow animation (crush-imminent signal).
 */
export default function FruinBadge({ level = 'A', showLabel = true, size = 'md' }) {
  const cfg = FRUIN_CONFIG[level] || FRUIN_CONFIG.A;
  const sz = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isF = level === 'F';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 8,
        color: cfg.color,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        animation: isF ? 'glow-pulse 1.5s ease-in-out infinite' : 'none',
        ...sz,
      }}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>LoS {level}</span>
      {showLabel && (
        <span style={{ fontWeight: 500, opacity: 0.85 }}>· {cfg.label}</span>
      )}
    </span>
  );
}
