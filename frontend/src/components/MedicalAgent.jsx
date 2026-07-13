import React, { useState } from 'react';
import { Activity, Plus, HeartPulse, Hospital, AlertTriangle, Stethoscope, Check, FileText } from 'lucide-react';

export default function MedicalAgent({ location, zoneRisks, overallSeverity }) {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  
  const isEmergency = overallSeverity === 'EVACUATE' || overallSeverity === 'CRITICAL';
  const totalRiskScore = Object.values(zoneRisks).reduce((acc, curr) => acc + curr.risk_score, 0);
  const avgRisk = Object.keys(zoneRisks).length ? Math.round(totalRiskScore / Object.keys(zoneRisks).length) : 0;
  
  return (
    <div className="animate-fade-in" style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
      <div className="glass" style={{ padding: '32px', maxWidth: 1050, margin: '0 auto', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', zIndex: 0 }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,114,182,0.1))', padding: 14, borderRadius: 16, border: '1px solid rgba(236,72,153,0.3)' }}>
              <Activity size={28} color="#f472b6" style={isEmergency ? { animation: 'pulse-dot 1s infinite' } : {}} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Medical & First Response <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #f472b6, #ec4899)' }}>Triage</span></h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Live volunteer dispatch and casualty prevention for {location.name}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
             {/* Readiness Card */}
             <div className="glass animate-slide-in" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', fontSize: 14, fontWeight: 600 }}>
                    <Plus size={18}/> Rapid Response Readiness
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: isEmergency ? '#ef4444' : '#4ade80', letterSpacing: '-1px' }}>
                  {isEmergency ? 'SCALED UP' : 'STANDBY'}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                  {isEmergency ? 'All volunteers directed to staging areas' : 'Standard patrolling protocols active'}
                </div>
             </div>

             {/* Medical Load Card */}
             <div className="glass animate-slide-in" style={{ animationDelay: '0.1s', padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f472b6', fontSize: 14, fontWeight: 600 }}>
                    <HeartPulse size={18} style={avgRisk > 60 ? { animation: 'pulse-dot 0.8s infinite' } : {}}/> Est. Medical Load
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                  {avgRisk > 60 ? 'CRITICAL' : avgRisk > 30 ? 'ELEVATED' : 'NOMINAL'}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                  <Stethoscope size={14} /> Forecasted based on crush metrics
                </div>
             </div>

             {/* Triage Location Card */}
             <div className="glass animate-slide-in" style={{ animationDelay: '0.2s', padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontSize: 14, fontWeight: 600 }}>
                    <Hospital size={18}/> Primary Triage Hub
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  {location.category === 'temple' ? 'Outer Courtyard Center' : 'Sector 4 Base Camp'}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8', display: 'flex', gap: 8 }}>
                   <span style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>Cap: 150 beds</span>
                   <span style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>Ambulance: 4</span>
                </div>
             </div>
          </div>

          {isEmergency && (
            <div className="glass animate-slide-in" style={{ animationDelay: '0.3s', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.05))', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ef4444, #fca5a5, #ef4444)', animation: 'text-shimmer 2s infinite linear' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444', fontWeight: 800, marginBottom: 16, fontSize: 18 }}>
                <AlertTriangle size={24} style={{ animation: 'pulse-dot 1s infinite' }} />
                <span>URGENT MEDICAL DISPATCH REQUIRED</span>
              </div>
              <p style={{ color: '#fca5a5', fontSize: 15, lineHeight: 1.6 }}>
                Alert local emergency networks and deploy standby rapid response teams to the main entrance immediately. 
                Potential crush-related asphyxiation and trauma cases anticipated in <strong>{Object.keys(zoneRisks).find(k => zoneRisks[k].risk_score >= 75) || 'high risk zones'}</strong>.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setIsAcknowledged(true)}
                  style={{ 
                    background: isAcknowledged ? '#22c55e' : '#ef4444', 
                    color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, 
                    cursor: isAcknowledged ? 'default' : 'pointer', 
                    boxShadow: isAcknowledged ? 'none' : '0 4px 15px rgba(239,68,68,0.4)',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                  disabled={isAcknowledged}
                >
                  {isAcknowledged ? <Check size={18} /> : null}
                  {isAcknowledged ? 'Dispatch Acknowledged' : 'Acknowledge Dispatch'}
                </button>
                <button 
                  onClick={() => setShowProtocol(!showProtocol)}
                  style={{ background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FileText size={18} />
                  {showProtocol ? 'Hide Protocol' : 'View Protocol'}
                </button>
              </div>

              {showProtocol && (
                <div style={{ marginTop: 20, padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16}/> Medical Dispatch Protocol</h4>
                  <ul style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, paddingLeft: 20 }}>
                    <li><strong style={{color:'#fca5a5'}}>Step 1:</strong> Halt all incoming flows to {Object.keys(zoneRisks).find(k => zoneRisks[k].risk_score >= 75) || 'the affected area'} immediately.</li>
                    <li><strong style={{color:'#fca5a5'}}>Step 2:</strong> Dispatch 2 ambulance units to the nearest access gate.</li>
                    <li><strong style={{color:'#fca5a5'}}>Step 3:</strong> Clear a path for triage volunteers through Sector 4.</li>
                    <li><strong style={{color:'#fca5a5'}}>Step 4:</strong> Prepare oxygen reserves at Outer Courtyard Center.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
