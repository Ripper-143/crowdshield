import React from 'react';
import { Shield, ArrowRight, AlertTriangle, Map, MoveRight } from 'lucide-react';

export default function EvacuationAgent({ location, zoneRisks, overallSeverity }) {
  const isEvac = overallSeverity === 'EVACUATE' || overallSeverity === 'CRITICAL';
  
  return (
    <div className="animate-fade-in" style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
      <div className="glass" style={{ padding: '32px', maxWidth: 1050, margin: '0 auto', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: isEvac ? 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', zIndex: 0 }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
            <div style={{ background: isEvac ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(248,113,113,0.1))' : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.1))', padding: 14, borderRadius: 16, border: isEvac ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.3)' }}>
              <Map size={28} color={isEvac ? '#ef4444' : '#a5b4fc'} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Dynamic Evacuation <span className="text-gradient" style={{ backgroundImage: isEvac ? 'linear-gradient(135deg, #ef4444, #f87171)' : 'linear-gradient(135deg, #818cf8, #a5b4fc)' }}>Routing</span></h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Real-time optimal escape paths mapped for {location.name}</p>
            </div>
          </div>

          {isEvac ? (
            <div className="glass animate-slide-in" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.05))', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 20, padding: 24, marginBottom: 30, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ef4444, #fca5a5, #ef4444)', animation: 'text-shimmer 2s infinite linear' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444', fontWeight: 800, marginBottom: 16, fontSize: 18 }}>
                <AlertTriangle size={24} style={{ animation: 'pulse-dot 1s infinite' }} />
                <span>EMERGENCY EVACUATION DIRECTIVE</span>
              </div>
              <p style={{ color: '#fca5a5', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
                Critical crowding density detected. Primary thoroughfares are bottlenecked. Redirecting pedestrian flow to auxiliary safety corridors.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Pathway 1 */}
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Primary Reroute</div>
                    <div style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>ACTIVE</div>
                  </div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{location.actions[1] || 'Side Gates'}</div>
                  <div style={{ color: '#4ade80', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <ArrowRight size={16} style={{ animation: 'slide-in-right 1.5s infinite linear' }}/> Est. Clearance: 4 mins
                  </div>
                </div>

                {/* Pathway 2 */}
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Secondary Reroute</div>
                    <div style={{ background: 'rgba(250,204,21,0.2)', color: '#facc15', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>STANDBY</div>
                  </div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{location.actions[2] || 'Emergency Exits'}</div>
                  <div style={{ color: '#facc15', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <ArrowRight size={16} /> Est. Clearance: 6 mins
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass animate-slide-in" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(74, 222, 128, 0.02))', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 20, padding: 24, marginBottom: 30 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#4ade80', fontWeight: 700, fontSize: 18 }}>
                <Shield size={24} />
                <span>All Evacuation Corridors Clear & on Standby</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>Current density levels are within safety parameters. No active rerouting required.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {Object.entries(zoneRisks).map(([id, risk], idx) => {
              let statusText = 'PASSABLE';
              let statusColor = '#4ade80';
              let statusBg = 'rgba(34,197,94,0.2)';
              
              if (['E', 'F'].includes(risk.fruin_level) || risk.risk_score >= 70) {
                statusText = 'BLOCKED';
                statusColor = '#ef4444';
                statusBg = 'rgba(239,68,68,0.2)';
              } else if (['C', 'D'].includes(risk.fruin_level) || risk.risk_score >= 40) {
                statusText = 'CONGESTED';
                statusColor = '#facc15';
                statusBg = 'rgba(250,204,21,0.2)';
              }

              return (
                <div key={id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.1}s`, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 20, borderRadius: 16, transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{risk.zone_name}</div>
                    <div style={{ background: statusBg, color: statusColor, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                      {statusText}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Risk Tier</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: risk.color }}>Level {risk.fruin_level}</div>
                    </div>
                    <MoveRight size={20} color={statusColor} />
                  </div>
                </div>
              )
            })}
            {Object.keys(zoneRisks).length === 0 && (
              <div style={{ color: '#64748b', fontSize: 14, gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
                Initializing dynamic pathway grid...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
