import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import FruinBadge from './FruinBadge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const FRUIN_COLORS = {
  A: '#22c55e', B: '#84cc16', C: '#eab308',
  D: '#f97316', E: '#ef4444', F: '#dc2626',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,10,15,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12
    }}>
      <p style={{ color: '#64748b', marginBottom: 4 }}>t={label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value} p/m²
        </p>
      ))}
    </div>
  );
}

export default function ZonePanel({ zoneId, risk, onClose, localHistory = null }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zoneId) return;
    if (localHistory) {
      setHistory(localHistory);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/zone/${zoneId}/history?limit=60`)
      .then(r => r.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [zoneId, localHistory]);

  if (!zoneId) return null;

  const level = risk?.fruin_level || 'A';
  const color = FRUIN_COLORS[level] || '#22c55e';

  // Build chart data: historical + forecast
  const chartData = [];
  if (history?.readings) {
    history.readings.slice(-30).forEach((r, i) => {
      chartData.push({
        t: new Date(r.ts).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        density: r.density,
        type: 'historical'
      });
    });
  }
  
  if (history?.forecast) {
    // Add the last historical reading as a bridge to forecast chart line
    const lastHist = chartData[chartData.length - 1];
    if (lastHist) {
      chartData.push({
        t: 0,
        density: lastHist.density,
        forecast: lastHist.density,
        lower: lastHist.density,
        upper: lastHist.density,
        type: 'bridge'
      });
    }

    history.forecast.forEach((f, i) => {
      chartData.push({
        t: `+${i + 1}s`,
        forecast: f.forecast_density,
        lower: f.lower_bound,
        upper: f.upper_bound,
        type: 'forecast'
      });
    });
  }

  const thresholdF = 5.4;
  const thresholdE = 3.86;

  return (
    <div
      className="glass animate-fade-in"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>
            {history?.zone_name || zoneId}
          </h3>
          <FruinBadge level={level} size="md"/>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: 12
          }}
        >
          ✕
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Current', value: `${(risk?.density||0).toFixed(2)} p/m²`, color: color },
          { label: 'Forecast (5min)', value: `${(risk?.forecast_density||0).toFixed(2)} p/m²`, color: '#6366f1' },
          { label: 'Risk Score', value: `${risk?.risk_score||0}/100`, color: color },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '10px 12px'
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Time to critical */}
      {risk?.time_to_critical && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 18 }}>⏱</span>
          <div>
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>Time to LoS F: </span>
            <span style={{ color: '#fca5a5', fontWeight: 800, fontSize: 16 }}>{risk.time_to_critical}</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>Crush-imminent</div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 200 }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Loading history...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`grad-${zoneId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id={`grad-fc-${zoneId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/>
              <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} width={35}/>
              <Tooltip content={<CustomTooltip/>}/>
              <ReferenceLine y={thresholdF} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1}
                label={{ value: 'F', fill: '#ef4444', fontSize: 10, position: 'insideRight' }}/>
              <ReferenceLine y={thresholdE} stroke="#f97316" strokeDasharray="3 3" strokeWidth={1}
                label={{ value: 'E', fill: '#f97316', fontSize: 10, position: 'insideRight' }}/>
              <Area type="monotone" dataKey="density" stroke={color} strokeWidth={2}
                fill={`url(#grad-${zoneId})`} name="Actual" dot={false} connectNulls/>
              <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={1.5}
                strokeDasharray="4 4" fill={`url(#grad-fc-${zoneId})`} name="Forecast" dot={false} connectNulls/>
              <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(99,102,241,0.08)" name="CI" dot={false} connectNulls/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Action */}
      {risk?.recommended_action && risk.risk_score >= 40 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.7
        }}>
          <span style={{ color: '#6366f1', fontWeight: 600, marginRight: 6 }}>Recommended Action:</span>
          {risk.recommended_action}
        </div>
      )}
    </div>
  );
}
