import React, { useEffect, useRef, useState } from 'react';
import { Shield, Play, Pause, Zap, CheckCircle } from 'lucide-react';

// Fruin LoS config for color-coding
const LOS_COLORS = {
  A: '#22c55e', // Green
  B: '#84cc16', // Light Green
  C: '#eab308', // Yellow
  D: '#f97316', // Orange
  E: '#ef4444', // Red
  F: '#dc2626'  // Deep Red
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash &= hash;
  }
  return Math.abs(hash);
};

export default function InteractiveSimulation({
  location,
  isRunning,
  activeControls = [],
  multiplier = 1.0,
  onTickData
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],
    ticks: 0,
    activeControls: [],
    multiplier: 1.0,
    lastTickTime: 0
  });

  // Keep stateRef in sync to avoid canvas re-creation
  useEffect(() => {
    stateRef.current.activeControls = activeControls;
    stateRef.current.multiplier = multiplier;
  }, [activeControls, multiplier]);

  // Define canvas size & layout scale (1m = 6px)
  const width = 600;
  const height = 300;
  const scale = 8; // pixels per meter

  // Define zone configurations dynamically based on location ID
  const getLayout = (loc) => {
    const hash = simpleHash(loc.id);
    const category = loc.category;
    
    // Use hash to modify standard dimensions
    const modX = (hash % 20) - 10;
    const modY = ((hash >> 2) % 20) - 10;
    const modW = ((hash >> 4) % 30) - 15;
    const gateMod = ((hash >> 6) % 15) - 5;
    
    let base = {};
    if (category === 'temple') {
      base = {
        zones: [
          { id: 'entry', label: 'Entrance Gate', type: 'entry', x: 20, y: 110 + modY, w: 60, h: 80, cap: 300, area: 150 },
          { id: 'queue', label: 'Q-Complex Halls', type: 'congregation', x: 100, y: 40 + modY, w: 260 + modW, h: 220, cap: 2500, area: 1400 },
          { id: 'bottleneck', label: 'Sanctum Threshold', type: 'bottleneck', x: 380 + modW, y: 120 + modY, w: 40, h: 60 + gateMod, cap: 120, area: 60, gateWidth: 2.0 },
          { id: 'exit', label: 'Laddoo Exit Hall', type: 'exit', x: 460 + modW, y: 90 + modY, w: 100, h: 120, cap: 600, area: 300 }
        ],
        walls: [
          { x1: 80, y1: 40 + modY, x2: 360 + modW, y2: 40 + modY },
          { x1: 80, y1: 260 + modY, x2: 360 + modW, y2: 260 + modY },
          { x1: 80, y1: 40 + modY, x2: 80, y2: 110 + modY },
          { x1: 80, y1: 190 + modY, x2: 80, y2: 260 + modY },
          { x1: 360 + modW, y1: 40 + modY, x2: 360 + modW, y2: 120 + modY },
          { x1: 360 + modW, y1: 180 + modY + gateMod, x2: 360 + modW, y2: 260 + modY },
          { x1: 140 + modX, y1: 40 + modY, x2: 140 + modX, y2: 210 + modY },
          { x1: 200 + modX, y1: 90 + modY, x2: 200 + modX, y2: 260 + modY },
          { x1: 260 + modX, y1: 40 + modY, x2: 260 + modX, y2: 210 + modY },
          { x1: 320 + modX, y1: 90 + modY, x2: 320 + modX, y2: 240 + modY }
        ]
      };
    } else if (category === 'transit') {
      base = {
        zones: [
          { id: 'entry', label: 'Ticket Lobby', type: 'entry', x: 20, y: 60 + modY, w: 80, h: 180, cap: 800, area: 450 },
          { id: 'queue', label: 'Waiting Lounge', type: 'congregation', x: 130, y: 50, w: 220 + modW, h: 200, cap: 1800, area: 1100 },
          { id: 'bottleneck', label: 'Platform Bridge', type: 'bottleneck', x: 370 + modW, y: 120, w: 60, h: 50 + gateMod, cap: 150, area: 80, gateWidth: 2.2 },
          { id: 'exit', label: 'Platforms 1-4', type: 'exit', x: 460 + modW, y: 40, w: 110, h: 220, cap: 1200, area: 600 }
        ],
        walls: [
          { x1: 110, y1: 50, x2: 350 + modW, y2: 50 },
          { x1: 110, y1: 250, x2: 350 + modW, y2: 250 },
          { x1: 110, y1: 50, x2: 110, y2: 110 },
          { x1: 110, y1: 170, x2: 110, y2: 250 },
          { x1: 350 + modW, y1: 50, x2: 350 + modW, y2: 120 },
          { x1: 350 + modW, y1: 170 + gateMod, x2: 350 + modW, y2: 250 },
          { x1: 190 + modX, y1: 100, x2: 190 + modX, y2: 130 },
          { x1: 190 + modX, y1: 170, x2: 190 + modX, y2: 200 },
          { x1: 270 + modX, y1: 100, x2: 270 + modX, y2: 130 },
          { x1: 270 + modX, y1: 170, x2: 270 + modX, y2: 200 }
        ]
      };
    } else if (category === 'monument') {
      base = {
        zones: [
          { id: 'entry', label: 'Ticket Scanning', type: 'entry', x: 260 + modX, y: 220, w: 80, h: 60, cap: 400, area: 200 },
          { id: 'queue', label: 'Outer Gardens Plaza', type: 'congregation', x: 80 - modW/2, y: 90 + modY, w: 440 + modW, h: 120, cap: 3000, area: 1300 },
          { id: 'bottleneck', label: 'Mausoleum Stairs', type: 'bottleneck', x: 260 + modX, y: 40 + modY, w: 80, h: 40 + gateMod, cap: 100, area: 50, gateWidth: 1.5 },
          { id: 'exit', label: 'Palace Gardens Exit', type: 'exit', x: 80, y: 10, w: 150, h: 60, cap: 600, area: 300 }
        ],
        walls: [
          { x1: 80 - modW/2, y1: 90 + modY, x2: 250 + modX, y2: 90 + modY },
          { x1: 350 + modX, y1: 90 + modY, x2: 520 + modW/2, y2: 90 + modY },
          { x1: 80 - modW/2, y1: 210 + modY, x2: 250 + modX, y2: 210 + modY },
          { x1: 350 + modX, y1: 210 + modY, x2: 520 + modW/2, y2: 210 + modY },
          { x1: 80 - modW/2, y1: 90 + modY, x2: 80 - modW/2, y2: 210 + modY },
          { x1: 520 + modW/2, y1: 90 + modY, x2: 520 + modW/2, y2: 210 + modY },
          { x1: 230 + modX, y1: 220 + modY, x2: 260 + modX, y2: 250 + modY },
          { x1: 370 + modX, y1: 220 + modY, x2: 340 + modX, y2: 250 + modY }
        ]
      };
    } else {
      // festival
      base = {
        zones: [
          { id: 'entry', label: 'Entry Barricades', type: 'entry', x: 20, y: 90 + modY, w: 70, h: 120, cap: 500, area: 250 },
          { id: 'queue', label: 'Main Pandal Arena', type: 'congregation', x: 110, y: 40 - modY, w: 270 + modW, h: 220, cap: 3500, area: 1500 },
          { id: 'bottleneck', label: 'Darshan Stage Ramp', type: 'bottleneck', x: 390 + modW, y: 110, w: 50, h: 80 + gateMod, cap: 200, area: 90, gateWidth: 2.5 },
          { id: 'exit', label: 'Wide Outflow Path', type: 'exit', x: 460 + modW, y: 70, w: 120, h: 160, cap: 1500, area: 750 }
        ],
        walls: [
          { x1: 100, y1: 40 - modY, x2: 380 + modW, y2: 40 - modY },
          { x1: 100, y1: 260 - modY, x2: 380 + modW, y2: 260 - modY },
          { x1: 100, y1: 40 - modY, x2: 100, y2: 80 - modY },
          { x1: 100, y1: 220 - modY, x2: 100, y2: 260 - modY },
          { x1: 380 + modW, y1: 40 - modY, x2: 380 + modW, y2: 100 - modY },
          { x1: 380 + modW, y1: 200 - modY + gateMod, x2: 380 + modW, y2: 260 - modY }
        ]
      };
    }

    // Add extra random pillars based on hash
    const numPillars = (hash % 3) + 1;
    for(let p = 0; p < numPillars; p++) {
       const px = 150 + ((hash * (p+1)) % 200);
       const py = 70 + ((hash * (p+2)) % 150);
       base.walls.push({ x1: px, y1: py, x2: px, y2: py + 20 });
    }

    return base;
  };

  const layout = getLayout(location);

  // Initialize and run the simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId = null;

    // Reset particles on location change
    stateRef.current.particles = [];
    stateRef.current.ticks = 0;
    stateRef.current.lastTickTime = Date.now();

    // Spawning function
    const spawnParticle = (layout) => {
      const entryZone = layout.zones.find(z => z.type === 'entry');
      if (!entryZone) return null;

      // Spawn on the left edge of entry zone
      const x = entryZone.x + Math.random() * 15;
      const y = entryZone.y + Math.random() * entryZone.h;
      
      const r = Math.random();
      let aType = 'Standard';
      let aColor = '#6366f1';
      let aRadius = 2.5 + Math.random();
      let aSpeed = 1.2 + Math.random() * 0.8;
      
      if (r < 0.05) { aType = 'Child'; aRadius = 1.5; aColor = '#f472b6'; aSpeed *= 1.3; }
      else if (r < 0.10) { aType = 'Elderly'; aRadius = 3.0; aColor = '#9ca3af'; aSpeed *= 0.6; }
      else if (r < 0.15) { aType = 'VIP'; aRadius = 3.5; aColor = '#fbbf24'; aSpeed *= 0.9; }
      else if (r < 0.20) { aType = 'Security'; aRadius = 4.0; aColor = '#ef4444'; aSpeed *= 1.1; }
      else if (r < 0.23) { aType = 'Medical'; aRadius = 3.5; aColor = '#22c55e'; aSpeed *= 1.0; }
      else if (r < 0.27) { aType = 'Staff'; aRadius = 3.0; aColor = '#f97316'; aSpeed *= 1.4; }
      else if (r < 0.30) { aType = 'Volunteer'; aRadius = 3.0; aColor = '#eab308'; aSpeed *= 1.2; }

      return {
        x,
        y,
        vx: 0.5 + Math.random() * 0.5,
        vy: (Math.random() - 0.5) * 0.2,
        radius: aRadius,
        color: aColor,
        baseColor: aColor,
        speed: aSpeed,
        agentType: aType,
        zone: 'entry',
        desiredDirection: { x: 1, y: 0 }
      };
    };

    // Pre-populate particles to immediately show zone activity
    if (stateRef.current.particles.length === 0) {
      const pCount = Math.floor(150 * location.riskMultiplier);
      for (let i = 0; i < pCount; i++) {
        const p = spawnParticle(layout);
        if (p) {
          // distribute randomly across active zones
          const activeZones = layout.zones.filter(z => ['entry', 'queue', 'bottleneck', 'congregation'].includes(z.type) || ['queue', 'bottleneck'].includes(z.id));
          if (activeZones.length > 0) {
            const z = activeZones[Math.floor(Math.random() * activeZones.length)];
            p.x = z.x + Math.random() * z.w;
            p.y = z.y + Math.random() * z.h;
            p.zone = z.id;
          }
          stateRef.current.particles.push(p);
        }
      }
      // Force an immediate metrics emission on the next frame
      stateRef.current.ticks = 24; 
    }

    // Main physics and render loop
    const loop = () => {
      if (!isRunning) {
        // Draw static frame
        draw(ctx, layout);
        animationId = requestAnimationFrame(loop);
        return;
      }

      const active = stateRef.current.activeControls;
      const mult = stateRef.current.multiplier;
      const particles = stateRef.current.particles;

      // 1. Spawning Logic
      let spawnRate = (location.hourlyInflow / 3600) * 1.5 * mult * location.riskMultiplier; // agents per frame average
      
      // Control Action: Pause Inflow
      if (active.some(c => c.toLowerCase().includes('pause') || c.toLowerCase().includes('restrict'))) {
        spawnRate *= 0.15; // reduce ingress by 85%
      }
      
      if (Math.random() < spawnRate) {
        const p = spawnParticle(layout);
        if (p && particles.length < 500) {
          particles.push(p);
        }
      }

      // 2. Physics & Social Forces
      const entryZone = layout.zones.find(z => z.type === 'entry');
      const queueZone = layout.zones.find(z => z.id === 'queue');
      const bZone = layout.zones.find(z => z.type === 'bottleneck');
      const exitZone = layout.zones.find(z => z.type === 'exit');

      // Check bottleneck modification by control room actions
      let bottleneckWidth = bZone.h;
      let bottleneckOpen = true;

      // Control Action: Open Auxiliary Gate
      const hasAuxGate = active.some(c => c.toLowerCase().includes('auxiliary') || c.toLowerCase().includes('open emergency') || c.toLowerCase().includes('open side'));
      
      // Control Action: Limit Darshan Rate
      const isRestricted = active.some(c => c.toLowerCase().includes('restrict') || c.toLowerCase().includes('stagger') || c.toLowerCase().includes('batch'));
      if (isRestricted) {
        bottleneckWidth *= 0.4; // squeeze the gate
      }
      if (hasAuxGate) {
        bottleneckWidth *= 1.8; // widen path or simulate dual routes
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Determine current zone
        let currZone = 'outside';
        if (entryZone && isInRect(p.x, p.y, entryZone)) currZone = 'entry';
        else if (queueZone && isInRect(p.x, p.y, queueZone)) currZone = 'queue';
        else if (bZone && isInRect(p.x, p.y, bZone)) currZone = 'bottleneck';
        else if (exitZone && isInRect(p.x, p.y, exitZone)) currZone = 'exit';
        p.zone = currZone;

        // Pathfinding: Calculate target coordinate based on current zone
        let targetX = width + 50;
        let targetY = height / 2;

        if (currZone === 'entry') {
          // Move towards the entrance to the queue halls
          targetX = queueZone ? queueZone.x + 10 : width / 2;
          targetY = queueZone ? queueZone.y + queueZone.h / 2 : height / 2;
        } else if (currZone === 'queue') {
          // Pathfinding through queue labyrinths
          if (location.category === 'temple') {
            // Simulated zig-zag path corners
            if (p.x < 140) {
              targetX = 120;
              targetY = 230; // move down lane 1
              if (p.y > 210) { targetX = 170; } // turn corner
            } else if (p.x < 200) {
              targetX = 175;
              targetY = 70; // move up lane 2
              if (p.y < 90) { targetX = 230; } // turn corner
            } else if (p.x < 260) {
              targetX = 230;
              targetY = 230; // move down lane 3
              if (p.y > 210) { targetX = 290; } // turn corner
            } else {
              targetX = bZone ? bZone.x - 10 : width - 100;
              targetY = bZone ? bZone.y + bZone.h / 2 : height / 2; // move to bottleneck gate
            }
          } else {
            // General congregation pathing towards bottleneck
            targetX = bZone ? bZone.x - 5 : width - 100;
            targetY = bZone ? bZone.y + bZone.h / 2 + (Math.sin(p.x * 0.05) * 20) : height / 2;
          }
        } else if (currZone === 'bottleneck') {
          // Direct straight passage through gate
          targetX = exitZone ? exitZone.x + 10 : width - 50;
          targetY = exitZone ? exitZone.y + exitZone.h / 2 : height / 2;
        } else if (currZone === 'exit') {
          // Leave layout
          targetX = width + 50;
          targetY = p.y;
        }

        // Vector pointing to target
        let dx = targetX - p.x;
        let dy = targetY - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
          p.desiredDirection = { x: dx / dist, y: dy / dist };
        }

        // Apply drive force
        let targetVx = p.desiredDirection.x * p.speed;
        let targetVy = p.desiredDirection.y * p.speed;

        // Slow down in queue/bottleneck if congested
        if (currZone === 'queue' || currZone === 'bottleneck') {
          p.vx += (targetVx - p.vx) * 0.08;
          p.vy += (targetVy - p.vy) * 0.08;
        } else {
          p.vx += (targetVx - p.vx) * 0.15;
          p.vy += (targetVy - p.vy) * 0.15;
        }

        // 3. Social Force: Repulsion between agents
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const rx = p.x - other.x;
          const ry = p.y - other.y;
          const rDist = Math.sqrt(rx * rx + ry * ry);
          const minDist = p.radius + other.radius + 3; // buffer

          if (rDist < minDist) {
            const overlap = minDist - rDist;
            const repForce = (overlap / minDist) * 0.7; // repulsion factor
            const forceX = (rDist > 0.1 ? rx / rDist : Math.random() - 0.5) * repForce;
            const forceY = (rDist > 0.1 ? ry / rDist : Math.random() - 0.5) * repForce;

            p.vx += forceX;
            p.vy += forceY;
            other.vx -= forceX;
            other.vy -= forceY;
          }
        }

        // 4. Wall repulsion/avoidance
        layout.walls.forEach(w => {
          const wallVectorX = w.x2 - w.x1;
          const wallVectorY = w.y2 - w.y1;
          const wallLength = Math.sqrt(wallVectorX * wallVectorX + wallVectorY * wallVectorY);
          
          if (wallLength < 0.1) return;
          const uX = wallVectorX / wallLength;
          const uY = wallVectorY / wallLength;

          // Projection
          const pToStartX = p.x - w.x1;
          const pToStartY = p.y - w.y1;
          const proj = pToStartX * uX + pToStartY * uY;
          const clampedProj = Math.max(0, Math.min(wallLength, proj));

          const closestX = w.x1 + clampedProj * uX;
          const closestY = w.y1 + clampedProj * uY;

          const toClosestX = p.x - closestX;
          const toClosestY = p.y - closestY;
          const distToWall = Math.sqrt(toClosestX * toClosestX + toClosestY * toClosestY);

          const wallMinDist = p.radius + 4; // wall safety margin
          if (distToWall < wallMinDist) {
            const overlap = wallMinDist - distToWall;
            const forceVal = (overlap / wallMinDist) * 1.5;
            p.vx += (distToWall > 0.1 ? toClosestX / distToWall : 0) * forceVal;
            p.vy += (distToWall > 0.1 ? toClosestY / distToWall : 1) * forceVal;
          }
        });

        // Squeeze barrier bottleneck checks
        if (currZone === 'queue' && p.x > bZone.x - 5 && p.x < bZone.x) {
          // Restrict y limits to bottleneck gate
          const gateTop = bZone.y + (bZone.h - bottleneckWidth) / 2;
          const gateBottom = gateTop + bottleneckWidth;
          if (p.y < gateTop) {
            p.vy += (gateTop - p.y) * 0.1;
            p.vx -= 0.1;
          } else if (p.y > gateBottom) {
            p.vy += (gateBottom - p.y) * 0.1;
            p.vx -= 0.1;
          }
        }

        // Apply velocity limits
        const speedCap = p.speed * 1.5;
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > speedCap) {
          p.vx = (p.vx / currentSpeed) * speedCap;
          p.vy = (p.vy / currentSpeed) * speedCap;
        }

        // Step coordinates
        p.x += p.vx;
        p.y += p.vy;

        // Keep inside bounds
        p.x = Math.max(5, Math.min(width - 5, p.x));
        p.y = Math.max(5, Math.min(height - 5, p.y));

        // Color coding by zone risk or speed
        p.color = p.baseColor;
        if (p.zone === 'bottleneck') {
          p.color = '#ef4444';
        } else if (p.zone === 'queue') {
          // Turn yellow/red based on speed (stagnancy indicator)
          const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (sp < 0.2) p.color = '#ef4444'; // stuck / compact
          else if (sp < 0.6 && p.agentType === 'Standard') p.color = '#fbbf24'; // slow queue
        }
      }

      // Remove particles that exited the layout
      stateRef.current.particles = particles.filter(p => p.x < width - 10);

      // 5. Calculate Zone Metrics & Broadcast
      stateRef.current.ticks++;
      if (stateRef.current.ticks % 25 === 0) { // every ~0.5s run analytics
        computeAndEmitMetrics(layout, particles, location, mult, onTickData);
      }

      // 6. Draw everything
      if(stateRef.current.ticks % 2 === 0) {
        draw(ctx, layout);
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [location, isRunning, layout]);

  // Utility checking rect contain
  const isInRect = (px, py, rect) => {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  };

  const computeAndEmitMetrics = (layout, particles, location, multiplier, onDataCallback) => {
    if (!onDataCallback) return;
    const now = Date.now();
    const elapsed = (now - stateRef.current.lastTickTime) / 1000;

    const zoneCounts = { entry: 0, queue: 0, bottleneck: 0, exit: 0 };
    particles.forEach(p => {
      if (zoneCounts[p.zone] !== undefined) {
        zoneCounts[p.zone]++;
      }
    });

    const active = stateRef.current.activeControls;
    const isEvac = active.some(c => c.toLowerCase().includes('evacuate'));

    const zoneAlerts = {};
    let totalAgents = particles.length;

    // Convert particle count to simulated real-world people & density (p/m²)
    // 1 agent on screen represents ~5-20 people in real-world based on location.baseCapacity
    const scaleFactor = (location.baseCapacity / 300) * multiplier;

    layout.zones.forEach(z => {
      const rawCount = zoneCounts[z.id];
      const simulatedCount = Math.floor(rawCount * scaleFactor);
      
      // Calculate density: simulated people / zone area
      let density = simulatedCount / z.area;
      
      // Add artificial crowd scaling factor to dynamic location configs
      if (z.id === 'queue') {
        density *= 1.25; 
      }
      if (z.id === 'bottleneck') {
        density *= 1.4;
      }
      
      // Smooth density out
      density = Math.round(density * 100) / 100;

      // Assign Fruin LoS category based on density
      let fruin = 'A';
      if (density >= 5.4) fruin = 'F';
      else if (density >= 3.86) fruin = 'E';
      else if (density >= 1.54) fruin = 'D';
      else if (density >= 0.93) fruin = 'C';
      else if (density >= 0.54) fruin = 'B';

      // Compute Zone Risk Score (0-100)
      let riskScore = 0;
      if (fruin === 'A') riskScore = Math.floor((density / 0.54) * 20);
      else if (fruin === 'B') riskScore = 20 + Math.floor(((density - 0.54) / 0.39) * 20);
      else if (fruin === 'C') riskScore = 40 + Math.floor(((density - 0.93) / 0.61) * 15);
      else if (fruin === 'D') riskScore = 55 + Math.floor(((density - 1.54) / 2.32) * 20);
      else if (fruin === 'E') riskScore = 75 + Math.floor(((density - 3.86) / 1.54) * 15);
      else riskScore = 90 + Math.min(10, Math.floor((density - 5.4) * 2));

      riskScore = Math.min(100, Math.max(0, riskScore));

      // Overrides by control actions
      if (isEvac) {
        riskScore = Math.max(riskScore - 15, 0); // show reduction in risk
      }

      // Severity levels
      let severity = 'NORMAL';
      if (riskScore >= 90) severity = 'EVACUATE';
      else if (riskScore >= 75) severity = 'CRITICAL';
      else if (riskScore >= 55) severity = 'WARNING';
      else if (riskScore >= 40) severity = 'WATCH';

      // Live Actionable Recommendations
      let recommendation = "Monitor density flow. Maintain volunteer presence.";
      let alertMsg = "";

      if (severity === 'WATCH') {
        recommendation = `Density is building. Ready side corridors. Action suggested: ${location.actions[2] || "Monitor gates"}.`;
        alertMsg = `Zone ${z.label} approaching stable flow capacity threshold.`;
      } else if (severity === 'WARNING') {
        recommendation = `Congestion visible. Restrict entry rate immediately! Recommendation: ${location.actions[0] || "Stagger queues"}.`;
        alertMsg = `Zone ${z.label} bottleneck risk detected. Tight flow constraints.`;
      } else if (severity === 'CRITICAL') {
        recommendation = `CRITICAL CROWD DENSITY! Open emergency exits! Action Required: ${location.actions[1] || "Open auxiliary gates"}.`;
        alertMsg = `CRITICAL: Crush hazard imminent in ${z.label}! Fruin LoS E reached.`;
      } else if (severity === 'EVACUATE') {
        recommendation = "EMERGENCY: Immediate evacuation order. Sound warning alerts. Clear all physical obstructions.";
        alertMsg = `DANGER: Stampede warning triggered! Active overcrowding in ${z.label}.`;
      }

      // Forecast building: simulate a simple trend forecasting
      let forecastDensity = density;
      if (isRunning && !isEvac) {
        // Project crowd density based on current speed and queue density
        const trend = (zoneCounts.queue / 20) * 0.15 * location.riskMultiplier;
        forecastDensity = Math.round((density + trend * 5) * 100) / 100;
      }

      // Time to LoS F
      let timeToCritical = null;
      if (severity === 'WARNING' || severity === 'CRITICAL') {
        const remaining = 5.4 - density;
        if (remaining > 0) {
          const secs = Math.ceil((remaining / 0.15) * 10);
          timeToCritical = secs > 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
        } else {
          timeToCritical = "Immediate";
        }
      }

      zoneAlerts[z.id] = {
        zone_id: z.id,
        zone_name: z.label,
        fruin_level: fruin,
        risk_score: riskScore,
        severity,
        color: LOS_COLORS[fruin],
        density,
        forecast_density: forecastDensity,
        time_to_critical: timeToCritical,
        alert_message: alertMsg,
        recommended_action: recommendation
      };
    });

    // Compute overall severity
    const maxScore = Math.max(...Object.values(zoneAlerts).map(z => z.risk_score), 0);
    let overall = "NORMAL";
    if (maxScore >= 90) overall = "EVACUATE";
    else if (maxScore >= 75) overall = "CRITICAL";
    else if (maxScore >= 55) overall = "WARNING";
    else if (maxScore >= 40) overall = "WATCH";

    onDataCallback({
      type: 'tick',
      tick: stateRef.current.ticks,
      sim_time: Math.floor(stateRef.current.ticks / 2),
      alerts: zoneAlerts,
      overall_severity: overall,
      total_agents: Math.floor(totalAgents * scaleFactor)
    });
  };

  // Rendering graphics on Canvas
  const draw = (ctx, layout) => {
    const catColors = {
      temple: { grid: 'rgba(251, 191, 36, 0.1)', bg: 'rgba(20, 15, 5, 0.8)', wall: '#fbbf24', wallFill: 'rgba(251, 191, 36, 0.25)', trail: 'rgba(20, 15, 5, 0.4)' },
      transit: { grid: 'rgba(99, 102, 241, 0.1)', bg: 'rgba(5, 5, 15, 0.8)', wall: '#818cf8', wallFill: 'rgba(99, 102, 241, 0.25)', trail: 'rgba(5, 5, 15, 0.4)' },
      monument: { grid: 'rgba(6, 182, 212, 0.1)', bg: 'rgba(5, 15, 20, 0.8)', wall: '#22d3ee', wallFill: 'rgba(6, 182, 212, 0.25)', trail: 'rgba(5, 15, 20, 0.4)' },
      festival: { grid: 'rgba(236, 72, 153, 0.1)', bg: 'rgba(20, 5, 15, 0.8)', wall: '#f472b6', wallFill: 'rgba(236, 72, 153, 0.25)', trail: 'rgba(20, 5, 15, 0.4)' }
    };
    const cTheme = catColors[location.category] || catColors.transit;

    // Use a trail effect by filling with semi-transparent background, instead of clearRect
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = cTheme.trail;
    ctx.fillRect(0, 0, width, height);

    // Global composite operation for glowing elements
    ctx.globalCompositeOperation = 'screen';
    
    // Draw pulsing background grids
    const pulseOffset = (Date.now() / 20) % 20;
    
    ctx.strokeStyle = cTheme.grid;
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = pulseOffset; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = pulseOffset; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw Zones bounding boxes
    ctx.globalCompositeOperation = 'source-over';
    layout.zones.forEach(z => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(z.x, z.y, z.w, z.h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.fillText(z.label.toUpperCase(), z.x + 6, z.y + 16);
    });

    // 3. Draw physical 3D Extruded walls
    layout.walls.forEach(w => {
      const depth = 20; // 3D depth

      // Wall Face Fill
      ctx.fillStyle = cTheme.wallFill;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.lineTo(w.x2 - depth, w.y2 - depth);
      ctx.lineTo(w.x1 - depth, w.y1 - depth);
      ctx.fill();

      // Top glowing edge
      ctx.strokeStyle = cTheme.wall;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.x1 - depth, w.y1 - depth);
      ctx.lineTo(w.x2 - depth, w.y2 - depth);
      ctx.stroke();
      
      // Corner connecting edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = cTheme.wall;
      ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x1 - depth, w.y1 - depth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w.x2, w.y2); ctx.lineTo(w.x2 - depth, w.y2 - depth); ctx.stroke();
    });

    // Draw active gates / exits indicators
    const bZone = layout.zones.find(z => z.type === 'bottleneck');
    if (bZone) {
      ctx.strokeStyle = '#ef4444'; // red bottleneck gate line
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bZone.x, bZone.y);
      ctx.lineTo(bZone.x, bZone.y + bZone.h);
      ctx.stroke();
    }

    // 4. Draw Particles (People)
    ctx.globalCompositeOperation = 'screen';
    const particles = stateRef.current.particles;
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      
      if (p.agentType === 'Security' || p.agentType === 'Medical') {
        ctx.rect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      } else if (p.agentType === 'Staff' || p.agentType === 'Volunteer') {
        ctx.moveTo(p.x, p.y - p.radius);
        ctx.lineTo(p.x + p.radius, p.y + p.radius);
        ctx.lineTo(p.x - p.radius, p.y + p.radius);
        ctx.closePath();
      } else {
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      ctx.fill();

      // Shadow glow for stuck particles or VIPs
      if (p.color === '#ef4444' || p.agentType === 'VIP') {
        ctx.fillStyle = p.agentType === 'VIP' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0; // reset
    });
    ctx.globalCompositeOperation = 'source-over';

    // 5. Draw active indicators on canvas (Control Overlays)
    const active = stateRef.current.activeControls;
    if (active.length > 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
      ctx.fillRect(8, height - 24, 18, 16);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText("AI", 13, height - 13);
      
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1;
      ctx.fillRect(32, height - 24, 250, 16);
      ctx.strokeRect(32, height - 24, 250, 16);

      ctx.fillStyle = '#a5b4fc';
      ctx.font = '600 8px Inter, system-ui, sans-serif';
      ctx.fillText(`ACTIVE MITIGATION: ${active[0]}`, 38, height - 13);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* HUD Bar */}
      <div style={{
        position: 'absolute', top: 10, left: 10, right: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(10, 10, 18, 0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
        padding: '6px 12px', pointerEvents: 'none', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isRunning ? '#22c55e' : '#64748b',
            animation: isRunning ? 'pulse-dot 1s infinite' : 'none'
          }}/>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#f0f0ff' }}>
            {isRunning ? 'Real-Time Physics Feed' : 'Feed Paused'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', gap: 10 }}>
          <span>Scale: 1px = 12cm</span>
          <span>Category: <strong style={{ color: '#a5b4fc', textTransform: 'capitalize' }}>{location.category}</strong></span>
        </div>
      </div>

      <div style={{
        perspective: '1200px',
        width: '100%',
        padding: '20px 0 40px'
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 12,
            border: '2px solid rgba(99, 102, 241, 0.2)',
            background: 'transparent',
            display: 'block',
            transform: 'rotateX(55deg) rotateZ(-25deg)',
            boxShadow: '-30px 40px 60px rgba(0,0,0,0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
            transformStyle: 'preserve-3d',
            mixBlendMode: 'screen',
            transition: 'transform 0.5s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}
