import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, Pause, RotateCcw, AlertTriangle, Camera } from 'lucide-react';

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const FRUIN_LEVELS = [
  { level: 'A', threshold: 0, color: '#22c55e' },
  { level: 'B', threshold: 0.54, color: '#84cc16' },
  { level: 'C', threshold: 0.93, color: '#eab308' },
  { level: 'D', threshold: 1.54, color: '#f97316' },
  { level: 'E', threshold: 3.86, color: '#ef4444' },
  { level: 'F', threshold: 5.4, color: '#dc2626' },
];

const CATEGORIES = ['Enclosed Gatherings', 'Urban Transit', 'Mega Festivals', 'Hilltop Shrines', 'Public Grounds'];

const STATIC_INCIDENTS = [
  // Enclosed Gatherings
  { id: 1, category: 'Enclosed Gatherings', cctvCat: 'enclosed', name: 'Hathras Satsang Stampede', date: '2024-07-02', location: 'Hathras, UP', deaths: 121, estimated_peak_density: 7.2, density_timeline: [0,1,2,3,4,5,6,7,8,9,10], density_values: [1.2, 1.8, 2.5, 3.1, 3.9, 4.8, 5.6, 6.4, 7.2, 7.2, 7.2], fruin_breach_minute: 6, early_warning_possible_minute: 4 },
  
  // Urban Transit
  { id: 2, category: 'Urban Transit', cctvCat: 'transit', name: 'Elphinstone Road Bridge', date: '2017-09-29', location: 'Mumbai', deaths: 23, estimated_peak_density: 6.8, density_timeline: [0,1,2,3,4,5,6,7,8], density_values: [2.1, 2.8, 3.4, 4.2, 5.1, 5.9, 6.8, 6.8, 6.8], fruin_breach_minute: 5, early_warning_possible_minute: 3 },
  
  // Mega Festivals
  { id: 3, category: 'Mega Festivals', cctvCat: 'festival', name: 'Kumbh Mela Stampede', date: '2013-02-10', location: 'Prayagraj, UP', deaths: 36, estimated_peak_density: 8.1, density_timeline: [0,2,4,6,8,10,12,14], density_values: [1.5, 2.3, 3.7, 5.2, 6.4, 7.5, 8.1, 8.1], fruin_breach_minute: 10, early_warning_possible_minute: 7 },
  { id: 4, category: 'Mega Festivals', cctvCat: 'festival', name: 'Godavari Pushkaram', date: '2015-07-14', location: 'Rajahmundry', deaths: 27, estimated_peak_density: 6.5, density_timeline: [0,1,2,3,4,5,6,7,8], density_values: [1.0, 1.9, 2.7, 3.8, 4.5, 5.7, 6.5, 6.5, 6.5], fruin_breach_minute: 5, early_warning_possible_minute: 4 },
  
  // Hilltop Shrines
  { id: 5, category: 'Hilltop Shrines', cctvCat: 'temple', name: 'Mata Vaishno Devi', date: '2022-01-01', location: 'Katra, J&K', deaths: 12, estimated_peak_density: 6.2, density_timeline: [0,1,2,3,4,5,6,7], density_values: [1.5, 2.2, 3.1, 4.0, 4.8, 5.5, 6.2, 6.2], fruin_breach_minute: 5, early_warning_possible_minute: 3 },
  { id: 6, category: 'Hilltop Shrines', cctvCat: 'temple', name: 'Sabarimala Stampede', date: '2011-01-14', location: 'Kerala', deaths: 106, estimated_peak_density: 7.8, density_timeline: [0,2,4,6,8,10,12], density_values: [2.0, 3.1, 4.2, 5.3, 6.5, 7.8, 7.8], fruin_breach_minute: 8, early_warning_possible_minute: 5 },
  { id: 7, category: 'Hilltop Shrines', cctvCat: 'temple', name: 'Naina Devi Temple', date: '2008-08-03', location: 'Himachal', deaths: 146, estimated_peak_density: 7.5, density_timeline: [0,1,2,3,4,5,6,7], density_values: [1.2, 2.4, 3.8, 4.9, 6.1, 7.5, 7.5, 7.5], fruin_breach_minute: 4, early_warning_possible_minute: 3 },
  { id: 8, category: 'Hilltop Shrines', cctvCat: 'temple', name: 'Chamunda Devi', date: '2008-09-30', location: 'Jodhpur', deaths: 224, estimated_peak_density: 8.5, density_timeline: [0,1,2,3,4,5,6], density_values: [2.5, 4.0, 5.5, 7.0, 8.5, 8.5, 8.5], fruin_breach_minute: 3, early_warning_possible_minute: 2 },
  { id: 9, category: 'Hilltop Shrines', cctvCat: 'temple', name: 'Mandhardevi Temple', date: '2005-01-25', location: 'Maharashtra', deaths: 291, estimated_peak_density: 8.0, density_timeline: [0,2,4,6,8,10], density_values: [1.5, 3.0, 4.8, 6.5, 8.0, 8.0], fruin_breach_minute: 7, early_warning_possible_minute: 4 },
  
  // Public Grounds
  { id: 10, category: 'Public Grounds', cctvCat: 'public', name: 'Patna Gandhi Maidan', date: '2014-10-03', location: 'Patna, Bihar', deaths: 33, estimated_peak_density: 6.9, density_timeline: [0,2,4,6,8,10], density_values: [1.0, 2.5, 3.8, 5.2, 6.9, 6.9], fruin_breach_minute: 7, early_warning_possible_minute: 5 },
];

