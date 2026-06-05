/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { PlantStoryboard, PlayerSettings } from "../types";

interface PlantVideoCanvasProps {
  storyboard: PlantStoryboard;
  settings: PlayerSettings;
  onBloomTriggered?: () => void;
}

export default function PlantVideoCanvas({
  storyboard,
  settings,
  onBloomTriggered,
}: PlantVideoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const lastBloomRef = useRef<boolean>(false);

  // Pollen particle system state
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; l: number; maxL: number; r: number; color: string }>>([]);

  // Resize handler utilizing ResizeObserver as required
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 320),
          height: Math.max(height, 240),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to interpolate keyframe values based on currentTime
  const getInterpolatedState = () => {
    const { stages } = storyboard;
    if (stages.length === 0) {
      return {
        title: "",
        narration: "",
        growthRatio: 0,
        rootRatio: 0,
        flowerBloom: 0,
        leafCount: 0,
        particleIntensity: 0,
        windSway: 0,
      };
    }

    const t = Math.min(Math.max(settings.currentTime, 0), 15);

    // Find bounding stages
    let lower = stages[0];
    let upper = stages[stages.length - 1];

    for (let i = 0; i < stages.length - 1; i++) {
      if (stages[i].time <= t && stages[i + 1].time >= t) {
        lower = stages[i];
        upper = stages[i + 1];
        break;
      }
    }

    const timeDiff = upper.time - lower.time;
    const k = timeDiff === 0 ? 0 : (t - lower.time) / timeDiff;

    return {
      title: lower.title !== upper.title && k > 0.5 ? upper.title : lower.title,
      narration: lower.narration !== upper.narration && k > 0.4 ? upper.narration : lower.narration,
      growthRatio: lower.growthRatio + (upper.growthRatio - lower.growthRatio) * k,
      rootRatio: lower.rootRatio + (upper.rootRatio - lower.rootRatio) * k,
      flowerBloom: lower.flowerBloom + (upper.flowerBloom - lower.flowerBloom) * k,
      leafCount: Math.round(lower.leafCount + (upper.leafCount - lower.leafCount) * k),
      particleIntensity: lower.particleIntensity + (upper.particleIntensity - lower.particleIntensity) * k,
      windSway: lower.windSway + (upper.windSway - lower.windSway) * k,
    };
  };

  // Main Canvas Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const state = getInterpolatedState();

    // Trigger flower bloom sound effect hook
    if (state.flowerBloom > 0.4 && !lastBloomRef.current) {
      lastBloomRef.current = true;
      if (onBloomTriggered) onBloomTriggered();
    } else if (state.flowerBloom < 0.2) {
      lastBloomRef.current = false;
    }

    // Maintain and feed the glowing wind/pollen particles
    const updateParticles = (intensity: number) => {
      const pArr = particlesRef.current;
      const count = Math.min(Math.round(intensity * 0.4), 80);

      // Spawn new particles
      if (pArr.length < count && Math.random() < 0.3) {
        pArr.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height * 0.7,
          vx: (Math.random() - 0.5) * 1 + settings.windSpeed * 1.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.2,
          l: 0,
          maxL: 60 + Math.random() * 80,
          r: 1 + Math.random() * 3,
          color: storyboard.flowerColor,
        });
      }

      // Update position and filter out dead
      particlesRef.current = pArr
        .map((p) => {
          p.x += p.vx + Math.sin(Date.now() * 0.005 + p.y) * 0.2;
          p.y += p.vy;
          p.l += 1;
          return p;
        })
        .filter((p) => p.l < p.maxL && p.x >= 0 && p.x <= dimensions.width && p.y >= 0 && p.y <= dimensions.height);
    };

    const draw = () => {
      const state = getInterpolatedState();
      updateParticles(state.particleIntensity);

      // 1. CLEAR & SKY BACKGROUND GRADIENT
      const bgGrad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
      bgGrad.addColorStop(0, storyboard.bgColor); // customized biological deep background
      bgGrad.addColorStop(0.7, "#141526"); // transitional twilight
      bgGrad.addColorStop(1, "#1E1E38"); // dense base atmospheric tone
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // 2. SUNLIGHT CONE EFFECT
      const sunCenterX = dimensions.width * 0.8;
      const sunCenterY = dimensions.height * 0.15;
      const sunPulse = 1.0 + Math.sin(Date.now() * 0.002) * 0.08;
      const sunRad = 180 * settings.sunIntensity * sunPulse;

      const sunGrad = ctx.createRadialGradient(
        sunCenterX,
        sunCenterY,
        10,
        sunCenterX,
        sunCenterY,
        sunRad
      );
      sunGrad.addColorStop(0, "rgba(253, 224, 71, 0.25)"); // high radiation yellow core
      sunGrad.addColorStop(0.4, "rgba(251, 146, 60, 0.08)"); // golden warm halo
      sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // 3. SOIL HORIZON BASE (Bottom 28% of height)
      const soilY = dimensions.height * 0.72;
      const soilGrad = ctx.createLinearGradient(0, soilY, 0, dimensions.height);
      soilGrad.addColorStop(0, "#271C19"); // top rich dry humus
      soilGrad.addColorStop(0.3, "#1F1512"); // deep layer
      soilGrad.addColorStop(1, "#150E0C"); // deep compression strata
      ctx.fillStyle = soilGrad;

      // Draw soil surface with a beautiful organic curved topography
      ctx.beginPath();
      ctx.moveTo(0, dimensions.height);
      ctx.lineTo(0, soilY);
      for (let x = 0; x <= dimensions.width; x += 10) {
        const organicCurve = Math.sin(x * 0.015) * 6 + Math.cos(x * 0.035) * 3;
        ctx.lineTo(x, soilY + organicCurve);
      }
      ctx.lineTo(dimensions.width, dimensions.height);
      ctx.closePath();
      ctx.fill();

      // Soil texture details
      ctx.fillStyle = "rgba(100, 75, 60, 0.18)";
      for (let i = 0; i < 40; i++) {
        const tx = (Math.sin(i * 37) + 1) * 0.5 * dimensions.width;
        const ty = soilY + 5 + (Math.cos(i * 19) + 1) * 0.5 * (dimensions.height - soilY - 10);
        ctx.beginPath();
        ctx.arc(tx, ty, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
        // A couple of soil organic root fibers
        ctx.strokeStyle = "rgba(180, 150, 120, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.sin(i) * 15, ty + 10);
        ctx.stroke();
      }

      // Draw central anchor base
      const centerX = dimensions.width * 0.5;

      // 4. SUBTERRANEAN ROOT SYSTEM (Grows downward, branching elegantly)
      if (state.rootRatio > 0.01) {
        ctx.save();
        ctx.strokeStyle = "rgba(224, 190, 160, 0.85)"; // rich pale capillary cream
        ctx.lineWidth = 2.5 * (1.0 - state.rootRatio * 0.4);
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(220, 180, 150, 0.3)";

        const renderRootNode = (fromX: number, fromY: number, length: number, angle: number, depth: number) => {
          if (depth > 3) return;
          const radialReach = length * state.rootRatio;
          const toX = fromX + Math.sin(angle) * radialReach;
          const toY = fromY + Math.cos(angle) * radialReach;

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          // Spline root curvature for organic structural growth
          const midX = fromX + Math.sin(angle) * radialReach * 0.5 + (Math.random() - 0.5) * 6;
          const midY = fromY + Math.cos(angle) * radialReach * 0.5;
          ctx.quadraticCurveTo(midX, midY, toX, toY);
          ctx.stroke();

          // Sprout sub-capillary roots recursively
          if (state.rootRatio > 0.25) {
            renderRootNode(toX, toY, length * 0.7, angle - 0.4 - Math.random() * 0.2, depth + 1);
            renderRootNode(toX, toY, length * 0.7, angle + 0.4 + Math.random() * 0.2, depth + 1);
          }
        };

        // Anchor taps
        renderRootNode(centerX, soilY, dimensions.height * 0.2, 0.05, 1);
        renderRootNode(centerX, soilY, dimensions.height * 0.16, -0.35, 1);
        renderRootNode(centerX, soilY, dimensions.height * 0.16, 0.45, 1);
        ctx.restore();
      }

      // 5. AERIAL STEM SHOOT (Swaying dynamically based on time & wind physics)
      const stemHeight = dimensions.height * 0.48 * state.growthRatio;
      const swayPeriod = Date.now() * 0.003;
      const maxSwayOffset = Math.sin(swayPeriod) * state.windSway * 35 * settings.windSpeed;
      const tipX = centerX + maxSwayOffset;
      const tipY = soilY - stemHeight;

      if (state.growthRatio > 0.01) {
        ctx.save();
        ctx.strokeStyle = storyboard.primaryColor;
        ctx.lineWidth = Math.max(3.0, 7.5 * (1.0 - state.growthRatio * 0.5));
        ctx.lineCap = "round";

        // Curved stem utilizing organic quadratic Bezier coordinates
        ctx.beginPath();
        ctx.moveTo(centerX, soilY);
        const ctrlX = centerX + maxSwayOffset * 0.5;
        const ctrlY = soilY - stemHeight * 0.5;
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        ctx.stroke();

        // 6. FOLIAGE / LEAVES SPATIAL ARRANGEMENT
        const totalLeaves = state.leafCount;
        ctx.fillStyle = storyboard.primaryColor;
        for (let i = 0; i < totalLeaves; i++) {
          // Calculate node along the stem curve using Quadratic Bezier formula (t from 0 to 1)
          const leafTimeFraction = (i + 1) / (totalLeaves + 1); // skip base and tip
          const stemT = leafTimeFraction * state.growthRatio; // progressive leaf unfold

          const nodeX = (1 - stemT) * (1 - stemT) * centerX + 2 * (1 - stemT) * stemT * ctrlX + stemT * stemT * tipX;
          const nodeY = (1 - stemT) * (1 - stemT) * soilY + 2 * (1 - stemT) * stemT * ctrlY + stemT * stemT * tipY;

          const side = i % 2 === 0 ? 1 : -1;
          const lAngle = (side * Math.PI) / 4 + Math.sin(swayPeriod + i) * 0.05 * settings.windSpeed;
          const leafLen = Math.max(8, 22 * state.growthRatio);

          ctx.save();
          ctx.translate(nodeX, nodeY);
          ctx.rotate(lAngle);

          // Render elliptical biological leaf shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(leafLen * 0.5 * side, -leafLen * 0.4, leafLen * side, 0);
          ctx.quadraticCurveTo(leafLen * 0.5 * side, leafLen * 0.4, 0, 0);
          ctx.closePath();
          ctx.fill();

          // Leaf vein overlay
          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(leafLen * 0.8 * side, 0);
          ctx.stroke();

          ctx.restore();
        }
        ctx.restore();
      }

      // 7. THE SEED HUSK SPLITTING
      if (state.growthRatio < 0.4) {
        ctx.save();
        ctx.fillStyle = "#5c4033"; // seed shell brown
        ctx.strokeStyle = "#3d2a21";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 2;

        const leftHuskX = centerX - 6 * (1.0 - state.growthRatio * 2);
        const rightHuskX = centerX + 6 * (1.0 - state.growthRatio * 2);
        const huskY = soilY - 2;

        // Split husk segments
        ctx.beginPath();
        ctx.arc(leftHuskX, huskY, 5, Math.PI * 0.5, Math.PI * 1.5, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rightHuskX, huskY, 5, Math.PI * 1.5, Math.PI * 0.5, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // 8. APEX FLOWER BUD & BLOSSOM
      if (state.growthRatio > 0.4 && state.flowerBloom > 0.02) {
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(Math.sin(swayPeriod) * state.windSway * 0.4 * settings.windSpeed);

        const bloomScale = state.flowerBloom;
        const petalRadius = 26 * bloomScale;
        const petalCount = 8;

        // Radial shadow glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = storyboard.flowerColor;

        // Draw multiple backing petals
        ctx.fillStyle = storyboard.flowerColor;
        for (let pIdx = 0; pIdx < petalCount; pIdx++) {
          const petalAngle = (pIdx * Math.PI * 2) / petalCount + (Date.now() * 0.0003);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const cp1X = Math.cos(petalAngle - 0.3) * petalRadius * 0.6;
          const cp1Y = Math.sin(petalAngle - 0.3) * petalRadius * 0.6;
          const cp2X = Math.cos(petalAngle + 0.3) * petalRadius * 0.6;
          const cp2Y = Math.sin(petalAngle + 0.3) * petalRadius * 0.6;
          const endX = Math.cos(petalAngle) * petalRadius;
          const endY = Math.sin(petalAngle) * petalRadius;

          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
          ctx.closePath();
          ctx.fill();
        }

        // Blossom center disk disc floret core
        const coreRad = Math.max(3, 9 * bloomScale);
        const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreRad);
        coreGrad.addColorStop(0, "#F7971E"); // intense orange fire core
        coreGrad.addColorStop(1, "#FFD200"); // yellow outer halo
        ctx.fillStyle = coreGrad;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(0, 0, coreRad, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // Seed details inside disc
        if (state.flowerBloom > 0.75) {
          ctx.fillStyle = "rgba(80, 50, 10, 0.4)";
          for (let sIdx = 0; sIdx < 12; sIdx++) {
            const sx = Math.sin(sIdx * 19) * coreRad * 0.45;
            const sy = Math.cos(sIdx * 19) * coreRad * 0.45;
            ctx.beginPath();
            ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // 9. WEATHER & GLOWING ATMOSPHERIC PARTICLES
      // Dust & Pollen sparkles
      ctx.save();
      particlesRef.current.forEach((p) => {
        const glowRad = p.r * (1.1 + Math.sin(Date.now() * 0.01 + p.x) * 0.25);
        ctx.shadowBlur = p.r * 5;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRad, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // Rain Precipitation overlay
      if (settings.rainEnabled) {
        ctx.strokeStyle = "rgba(125, 211, 252, 0.35)"; // translucent rain cyan
        ctx.lineWidth = 1.2;
        const rainCount = 18;
        for (let r = 0; r < rainCount; r++) {
          const rx = (Math.sin(r * 29 + Date.now() * 0.01) + 1) * 0.5 * dimensions.width;
          const ry = ((r * 11 + Date.now() * 0.7) % dimensions.height);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 5 * settings.windSpeed, ry + 16);
          ctx.stroke();
        }
      }

      // 10. PROFESSIONAL VIDEO HUD OVERLAY FRAME (No Telemetry, only beautiful player controls look)
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, dimensions.width - 20, dimensions.height - 20);

      // Simple, elegant crosshairs in corners
      const cornerL = 12;
      const listCorners = [
        [10, 10, 1, 1],
        [dimensions.width - 10, 10, -1, 1],
        [10, dimensions.height - 10, 1, -1],
        [dimensions.width - 10, dimensions.height - 10, -1, -1],
      ];
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.2;
      listCorners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + cornerL * dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + cornerL * dx, cy);
        ctx.stroke();
      });

      // Simple video caption HUD text (Elegant & minimalistic)
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "10px monospace";
      ctx.fillText("FLORA_RENDER_SEQUENCE_15S", 22, 28);
      ctx.fillText(`${settings.currentTime.toFixed(2)}s / 15.00s`, dimensions.width - 140, 28);

      // Playback active point mark
      if (settings.isPlaying) {
        ctx.fillStyle = "#EF4444"; // recording dot look
        ctx.beginPath();
        ctx.arc(22, 38, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillText("PLAYBACK ACTIVE", 32, 41);
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillText("PAUSED", 22, 41);
      }

      ctx.restore();

      // Loop only if active
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [storyboard, settings, dimensions]);

  const state = getInterpolatedState();

  return (
    <div className="relative w-full h-full flex flex-col justify-between" ref={containerRef}>
      {/* Absolute canvas layout */}
      <canvas
        id="plantGrowthSequenceCanvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full block rounded-xl overflow-hidden cursor-crosshair shadow-inner"
      />

      {/* Narrative block at the bottom overlayed elegant glassmorphism */}
      <div className="z-10 mt-auto mx-4 mb-4 select-none pointer-events-none md:mx-6 md:mb-6 animate-fade-in">
        <div className="bg-white/90 backdrop-blur-md px-4.5 py-3.5 rounded-2xl border border-natural-border/65 max-w-xl shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] tracking-widest font-mono text-forest font-semibold uppercase">
              {state.title || "INCUBATION PHASE"}
            </span>
            <span className="text-[10px] font-mono text-natural-muted font-medium">
              +{settings.currentTime.toFixed(1)}s milestone
            </span>
          </div>
          <p className="text-xs text-natural-text/90 leading-relaxed font-sans font-light">
            {state.narration || "Awaiting sequence initialization to trigger vegetative simulation. Select a specimen."}
          </p>
        </div>
      </div>
    </div>
  );
}
