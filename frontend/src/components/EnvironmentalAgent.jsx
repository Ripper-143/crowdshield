import React from 'react';
import { ThermometerSun, Droplets, Sun, Wind, CloudRain, Activity } from 'lucide-react';

export default function EnvironmentalAgent({ location, overallSeverity, multiplier }) {
  // Mock data enhanced for premium feel
  const heatIndex = Math.min(45, 30 + (multiplier * 4));
  const humidity = 65 + (multiplier * 5);
  const aqi = Math.min(300, 80 + (multiplier * 20)); // Air Quality Index
  const windSpeed = 12; // km/h
  
  const isHighRisk = overallSeverity === 'EVACUATE' || overallSeverity === 'CRITICAL';
  const fatigueMultiplier = Math.round((heatIndex / 30) * 100) / 100;

  const getAQIColor = (val) => val > 150 ? '#ef4444' : val > 100 ? '#facc15' : '#4ade80';
  const getAQIText = (val) => val > 150 ? 'Unhealthy' : val > 100 ? 'Moderate' : 'Good';

  return (
    <div className="animate-fade-in" style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
      <div className="glass" style={{ padding: '32px', maxWidth: 1050, margin: '0 auto', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '300px', background: 'radial-gradient(ellipse at top, rgba(250, 204, 21, 0.08) 0%, transparent 70%)', zIndex: 0 }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(253,224,71,0.1))', padding: 14, borderRadius: 16, border: '1px solid rgba(250,204,21,0.3)' }}>
              <Sun size={28} color="#facc15" />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Environmental <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #facc15, #fde047)' }}>Impact Analytics</span></h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Micro-climate tracking and crowd exhaustion modeling for {location.name}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
            {/* Heat Index */}
            <div className="glass animate-slide-in" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#facc15', marginBottom: 16, fontWeight: 600 }}>
                <ThermometerSun size={20} color={heatIndex > 38 ? '#ef4444' : '#facc15'}/> Heat Index
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                {heatIndex.toFixed(1)}<span style={{ fontSize: 20, color: '#94a3b8' }}>°C</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: heatIndex > 38 ? '#ef4444' : '#94a3b8' }}>
                {heatIndex > 38 ? 'Extreme Heat Warning' : 'Feels like temperature'}
              </div>
            </div>
            
            {/* Humidity */}
            <div className="glass animate-slide-in" style={{ animationDelay: '0.1s', padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#38bdf8', marginBottom: 16, fontWeight: 600 }}>
                <Droplets size={20} /> Relative Humidity
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                {humidity.toFixed(0)}<span style={{ fontSize: 20, color: '#94a3b8' }}>%</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                Amplifies perceived heat
              </div>
            </div>

            {/* AQI */}
            <div className="glass animate-slide-in" style={{ animationDelay: '0.2s', padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: getAQIColor(aqi), marginBottom: 16, fontWeight: 600 }}>
                <Wind size={20} /> Air Quality Index
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                {Math.round(aqi)}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: getAQIColor(aqi), fontWeight: 600 }}>
                {getAQIText(aqi)} Level
              </div>
            </div>

            {/* Fatigue Multiplier */}
            <div className="glass animate-slide-in" style={{ animationDelay: '0.3s', padding: 24, borderRadius: 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.05), transparent)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', marginBottom: 16, fontWeight: 600 }}>
                <Activity size={20} /> Crowd Fatigue Rate
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#34d399', letterSpacing: '-1px' }}>
                {fatigueMultiplier}x
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                Acceleration of exhaustion
              </div>
            </div>
          </div>

          <div className="glass animate-fade-in" style={{ animationDelay: '0.4s', padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 16, fontWeight: 700 }}>AI Exhaustion Prevention Strategy</h3>
            <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 20 }}>
              Current environmental conditions combined with predicted density generate a crowd fatigue multiplier of <strong style={{color:'#fff', fontSize: 16}}>{fatigueMultiplier}x</strong>. 
              Prolonged exposure in static queues will rapidly drain stamina.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, borderLeft: heatIndex > 38 ? '4px solid #ef4444' : '4px solid #4ade80' }}>
                <h4 style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}>Hydration Protocol</h4>
                {heatIndex > 38 ? (
                  <span style={{ color: '#fca5a5', fontSize: 13, lineHeight: 1.5, display: 'block' }}>High risk of heat syncope. Deploy emergency water stations and misting fans across all active queues immediately.</span>
                ) : (
                  <span style={{ color: '#86efac', fontSize: 13, lineHeight: 1.5, display: 'block' }}>Standard hydration provisions are adequate. Monitor elderly demographics.</span>
                )}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, borderLeft: aqi > 150 ? '4px solid #ef4444' : '4px solid #facc15' }}>
                <h4 style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}>Ventilation Protocol</h4>
                {aqi > 150 ? (
                  <span style={{ color: '#fca5a5', fontSize: 13, lineHeight: 1.5, display: 'block' }}>Poor air circulation detected. Increase fan speeds in enclosed halls to 100% to mitigate respiratory stress.</span>
                ) : (
                  <span style={{ color: '#fde047', fontSize: 13, lineHeight: 1.5, display: 'block' }}>Maintain active cross-ventilation in dense corridors to prevent CO2 buildup.</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
