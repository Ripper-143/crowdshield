import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import InteractiveSimulation from './components/InteractiveSimulation';
import AlertBanner from './components/AlertBanner';
import ZonePanel from './components/ZonePanel';
import BacktestReplay from './components/BacktestReplay';
import FruinBadge from './components/FruinBadge';
import CCTVPanel from './components/CCTVPanel';
import EvacuationAgent from './components/EvacuationAgent';
import MedicalAgent from './components/MedicalAgent';
import EnvironmentalAgent from './components/EnvironmentalAgent';
import AnalyticsAgent from './components/AnalyticsAgent';
import Login from './components/Login';
import { useWebSocket } from './hooks/useWebSocket';
import { LOCATIONS, CATEGORIES } from './data/locationsData';
import { 
  Shield, Activity, Clock, Users, Wifi, WifiOff, 
  Play, Square, RotateCcw, Search, Compass, Train, 
  Flame, Milestone, AlertTriangle, Cpu, Sliders, CheckCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SEVERITY_COLORS = {
  NORMAL: '#22c55e',
  WATCH: '#eab308',
  WARNING: '#f97316',
  CRITICAL: '#ef4444',
  EVACUATE: '#dc2626'
};

const CATEGORY_ICONS = {
  temple: Compass,
  monument: Milestone,
  transit: Train,
  festival: Flame
};

function StatCard({ icon: Icon, label, value, color = '#6366f1', sub }) {
  return (
    <div className="glass" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', cursor: 'default' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}22, ${color}11)`, 
        border: `1px solid ${color}35`, flexShrink: 0,
        boxShadow: `0 0 16px ${color}15`
      }}>
        <Icon size={20} color={color}/>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textShadow: `0 0 12px ${color}35` }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tab, setTab] = useState('live');   // 'live' | 'backtest'
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeControls, setActiveControls] = useState([]);
  const [multiplier, setMultiplier] = useState(1.0);
  
  // Real-time Simulation States
  const [zoneRisks, setZoneRisks] = useState({});
  const [selectedZone, setSelectedZone] = useState('queue'); // default to queue to show details immediately
  const [overallSeverity, setOverallSeverity] = useState('NORMAL');
  const [totalAgents, setTotalAgents] = useState(0);
  const [simTime, setSimTime] = useState(0);
  const [tick, setTick] = useState(0);
  const [simRunning, setSimRunning] = useState(true); // run by default for live look
  const [highPriorityAlerts, setHighPriorityAlerts] = useState([]);
  
  // Rolling local histories for charts (offline-mode support)
  const [localHistories, setLocalHistories] = useState({});


  // Reset simulation when location changes
  useEffect(() => {
    setZoneRisks({});
    setHighPriorityAlerts([]);
    setOverallSeverity('NORMAL');
    setTotalAgents(0);
    setTick(0);
    setSimTime(0);
    setActiveControls([]);
    setLocalHistories({});
    setSelectedZone('queue');
  }, [selectedLoc]);

  // Handle updates from WebSocket (Connected Mode) or Local simulation ticks
  const handleTickData = useCallback((data) => {
    if (data.alerts) {
      setZoneRisks(data.alerts);
      const alerts = Object.values(data.alerts);
      setHighPriorityAlerts(alerts.filter(a => (a.risk_score || 0) >= 60));
      
      // Update rolling local histories for charting in offline mode
      setLocalHistories(prev => {
        const next = { ...prev };
        Object.entries(data.alerts).forEach(([zId, alert]) => {
          if (!next[zId]) {
            next[zId] = {
              zone_id: zId,
              zone_name: alert.zone_name,
              readings: [],
              forecast: []
            };
          }
          const currentReadings = [...(next[zId].readings || [])];
          currentReadings.push({
            ts: new Date().toISOString(),
            density: alert.density,
            people_count: Math.floor(alert.density * 150),
            inflow_rate: 0,
            outflow_rate: 0
          });
          if (currentReadings.length > 30) currentReadings.shift();

          const forecastPts = [];
          const trend = alert.forecast_density - alert.density;
          for (let step = 1; step <= 10; step++) {
            const fc = Math.max(0, alert.density + (trend / 10) * step);
            forecastPts.push({
              tick: step,
              forecast_density: Number(fc.toFixed(2)),
              lower_bound: Number(Math.max(0, fc * 0.85).toFixed(2)),
              upper_bound: Number((fc * 1.15).toFixed(2))
            });
          }

          next[zId] = {
            zone_id: zId,
            zone_name: alert.zone_name,
            readings: currentReadings,
            forecast: forecastPts,
            current_fruin_level: alert.fruin_level,
            current_risk_score: alert.risk_score
          };
        });
        return next;
      });
    }
    if (data.overall_severity) setOverallSeverity(data.overall_severity);
    if (data.total_agents !== undefined) setTotalAgents(data.total_agents);
    if (data.sim_time !== undefined) setSimTime(data.sim_time);
    if (data.tick !== undefined) setTick(data.tick);
  }, []);

  // Try to connect to FastAPI WebSocket backend
  const wsStatus = useWebSocket(handleTickData);

  // Sync controls with backend if connected
  const handleSimStart = async () => {
    setSimRunning(true);
    if (wsStatus === 'open') {
      try {
        await fetch(`${API_BASE}/simulate/start`, { method: 'POST' });
      } catch (e) {}
    }
  };

  const handleSimStop = async () => {
    setSimRunning(false);
    if (wsStatus === 'open') {
      try {
        await fetch(`${API_BASE}/simulate/stop`, { method: 'POST' });
      } catch (e) {}
    }
  };

  const handleSimReset = async () => {
    setZoneRisks({});
    setTick(0);
    setSimTime(0);
    setTotalAgents(0);
    setOverallSeverity('NORMAL');
    setHighPriorityAlerts([]);
    setActiveControls([]);
    setLocalHistories({});
    if (wsStatus === 'open') {
      try {
        await fetch(`${API_BASE}/simulate/reset`, { method: 'POST' });
      } catch (e) {}
    }
  };

  const toggleControl = (controlName) => {
    setActiveControls(prev => 
      prev.includes(controlName) 
        ? prev.filter(c => c !== controlName)
        : [...prev, controlName]
    );
  };

  // Filtering locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return LOCATIONS;
    const q = searchQuery.toLowerCase();
    return LOCATIONS.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.state.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group filtered locations by category
  const groupedLocations = useMemo(() => {
    const groups = { temple: [], monument: [], transit: [], festival: [] };
    filteredLocations.forEach(l => {
      if (groups[l.category]) {
        groups[l.category].push(l);
      }
    });
    return groups;
  }, [filteredLocations]);

  const severityColor = SEVERITY_COLORS[overallSeverity] || '#22c55e';
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  useEffect(() => {
    // Keep simulation running or stop it if we switch away from live tab
    if (tab === 'backtest') setSimRunning(false);
  }, [tab]);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#020617',
      backgroundImage: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      color: 'var(--text-main)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      
      {/* Header Banner */}
      <header style={{
        background: 'rgba(12,12,20,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 20px',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 20, height: 60
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Shield size={18} color="#fff"/>
          </div>
          <div>
            <div className="text-gradient" style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em' }}>CrowdShield AI</div>
            <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Crush Risk Engine</div>
          </div>
        </div>

        {/* Dual Mode Indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: wsStatus === 'open' ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.12)',
          border: `1px solid ${wsStatus === 'open' ? 'rgba(34,197,94,0.25)' : 'rgba(99,102,241,0.3)'}`,
          borderRadius: 8, padding: '4px 10px', fontSize: 11
        }}>
          {wsStatus === 'open' ? (
            <>
              <Cpu size={12} color="#22c55e"/>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>SQL Backend Connected</span>
            </>
          ) : (
            <>
              <Cpu size={12} color="#a5b4fc"/>
              <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Standalone Local Mode</span>
            </>
          )}
        </div>

        {/* Overall Safety Rating */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 8,
          background: `${severityColor}12`,
          border: `1px solid ${severityColor}25`,
          borderRadius: 8, padding: '5px 12px',
          animation: overallSeverity === 'EVACUATE' || overallSeverity === 'CRITICAL' ? 'glow-pulse 1.5s ease-in-out infinite' : 'none'
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: severityColor,
            animation: overallSeverity !== 'NORMAL' ? 'pulse-dot 1s infinite' : 'none'
          }}/>
          <span style={{ fontWeight: 800, fontSize: 11, color: severityColor, letterSpacing: '0.04em' }}>
            STATUS: {overallSeverity}
          </span>
        </div>

        {/* Connection status dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {wsStatus === 'open' ? <Wifi size={13} color="#22c55e"/> : <WifiOff size={13} color="#64748b"/>}
          <span style={{ fontSize: 11, color: wsStatus === 'open' ? '#22c55e' : '#64748b', fontWeight: 500 }}>
            {wsStatus === 'open' ? 'Live WebSocket' : 'Offline'}
          </span>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

          {!simRunning ? (
            <button onClick={handleSimStart} style={{
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#22c55e',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600
            }}>
              <Play size={12}/> Run Feed
            </button>
          ) : (
            <button onClick={handleSimStop} style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600
            }}>
              <Square size={12}/> Pause Feed
            </button>
          )}
          <button onClick={handleSimReset} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#64748b',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11
          }}>
            <RotateCcw size={11}/>
          </button>
        </div>
      </header>

      {/* Global Metrics bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        background: 'rgba(5, 5, 10, 0.6)'
      }}>
        <StatCard icon={Users} label="Monitored Headcount" value={totalAgents.toLocaleString()} color="#6366f1" sub={`capacity limit: ${selectedLoc.baseCapacity.toLocaleString()}`}/>
        <StatCard icon={Activity} label="Active Inflow Multiplier" value={`${multiplier.toFixed(1)}x`} color="#8b5cf6" sub={`${Math.round(selectedLoc.hourlyInflow * multiplier).toLocaleString()} visitors / hour`}/>
        <StatCard icon={Clock} label="Monitoring Time" value={formatTime(simTime)} color="#06b6d4" sub="active session"/>
        <StatCard
          icon={Shield}
          label="Active Hazards"
          value={highPriorityAlerts.length}
          color={highPriorityAlerts.length > 0 ? '#ef4444' : '#22c55e'}
          sub={highPriorityAlerts.length > 0 ? 'critical areas require action' : 'all thresholds clear'}
        />
      </div>

      {/* Main Tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 20px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {[
          { id: 'live', label: '⚡ Live Monitoring Dashboard' }, 
          { id: 'backtest', label: '📊 Indian Stampede Backtest Replays' },
          { id: 'evacuation', label: '🏃 Dynamic Evacuation Routing Agent' },
          { id: 'medical', label: '🚑 Medical & First Response Agent' },
          { id: 'weather', label: '🌤️ Environmental Impact Agent' },
          { id: 'analytics', label: '📑 Predictive Analytics Agent' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`,
              borderRadius: '6px 6px 0 0',
              padding: '6px 14px 8px',
              cursor: 'pointer',
              color: tab === t.id ? '#a5b4fc' : '#64748b',
              fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Main Dashboard Layout */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {tab === 'live' ? (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 340px', minHeight: 0 }}>
            
            {/* 1. Left Column: Categorized Venue List Sidebar */}
            <div style={{
              borderRight: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 160px)',
              overflowY: 'auto',
              background: 'rgba(12,12,20,0.4)',
              padding: '14px'
            }}>
              {/* Search Box */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={12} color="#64748b" style={{ position: 'absolute', left: 10, top: 10 }}/>
                <input
                  type="text"
                  placeholder="Search 40+ locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    padding: '6px 10px 6px 28px',
                    fontSize: 12,
                    color: '#f0f0ff',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Grouped Sidebar list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                  const items = groupedLocations[catKey] || [];
                  if (items.length === 0) return null;
                  const Icon = CATEGORY_ICONS[catKey];

                  return (
                    <div key={catKey}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: cat.color, fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: 6, paddingLeft: 4
                      }}>
                        <Icon size={12}/>
                        <span>{cat.label} ({items.length})</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map(l => {
                          const isSelected = selectedLoc.id === l.id;
                          return (
                            <button
                              key={l.id}
                              onClick={() => setSelectedLoc(l)}
                              style={{
                                background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                                border: `1px solid ${isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                                borderRadius: 6,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                width: '100%',
                                gap: 8
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? '#fff' : '#94a3b8',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {l.name}
                                </div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{l.state}</div>
                              </div>
                              
                              {/* Show active risk state for selected list row */}
                              {isSelected && zoneRisks.queue && (
                                <div style={{
                                  fontSize: 9, fontWeight: 800,
                                  background: `${zoneRisks.queue.color}15`,
                                  border: `1px solid ${zoneRisks.queue.color}25`,
                                  color: zoneRisks.queue.color,
                                  padding: '2px 5px',
                                  borderRadius: 4,
                                  flexShrink: 0
                                }}>
                                  LoS {zoneRisks.queue.fruin_level}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {filteredLocations.length === 0 && (
                  <div style={{ color: '#64748b', fontSize: 11, textAlign: 'center', padding: 10 }}>
                    No matching venues found.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Center Column: Venue Monitor Feed, Simulation & Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              gap: 14,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 160px)'
            }}>
              
              {/* Location Profile details */}
              <div className="glass" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', background: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                      {selectedLoc.category}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{selectedLoc.state}</span>
                  </div>
                  <h2 className="text-gradient" style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>
                    {selectedLoc.name}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6 }}>
                    {selectedLoc.description || selectedLoc.funFact}
                  </p>
                </div>
                <div style={{ flexShrink: 0, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Physical Bottleneck</div>
                  <div style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600, textAlign: 'right', maxWidth: 180 }}>
                    {selectedLoc.bottleneckDesc}
                  </div>
                </div>
              </div>

              {/* Simulation Canvas View */}
              <div className="glass" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      👁️ Real-Time Sensor / Physical Model View
                    </h3>
                  </div>
                  <span style={{ fontSize: 10, color: '#64748b' }}>60 FPS Physics Engine</span>
                </div>
                
                <InteractiveSimulation
                  location={selectedLoc}
                  isRunning={simRunning}
                  activeControls={activeControls}
                  multiplier={multiplier}
                  onTickData={handleTickData}
                />
              </div>

              {/* Simulation Controls: Multiplier & Mitigation Actions */}
              <div className="glass" style={{ padding: 16, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
                {/* Multiplier Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#f0f0ff' }}>
                      Traffic Influx Load
                    </label>
                    <span style={{ fontSize: 11, color: multiplier > 1.8 ? '#ef4444' : multiplier > 1.2 ? '#f97316' : '#22c55e', fontWeight: 700 }}>
                      {multiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={multiplier}
                    onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#6366f1',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginTop: 4 }}>
                    <span>Off-Peak</span>
                    <span>Standard</span>
                    <span>Peak Surge</span>
                  </div>
                </div>

                {/* Mitigation Actions */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f0ff', marginBottom: 8 }}>
                    ⚙️ Active Command Center Mitigation Controls (Toggle)
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedLoc.actions.map(action => {
                      const isActive = activeControls.includes(action);
                      return (
                        <button
                          key={action}
                          onClick={() => toggleControl(action)}
                          style={{
                            background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isActive ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 6,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            color: isActive ? '#a5b4fc' : '#94a3b8',
                            fontSize: 10,
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {isActive ? <CheckCircle size={10} color="#6366f1"/> : <Activity size={10}/>}
                          {action}
                        </button>
                      );
                    })}
                    
                    {/* Evacuation button */}
                    <button
                      onClick={() => toggleControl("Emergency Area Evacuation")}
                      style={{
                        background: activeControls.includes("Emergency Area Evacuation") ? 'rgba(220,38,38,0.25)' : 'rgba(239,68,68,0.05)',
                        border: `1px solid ${activeControls.includes("Emergency Area Evacuation") ? '#ef4444' : 'rgba(239,68,68,0.15)'}`,
                        borderRadius: 6,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: 10,
                        fontWeight: 700,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⚠️ Emergency Evacuation Order
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Right Column: Detailed Analytics, Forecast Charts & Alarms Feed */}
            <div style={{
              borderLeft: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              gap: 14,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 160px)',
              background: 'rgba(12,12,20,0.2)'
            }}>
              
              {/* Selected Zone detail */}
              {selectedZone && zoneRisks[selectedZone] && (
                <ZonePanel
                  zoneId={selectedZone}
                  risk={zoneRisks[selectedZone]}
                  onClose={() => setSelectedZone(null)}
                  localHistory={localHistories[selectedZone]}
                />
              )}

              {/* CCTV Camera Feeds */}
              <CCTVPanel location={selectedLoc} zoneRisks={zoneRisks} />

              {/* Zones selector cards */}
              <div className="glass" style={{ padding: 14 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Zone Density Status Indicators
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {Object.entries(zoneRisks).map(([zId, risk]) => {
                    const isSelected = selectedZone === zId;
                    return (
                      <button
                        key={zId}
                        onClick={() => setSelectedZone(zId)}
                        style={{
                          background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isSelected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 6, padding: '8px 10px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                          transition: 'all 0.15s ease', width: '100%'
                        }}
                      >
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: `${risk.color}15`,
                          border: `1px solid ${risk.color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: risk.color, fontWeight: 900, fontSize: 11, flexShrink: 0
                        }}>{risk.fruin_level}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {risk.zone_name}
                          </div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>{(risk.density || 0).toFixed(2)} p/m²</div>
                        </div>
                        <div style={{
                          fontSize: 9, fontWeight: 700, color: risk.color,
                          background: `${risk.color}12`, padding: '2px 5px', borderRadius: 4
                        }}>{risk.risk_score}/100</div>
                      </button>
                    );
                  })}
                  {Object.keys(zoneRisks).length === 0 && (
                    <div style={{ color: '#64748b', fontSize: 10, textAlign: 'center', padding: 12 }}>
                      Awaiting physics ticks...
                    </div>
                  )}
                </div>
              </div>

              {/* Alarms Feed */}
              <div className="glass" style={{ padding: 14 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  🚨 AI Control Room Alerts
                </h3>
                <AlertBanner
                  alerts={Object.values(zoneRisks)}
                  overallSeverity={overallSeverity}
                />
              </div>

            </div>
          </div>
        ) : tab === 'backtest' ? (
          /* Historical Backtest Tab */
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
            <div className="glass" style={{ padding: '20px 24px', maxWidth: 1000, margin: '0 auto' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 4 }}>
                📊 Historical Incident Backtest & Safety Verification
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                Replay documented Indian crowd disasters to evaluate early warnings that could have saved lives.
              </p>
              <BacktestReplay/>
            </div>
          </div>
        ) : tab === 'evacuation' ? (
          <EvacuationAgent location={selectedLoc} zoneRisks={zoneRisks} overallSeverity={overallSeverity} />
        ) : tab === 'medical' ? (
          <MedicalAgent location={selectedLoc} zoneRisks={zoneRisks} overallSeverity={overallSeverity} />
        ) : tab === 'weather' ? (
          <EnvironmentalAgent location={selectedLoc} overallSeverity={overallSeverity} multiplier={multiplier} />
        ) : (
          <AnalyticsAgent location={selectedLoc} zoneRisks={zoneRisks} localHistories={localHistories} />
        )}
      </div>

      {/* Footer */}
      <footer style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 10, color: '#64748b', background: '#08080d', flexShrink: 0
      }}>
        <span>CrowdShield AI · Pedestrian Safety & Crush Risk Engine</span>
        <span>Built for Indian Gatherings & Sacred Pilgrimages · Powered by Fruin LoS Framework</span>
      </footer>
    </div>
  );
}