export default function BacktestReplay() {
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[3]); // Default to Hilltop Shrines
  const [selected, setSelected] = useState(STATIC_INCIDENTS.find(i => i.category === CATEGORIES[3]));
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const max = selected.density_timeline[selected.density_timeline.length - 1];
    if (playhead >= max) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setPlayhead(p => {
        const nextIdx = selected.density_timeline.findIndex(t => t > p);
        if (nextIdx !== -1) {
          return selected.density_timeline[nextIdx];
        }
        return p;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [playing, playhead, selected]);

  const reset = () => { setPlayhead(0); setPlaying(false); };
  const handleSelect = (inc) => { setSelected(inc); reset(); };

  // Build chart data up to playhead
  const chartData = selected.density_timeline.map((t, i) => ({
    t,
    density: t <= playhead ? selected.density_values[i] : null
  }));

  const earlyWarningMinute = selected.early_warning_possible_minute;
  const crushMinute = selected.fruin_breach_minute;
  const timeSaved = crushMinute - earlyWarningMinute;
  
  const currentIdx = selected.density_timeline.indexOf(playhead);
  const currentDensity = currentIdx !== -1 ? selected.density_values[currentIdx] : 0;

  const getFruinLevel = (d) => {
    for (let i = FRUIN_LEVELS.length - 1; i >= 0; i--) {
      if (d >= FRUIN_LEVELS[i].threshold) return FRUIN_LEVELS[i];
    }
    return FRUIN_LEVELS[0];
  };
  const currentLevel = getFruinLevel(currentDensity);

  const hash = hashString(selected.name);
  const imgId = (hash % 2) + 1; 
  const cctvImg = `/assets/cctv/${selected.cctvCat}_${imgId}.png`;
  const scaleX = (hash % 3 === 0) ? -1 : 1;
  const zoom = 1 + ((hash % 20) / 100);
  const hue = (hash % 60) - 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCat(cat);
              const firstInc = STATIC_INCIDENTS.find(i => i.category === cat);
              if (firstInc) handleSelect(firstInc);
            }}
            style={{
              background: selectedCat === cat ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              color: selectedCat === cat ? '#f0f0ff' : '#64748b',
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Incident selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {STATIC_INCIDENTS.filter(inc => inc.category === selectedCat).map(inc => (
          <button
            key={inc.id}
            onClick={() => handleSelect(inc)}
            style={{
              background: selected.id === inc.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${selected.id === inc.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              color: selected.id === inc.id ? '#a5b4fc' : '#94a3b8',
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s ease',
              textAlign: 'left', minWidth: 160
            }}
          >
            <div style={{ color: selected.id === inc.id ? '#f0f0ff' : '#94a3b8', fontWeight: 700, marginBottom: 2 }}>
              {inc.name}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{inc.deaths} deaths</div>
          </button>
        ))}
      </div>

      {/* Incident info & CCTV Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>Date</div>
              <div style={{ color: '#f0f0ff', fontWeight: 600 }}>{selected.date}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>Location</div>
              <div style={{ color: '#f0f0ff', fontWeight: 600 }}>{selected.location}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>Deaths</div>
              <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 18 }}>{selected.deaths}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>Peak Density</div>
              <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 18 }}>{selected.estimated_peak_density} p/m²</div>
            </div>
          </div>
        </div>

        {/* Dynamic CCTV Feed */}
        <div style={{
          position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: 110
        }}>
          <img src={cctvImg} alt="Historical CCTV" style={{ 
            width: '100%', height: '100%', objectFit: 'cover', 
            transform: `scaleX(${scaleX}) scale(${zoom})`, 
            filter: `hue-rotate(${hue}deg) sepia(0.4) contrast(1.1) brightness(0.85)` 
          }} />
          <div style={{ position: 'absolute', top: 6, left: 8, color: '#fca5a5', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 2px #000' }}>
            <Camera size={10} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }}/> ARCHIVE CAM
          </div>
          <div style={{ position: 'absolute', bottom: 6, right: 8, color: '#fff', fontSize: 9, fontFamily: 'monospace', textShadow: '0 0 2px #000' }}>
            {selected.date} {String(10 + (hash % 8)).padStart(2,'0')}:{String(hash % 60).padStart(2,'0')}:00
          </div>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* CrowdShield early warning callout */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,197,94,0.08))',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        <AlertTriangle size={24} color="#6366f1"/>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#a5b4fc' }}>
            CrowdShield Early Warning Analysis
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            System would have flagged{' '}
            <strong style={{ color: '#22c55e' }}>LoS E (Critical)</strong> at minute{' '}
            <strong style={{ color: '#6366f1' }}>{earlyWarningMinute}</strong>, giving
            operators{' '}
            <strong style={{ color: '#fbbf24', fontSize: 16 }}>{timeSaved} minutes</strong>{' '}
            to intervene before the crush at minute {crushMinute}.
          </div>
        </div>
      </div>

      {/* Replay chart */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Replay: {selected.name}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPlaying(p => !p)}
              style={{
                background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#a5b4fc',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600
              }}
            >
              {playing ? <Pause size={14}/> : <Play size={14}/>}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#64748b',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
              }}
            >
              <RotateCcw size={12}/> Reset
            </button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>t={playhead} min</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: currentLevel.color,
              background: `${currentLevel.color}20`, padding: '2px 8px', borderRadius: 4
            }}>LoS {currentLevel.level}</span>
          </div>
        </div>

        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 20, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="grad-backtest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }}
                label={{ value: 'Minutes', position: 'insideBottom', fill: '#64748b', fontSize: 11, offset: -2 }}/>
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
                label={{ value: 'p/m²', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}/>
              <Tooltip formatter={(v) => v ? `${v.toFixed(2)} p/m²` : 'N/A'}
                contentStyle={{ background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}/>
              
              {/* Fruin level reference lines */}
              {[3.86, 5.4].map(threshold => (
                <ReferenceLine key={threshold} y={threshold} stroke={threshold >= 5.4 ? '#ef4444' : '#f97316'}
                  strokeDasharray="4 4" strokeWidth={1}
                  label={{ value: threshold >= 5.4 ? 'LoS F' : 'LoS E', fill: threshold >= 5.4 ? '#ef4444' : '#f97316', fontSize: 10 }}/>
              ))}
              
              {/* Early warning marker */}
              {playhead >= earlyWarningMinute && (
                <ReferenceLine x={earlyWarningMinute} stroke="#6366f1" strokeWidth={2}
                  label={{ value: '⚡ Warning', fill: '#6366f1', fontSize: 10, position: 'top' }}/>
              )}
              {/* Actual incident marker */}
              {playhead >= crushMinute && (
                <ReferenceLine x={crushMinute} stroke="#ef4444" strokeWidth={2}
                  label={{ value: '💀 Crush', fill: '#ef4444', fontSize: 10, position: 'top' }}/>
              )}

              <Area type="monotone" dataKey="density" stroke="#ef4444" strokeWidth={2.5}
                fill="url(#grad-backtest)" dot={{ fill: '#ef4444', r: 3 }} connectNulls={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
