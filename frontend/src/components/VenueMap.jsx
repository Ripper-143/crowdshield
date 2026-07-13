import { useState } from 'react';

const FC = {
  A: '#22c55e', B: '#84cc16', C: '#eab308',
  D: '#f97316', E: '#ef4444', F: '#dc2626',
};
const FB = {
  A: 'rgba(34,197,94,0.15)',  B: 'rgba(132,204,22,0.15)', C: 'rgba(234,179,8,0.15)',
  D: 'rgba(249,115,22,0.15)', E: 'rgba(239,68,68,0.15)',  F: 'rgba(220,38,38,0.30)',
};

// Venue zones — mirrors backend/simulator/venue.py
const ZONES = [
  { id: 'gate_a',  label: 'Gate A',  sub: 'Main Entry',        type: 'entry',       x: 0,  y: 0,  w: 10, h: 8  },
  { id: 'gate_b',  label: 'Gate B',  sub: 'Side Entry',         type: 'entry',       x: 60, y: 0,  w: 10, h: 8  },
  { id: 'plaza_1', label: 'Plaza 1', sub: 'Main Congregation',  type: 'congregation',x: 0,  y: 8,  w: 40, h: 20 },
  { id: 'plaza_2', label: 'Plaza 2', sub: 'Ghat Area',          type: 'congregation',x: 42, y: 8,  w: 28, h: 20 },
  { id: 'bridge',  label: 'Bridge',  sub: 'Bottleneck',         type: 'bottleneck',  x: 40, y: 14, w: 2,  h: 6  },
  { id: 'exit',    label: 'Exit',    sub: 'Gate',               type: 'exit',        x: 25, y: 30, w: 20, h: 8  },
];

