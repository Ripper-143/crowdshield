import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

// Simple string hashing to get a deterministic number for each location
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export default function CCTVPanel({ location, zoneRisks }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hash = hashString(location.id);

  // We have 2 base images per category
  // Camera 1 uses the base hash, Camera 2 uses hash + 1
  const getCameraConfig = (camIndex) => {
    const cat = location.category;
    const offsetHash = hash + (camIndex * 997); // arbitrary prime offset
    
    // Pick image 1 or 2
    const imgId = (offsetHash % 2) + 1; 
    const imgPath = `/assets/cctv/${cat}_${imgId}.png`;

    // Dynamic transforms to make the same image look distinct for different locations
    const scaleX = (offsetHash % 3 === 0) ? -1 : 1;
    const scaleY = (offsetHash % 5 === 0) ? -1 : 1;
    const zoom = 1 + ((offsetHash % 15) / 100); // 1.0 to 1.14 scale
    
    // Pan offset
    const panX = (offsetHash % 20) - 10;
    const panY = ((offsetHash >> 2) % 20) - 10;
    
    // Filters
    const hue = (offsetHash % 40) - 20; // -20deg to 20deg
    const contrast = 1 + ((offsetHash % 30) / 100); // 1.0 to 1.3
    const brightness = 0.85 + ((offsetHash % 20) / 100); // 0.85 to 1.05

    return {
      id: camIndex,
      name: camIndex === 1 ? 'Primary Gate' : 'Inner Concourse',
      tag: `CAM-${String(offsetHash % 99).padStart(2, '0')}`,
      img: imgPath,
      style: {
        transform: `scaleX(${scaleX}) scaleY(${scaleY}) scale(${zoom}) translate(${panX}px, ${panY}px)`,
        filter: `hue-rotate(${hue}deg) contrast(${contrast}) brightness(${brightness})`,
        width: '100%', height: 120, objectFit: 'cover', display: 'block', transition: 'all 0.5s ease'
      }
    };
  };

  const feeds = [getCameraConfig(1), getCameraConfig(2)];

  return (
    <div className="glass" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={14} color="var(--accent)" /> AI SURVEILLANCE FEEDS
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 1s infinite' }} />
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 800 }}>LIVE REC</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {feeds.map(feed => (
          <div key={feed.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* The dynamically styled image */}
            <div style={{ width: '100%', height: 120, overflow: 'hidden' }}>
              <img src={feed.img} alt="CCTV Feed" style={feed.style} />
            </div>
            
            {/* OSD Overlays */}
            <div style={{ position: 'absolute', top: 4, left: 6, color: '#22c55e', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 2px #000' }}>
              {feed.tag} - {location.name.substring(0,12).toUpperCase()}
            </div>
            <div style={{ position: 'absolute', top: 4, right: 6, color: '#fff', fontSize: 9, fontFamily: 'monospace', textShadow: '0 0 2px #000' }}>
              {time}
            </div>
            
            {/* Overlay Grid lines for tech look */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)', pointerEvents: 'none' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
