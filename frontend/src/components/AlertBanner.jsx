import React, { useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert, Shield, CheckCircle2, XCircle, Zap } from 'lucide-react';

const SEV = {
  NORMAL:   { icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.18)' },
  WATCH:    { icon: Shield,       color: '#eab308', bg: 'rgba(234,179,8,0.07)',  border: 'rgba(234,179,8,0.2)' },
  WARNING:  { icon: AlertTriangle,color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
  CRITICAL: { icon: ShieldAlert,  color: '#ef4444', bg: 'rgba(239,68,68,0.09)',  border: 'rgba(239,68,68,0.3)' },
  EVACUATE: { icon: XCircle,      color: '#fca5a5', bg: 'rgba(127,29,29,0.35)',  border: 'rgba(239,68,68,0.55)' },
};

function AlertCard({ alert }) {
  const s = SEV[alert.severity] || SEV.NORMAL;
  const Icon = s.icon;
  const isEvac = alert.severity === 'EVACUATE';

  return (
    <div
      className="animate-slide-in"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        animation: isEvac ? 'glow-pulse 1.5s ease-in-out infinite' : undefined,
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <Icon size={18} color={s.color} strokeWidth={2.5}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: s.color, letterSpacing: '0.06em' }}>
            {alert.severity}
          </span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#f0f0ff' }}>
            {alert.zone_name}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            color: s.color, background: `${s.color}18`,
            padding: '2px 7px', borderRadius: 5,
          }}>
            LoS {alert.fruin_level}
          </span>
          {alert.time_to_critical && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, color: '#ef4444', fontWeight: 700,
            }}>
              <Zap size={11} strokeWidth={2.5}/>
              {alert.time_to_critical} to LoS F
            </span>
          )}
        </div>

        {/* Action text */}
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65 }}>
          {alert.recommended_action}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 7, fontSize: 11, color: '#64748b' }}>
          <span>Density: <strong style={{ color: '#94a3b8' }}>{(alert.density || 0).toFixed(2)} p/m²</strong></span>
          <span>Forecast: <strong style={{ color: '#a5b4fc' }}>{(alert.forecast_density || 0).toFixed(2)} p/m²</strong></span>
          <span>Score: <strong style={{ color: s.color }}>{alert.risk_score}/100</strong></span>
        </div>
      </div>
    </div>
  );
}

/**
 * AlertBanner — displays control-room alerts sorted by risk score.
 * Shows all-clear message when no zones exceed WATCH level.
 */
export default function AlertBanner({ alerts = [] }) {
  const sorted = [...alerts]
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .filter(a => (a.risk_score || 0) >= 40);

  if (sorted.length === 0) {
    return (
      <div style={{
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#22c55e', fontSize: 13,
      }}>
        <CheckCircle2 size={17} strokeWidth={2.5}/>
        <span style={{ fontWeight: 700 }}>All zones normal</span>
        <span style={{ color: '#64748b', marginLeft: 2 }}>
          — monitoring {alerts.length} zone{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map(a => <AlertCard key={a.zone_id} alert={a} />)}
    </div>
  );
}