function ZoneTooltip({ zone, risk, pos }) {
  if (!zone) return null;
  const level = risk?.fruin_level || 'A';
  const color = FC[level];
  return (
    <div style={{
      position: 'absolute', left: pos.x + 18, top: Math.min(pos.y + 12, pos.y),
      background: 'rgba(8,8,14,0.97)',
      border: `1px solid ${color}50`,
      borderRadius: 12, padding: '14px 18px', minWidth: 230, zIndex: 200,
      pointerEvents: 'none',
      boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px ${color}20`,
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#f0f0ff' }}>
        {zone.label} <span style={{ color: '#64748b', fontWeight: 400 }}>— {zone.sub}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, columnGap: 12, fontSize: 12 }}>
        {[
          ['Fruin Level', `LoS ${level}`, color],
          ['Density', `${(risk?.density || 0).toFixed(2)} p/m²`, '#f0f0ff'],
          ['Forecast', `${(risk?.forecast_density || 0).toFixed(2)} p/m²`, '#a5b4fc'],
          ['Severity', risk?.severity || 'NORMAL', color],
          ...(risk?.time_to_critical ? [['To LoS F', risk.time_to_critical, '#ef4444']] : []),
        ].map(([k, v, c]) => (
          <>
            <span key={`k-${k}`} style={{ color: '#64748b' }}>{k}</span>
            <span key={`v-${k}`} style={{ color: c, fontWeight: 600 }}>{v}</span>
          </>
        ))}
      </div>
      {risk?.recommended_action && (risk?.risk_score || 0) >= 40 && (
        <div style={{
          marginTop: 10, padding: '8px 10px', borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, color: '#94a3b8', lineHeight: 1.55,
        }}>
          {risk.recommended_action.slice(0, 140)}{risk.recommended_action.length > 140 ? '…' : ''}
        </div>
      )}
    </div>
  );
}

/**
 * VenueMap — SVG floor-plan of the Kumbh Mela ghat section.
 * Zones are color-coded by Fruin LoS level, with pulsing animation
 * for critical zones and a density bar at the bottom of each zone.
 */
export default function VenueMap({ zoneRisks = {}, onZoneClick, selectedZone }) {
  const [hovered, setHovered] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <div
      style={{ position: 'relative' }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      <svg
        viewBox="0 0 70 44"
        style={{
          width: '100%', height: 'auto',
          borderRadius: 12,
          background: 'linear-gradient(160deg, #0d0d1a 0%, #08080f 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'block',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.08"/>
          </pattern>
          <filter id="ge"><feGaussianBlur stdDeviation="0.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="gf"><feGaussianBlur stdDeviation="1.0" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <marker id="arrow" markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto">
            <polygon points="0 0, 3 1.5, 0 3" fill="rgba(99,102,241,0.45)"/>
          </marker>
        </defs>

        {/* Background grid */}
        <rect width="70" height="44" fill="url(#grid)"/>

        {/* River bank */}
        <rect x="0" y="39.5" width="70" height="4.5" fill="rgba(56,189,248,0.08)" rx="0"/>
        <text x="35" y="42.5" textAnchor="middle" fill="rgba(56,189,248,0.35)" fontSize="1.1" fontFamily="Inter, sans-serif" fontStyle="italic">
          Ghat / River Bank
        </text>

        {/* Flow direction arrows */}
        <line x1="5" y1="8.5" x2="5" y2="22" stroke="rgba(99,102,241,0.25)" strokeWidth="0.25" strokeDasharray="1,0.8" markerEnd="url(#arrow)"/>
        <line x1="65" y1="8.5" x2="65" y2="20" stroke="rgba(99,102,241,0.25)" strokeWidth="0.25" strokeDasharray="1,0.8" markerEnd="url(#arrow)"/>
        <line x1="18" y1="28" x2="30" y2="31" stroke="rgba(99,102,241,0.25)" strokeWidth="0.25" strokeDasharray="1,0.8" markerEnd="url(#arrow)"/>

        {/* Venue boundary */}
        <rect x="0.1" y="0.1" width="69.8" height="39.3" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.15" rx="0.5"/>

        {/* Zones */}
        {ZONES.map((zone) => {
          const risk = zoneRisks[zone.id];
          const level = risk?.fruin_level || 'A';
          const color = FC[level];
          const bg = FB[level];
          const isE = level === 'E', isF = level === 'F';
          const isSelected = selectedZone === zone.id;
          const densityFrac = Math.min((risk?.density || 0) / 6.5, 1.0);

          return (
            <g
              key={zone.id}
              onClick={() => onZoneClick?.(zone.id)}
              onMouseEnter={() => setHovered(zone)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Critical pulse ring */}
              {isF && (
                <rect
                  x={zone.x - 0.6} y={zone.y - 0.6}
                  width={zone.w + 1.2} height={zone.h + 1.2}
                  fill="none" stroke={color} strokeWidth="0.25" rx="0.6"
                  opacity="0.7"
                  style={{
                    animation: 'pulse-ring 1.8s ease-out infinite',
                    transformOrigin: `${zone.x + zone.w / 2}px ${zone.y + zone.h / 2}px`,
                    transformBox: 'fill-box',
                  }}
                />
              )}

              {/* Zone fill */}
              <rect
                x={zone.x + 0.1} y={zone.y + 0.1}
                width={zone.w - 0.2} height={zone.h - 0.2}
                fill={bg}
                stroke={isSelected ? '#a5b4fc' : color}
                strokeWidth={isSelected ? 0.3 : hovered?.id === zone.id ? 0.25 : 0.12}
                rx="0.5"
                filter={isF ? 'url(#gf)' : isE ? 'url(#ge)' : 'none'}
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Density fill bar (shows how full the zone is) */}
              {zone.type !== 'bottleneck' && zone.h > 5 && (
                <rect
                  x={zone.x + 0.3}
                  y={zone.y + zone.h - 1.4}
                  width={(zone.w - 0.6) * densityFrac}
                  height={0.9}
                  fill={color}
                  opacity={0.75}
                  rx="0.25"
                  style={{ transition: 'width 0.6s ease' }}
                />
              )}

              {/* Zone label */}
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2 - (zone.h > 12 ? 1.8 : 0.3)}
                textAnchor="middle"
                fill="rgba(240,240,255,0.92)"
                fontSize={zone.type === 'bottleneck' ? 0.75 : zone.h > 12 ? 1.7 : 1.2}
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                style={{ userSelect: 'none' }}
              >
                {zone.label}
              </text>

              {/* Zone sublabel */}
              {zone.h > 10 && zone.type !== 'bottleneck' && (
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2 + 0.8}
                  textAnchor="middle"
                  fill="rgba(240,240,255,0.45)"
                  fontSize="1.05"
                  fontFamily="Inter, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {zone.sub}
                </text>
              )}

              {/* LoS badge (top-right of zone) */}
              {zone.type !== 'bottleneck' && (
                <>
                  <rect
                    x={zone.x + zone.w - 4.8} y={zone.y + 0.4}
                    width={4.4} height={2.3}
                    fill="rgba(0,0,0,0.65)" stroke={color} strokeWidth="0.08" rx="0.4"
                  />
                  <text
                    x={zone.x + zone.w - 2.6} y={zone.y + 1.95}
                    textAnchor="middle"
                    fill={color} fontSize="1.4" fontFamily="monospace" fontWeight="900"
                    style={{ userSelect: 'none' }}
                  >
                    {level}
                  </text>
                </>
              )}

              {/* Density reading (top-left) */}
              {zone.h > 10 && (
                <text
                  x={zone.x + 0.6} y={zone.y + 1.9}
                  fill="rgba(240,240,255,0.4)" fontSize="0.95" fontFamily="monospace"
                  style={{ userSelect: 'none' }}
                >
                  {(risk?.density || 0).toFixed(2)}/m²
                </text>
              )}
            </g>
          );
        })}

        {/* Fruin legend */}
        {['A', 'B', 'C', 'D', 'E', 'F'].map((l, i) => (
          <g key={l}>
            <rect x={1 + i * 11.5} y={40} width={2} height={1.5} fill={FC[l]} rx="0.3" opacity="0.9"/>
            <text x={3.6 + i * 11.5} y={41.2} fill="rgba(240,240,255,0.45)" fontSize="0.9" fontFamily="Inter, sans-serif">
              LoS {l}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <ZoneTooltip
          zone={hovered}
          risk={zoneRisks[hovered.id]}
          pos={mouse}
        />
      )}
    </div>
  );
}
