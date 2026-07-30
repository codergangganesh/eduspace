import React, { useEffect, useRef } from "react";
import { MathTheme } from "../../lib/mathGameTheme";

export type GraphicsQuality = "low" | "medium" | "high" | "ultra";
export type WeatherPreset = "auto" | "sunny" | "sunset" | "rain" | "snow" | "cyberstorm";

export interface BackgroundEvent {
  id?: string | number;
  type: "laser" | "pop" | "hit" | "miss" | "streak" | "gameover" | "level" | "pulse";
  intensity?: number; // 0.1 to 1.0
  x?: number; // percent (0-100) or pixel
  y?: number; // percent (0-100) or pixel
}

export interface AnimatedBackgroundEnvironmentProps {
  themeId: MathTheme["id"];
  quality?: GraphicsQuality;
  weatherPreset?: WeatherPreset;
  eventTrigger?: BackgroundEvent | null;
  className?: string;
  isPaused?: boolean;
  opacity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  type: "ember" | "firefly" | "leaf" | "dust" | "spark" | "splash" | "snowflake";
  phase?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface SplashRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function AnimatedBackgroundEnvironment({
  themeId,
  quality = "high",
  weatherPreset = "auto",
  eventTrigger,
  className = "",
  isPaused = false,
  opacity = 1.0,
}: AnimatedBackgroundEnvironmentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eventHandledRef = useRef<string | number | null>(null);

  // Shake & Light Pulse state
  const shakeRef = useRef(0);
  const lightPulseRef = useRef(0);
  const flashAlphaRef = useRef(0);

  // Quality multiplier mapping
  const getQualityParams = () => {
    switch (quality) {
      case "low":
        return { particleCap: 35, starCap: 40, rainCap: 30, enableGodRays: false, enableReflections: false, dprCap: 1 };
      case "medium":
        return { particleCap: 70, starCap: 70, rainCap: 60, enableGodRays: true, enableReflections: true, dprCap: 1.25 };
      case "ultra":
        return { particleCap: 180, starCap: 160, rainCap: 140, enableGodRays: true, enableReflections: true, dprCap: 2 };
      case "high":
      default:
        return { particleCap: 120, starCap: 110, rainCap: 90, enableGodRays: true, enableReflections: true, dprCap: 1.5 };
    }
  };

  // Event trigger listener
  useEffect(() => {
    if (!eventTrigger) return;
    const eventId = eventTrigger.id || `${eventTrigger.type}-${Date.now()}`;
    if (eventHandledRef.current === eventId) return;
    eventHandledRef.current = eventId;

    const intensity = eventTrigger.intensity ?? 0.5;

    switch (eventTrigger.type) {
      case "laser":
      case "pop":
        lightPulseRef.current = Math.max(lightPulseRef.current, 0.45 * intensity);
        shakeRef.current = Math.max(shakeRef.current, 4 * intensity);
        break;
      case "hit":
      case "streak":
        lightPulseRef.current = Math.max(lightPulseRef.current, 0.75 * intensity);
        shakeRef.current = Math.max(shakeRef.current, 6 * intensity);
        break;
      case "miss":
      case "gameover":
        flashAlphaRef.current = 0.35 * intensity;
        shakeRef.current = Math.max(shakeRef.current, 12 * intensity);
        break;
      case "level":
        lightPulseRef.current = 1.0;
        shakeRef.current = 8;
        break;
      case "pulse":
      default:
        lightPulseRef.current = Math.max(lightPulseRef.current, 0.3 * intensity);
        break;
    }
  }, [eventTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const qParams = getQualityParams();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, qParams.dprCap);
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Initial state setup
    const stars: Star[] = [];
    for (let i = 0; i < qParams.starCap; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.65),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random(),
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        color: Math.random() > 0.3 ? "#FFFFFF" : Math.random() > 0.5 ? "#A7F3D0" : "#BAE6FD",
      });
    }

    const shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: 0,
      opacity: 0,
      active: false,
    };

    const particles: Particle[] = [];
    const rainDrops: RainDrop[] = [];
    const splashRings: SplashRing[] = [];

    // Populate rain drops
    for (let i = 0; i < qParams.rainCap; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 18 + 10,
        speed: Math.random() * 12 + 14,
        opacity: Math.random() * 0.35 + 0.15,
      });
    }

    // Populate initial ambient particles
    for (let i = 0; i < qParams.particleCap; i++) {
      const isFirefly = themeId === "cyber" || themeId === "nordic" || Math.random() > 0.5;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.6 - 0.2,
        size: isFirefly ? Math.random() * 3 + 1.5 : Math.random() * 2 + 1,
        color: themeId === "cyber" ? "#38BDF8" : themeId === "retro" ? "#34D399" : themeId === "sunset" ? "#FDBA74" : "#7DD3FC",
        alpha: Math.random() * 0.7 + 0.2,
        maxAlpha: Math.random() * 0.8 + 0.2,
        life: Math.random() * 200 + 100,
        maxLife: Math.random() * 200 + 100,
        type: isFirefly ? "firefly" : "dust",
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    // Color definitions per theme
    const getThemeColors = () => {
      switch (themeId) {
        case "retro":
          return {
            skyTop: "#022C22",
            skyMid: "#064E3B",
            skyBottom: "#047857",
            horizonGlow: "#34D399",
            mountainFar: "#022C22",
            mountainNear: "#065F46",
            waterTop: "#047857",
            waterBottom: "#022C22",
            sunMoon: "#A7F3D0",
            sunMoonGlow: "rgba(52, 211, 153, 0.35)",
            godRayColor: "rgba(167, 243, 208, 0.08)",
            particleColor: "#34D399",
          };
        case "sunset":
          return {
            skyTop: "#4C1D95",
            skyMid: "#831843",
            skyBottom: "#C2410C",
            horizonGlow: "#FDBA74",
            mountainFar: "#31103F",
            mountainNear: "#581C87",
            waterTop: "#EA580C",
            waterBottom: "#3B0764",
            sunMoon: "#FDE047",
            sunMoonGlow: "rgba(251, 146, 60, 0.45)",
            godRayColor: "rgba(253, 186, 116, 0.12)",
            particleColor: "#FDBA74",
          };
        case "nordic":
          return {
            skyTop: "#0C4A6E",
            skyMid: "#0369A1",
            skyBottom: "#38BDF8",
            horizonGlow: "#BAE6FD",
            mountainFar: "#082F49",
            mountainNear: "#0C4A6E",
            waterTop: "#0284C7",
            waterBottom: "#032B45",
            sunMoon: "#E0F2FE",
            sunMoonGlow: "rgba(125, 211, 252, 0.4)",
            godRayColor: "rgba(186, 230, 253, 0.1)",
            particleColor: "#7DD3FC",
          };
        case "cyber":
        default:
          return {
            skyTop: "#030712",
            skyMid: "#0F172A",
            skyBottom: "#1E1B4B",
            horizonGlow: "#818CF8",
            mountainFar: "#090D16",
            mountainNear: "#111827",
            waterTop: "#312E81",
            waterBottom: "#030712",
            sunMoon: "#38BDF8",
            sunMoonGlow: "rgba(56, 189, 248, 0.4)",
            godRayColor: "rgba(129, 140, 248, 0.1)",
            particleColor: "#38BDF8",
          };
      }
    };

    // Main render loop
    const render = () => {
      if (!isPaused) {
        time += 0.016;
      }

      ctx.clearRect(0, 0, width, height);

      // Handle Shake offset
      let offsetX = 0;
      let offsetY = 0;
      if (shakeRef.current > 0.05) {
        offsetX = (Math.random() - 0.5) * shakeRef.current;
        offsetY = (Math.random() - 0.5) * shakeRef.current;
        shakeRef.current *= 0.9;
      } else {
        shakeRef.current = 0;
      }

      // Smooth idle camera drift
      const camDriftX = Math.sin(time * 0.4) * 5;
      const camDriftY = Math.cos(time * 0.3) * 3;

      ctx.save();
      ctx.translate(offsetX + camDriftX, offsetY + camDriftY);

      const colors = getThemeColors();

      // Determine active weather mode
      const isRainy = weatherPreset === "rain" || (weatherPreset === "auto" && (themeId === "nordic" || Math.sin(time * 0.05) > 0.7));
      const isSnowy = weatherPreset === "snow";
      const isCyberStorm = weatherPreset === "cyberstorm" || (themeId === "cyber" && Math.sin(time * 0.08) > 0.85);

      // -------------------------------------------------------------
      // 1. SKY GRADIENT & ATMOSPHERE
      // -------------------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, colors.skyTop);
      skyGrad.addColorStop(0.4, colors.skyMid);
      skyGrad.addColorStop(0.75, colors.skyBottom);
      skyGrad.addColorStop(1, colors.horizonGlow);

      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Celestial Body (Sun / Moon)
      const sunX = width * 0.75 + Math.sin(time * 0.05) * 15;
      const sunY = height * 0.22 + Math.cos(time * 0.04) * 8;
      const sunRadius = Math.min(width, height) * 0.08;

      const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3.5);
      sunGlow.addColorStop(0, colors.sunMoonGlow);
      sunGlow.addColorStop(0.5, colors.sunMoonGlow.replace("0.4", "0.15").replace("0.35", "0.12"));
      sunGlow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.sunMoon;
      ctx.shadowColor = colors.sunMoon;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Aurora Wave Curtains (Nordic / Cyber)
      if (themeId === "nordic" || themeId === "cyber") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let a = 0; a < 2; a++) {
          const auroraGrad = ctx.createLinearGradient(0, 0, width, height * 0.4);
          const auroraColor1 = themeId === "nordic" ? "rgba(52, 211, 153, 0.15)" : "rgba(168, 85, 247, 0.15)";
          const auroraColor2 = themeId === "nordic" ? "rgba(56, 189, 248, 0.12)" : "rgba(56, 189, 248, 0.12)";

          auroraGrad.addColorStop(0, "rgba(0,0,0,0)");
          auroraGrad.addColorStop(0.5, a === 0 ? auroraColor1 : auroraColor2);
          auroraGrad.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = auroraGrad;
          ctx.beginPath();
          ctx.moveTo(0, height * 0.15);
          for (let x = 0; x <= width; x += 40) {
            const waveY = height * 0.18 + Math.sin(x * 0.005 + time * 0.8 + a * 1.5) * 35 + Math.cos(x * 0.003 - time * 0.5) * 20;
            ctx.lineTo(x, waveY);
          }
          ctx.lineTo(width, height * 0.45);
          ctx.lineTo(0, height * 0.45);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Stars & Twinkle
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed * (Math.random() > 0.5 ? 1 : -1);
        if (star.alpha < 0.2) star.alpha = 0.2;
        if (star.alpha > 0.95) star.alpha = 0.95;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Occasional Shooting Star
      if (!shootingStar.active && Math.random() < 0.004) {
        shootingStar.x = Math.random() * width * 0.8;
        shootingStar.y = Math.random() * height * 0.3;
        shootingStar.length = Math.random() * 80 + 40;
        shootingStar.speed = Math.random() * 12 + 10;
        shootingStar.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        shootingStar.opacity = 1.0;
        shootingStar.active = true;
      }

      if (shootingStar.active) {
        const endX = shootingStar.x + Math.cos(shootingStar.angle) * shootingStar.length;
        const endY = shootingStar.y + Math.sin(shootingStar.angle) * shootingStar.length;

        const starGrad = ctx.createLinearGradient(shootingStar.x, shootingStar.y, endX, endY);
        starGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        starGrad.addColorStop(1, `rgba(255, 255, 255, ${shootingStar.opacity})`);

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.opacity -= 0.025;

        if (shootingStar.opacity <= 0 || shootingStar.x > width || shootingStar.y > height) {
          shootingStar.active = false;
        }
      }

      // God Rays (Volumetric Sunlight shafts)
      if (qParams.enableGodRays) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const rayCount = 5;
        for (let r = 0; r < rayCount; r++) {
          const angle = 0.35 + Math.sin(time * 0.2 + r) * 0.08;
          const rayWidth = 60 + Math.sin(time * 0.4 + r * 2) * 20;

          const rayGrad = ctx.createLinearGradient(sunX, sunY, sunX - Math.cos(angle) * height * 1.2, sunY + Math.sin(angle) * height * 1.2);
          rayGrad.addColorStop(0, colors.godRayColor);
          rayGrad.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(sunX + (r - 2) * 30, sunY);
          ctx.lineTo(sunX - Math.cos(angle - 0.1) * height * 1.5, height);
          ctx.lineTo(sunX - Math.cos(angle + 0.1) * height * 1.5 + rayWidth, height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 2. PARALLAX DISTANT MOUNTAINS / SKYLINE
      // -------------------------------------------------------------
      const drawMountains = (baseY: number, amplitude: number, waveLength: number, color: string, parallaxSpeed: number) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        const pOffset = (time * 15 * parallaxSpeed) % width;
        ctx.moveTo(-20, height);

        for (let x = -20; x <= width + 20; x += 15) {
          const y = baseY - Math.abs(Math.sin((x + pOffset) * waveLength)) * amplitude - Math.cos((x + pOffset) * waveLength * 0.5) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width + 20, height);
        ctx.closePath();
        ctx.fill();
      };

      // Far Mountains
      drawMountains(height * 0.72, 70, 0.004, colors.mountainFar, 0.05);

      // Near Mountains / Hills
      drawMountains(height * 0.78, 50, 0.008, colors.mountainNear, 0.12);

      // -------------------------------------------------------------
      // 3. MIDGROUND SWAYING TREES & VEGETATION
      // -------------------------------------------------------------
      const treeCount = Math.floor(width / 140);
      for (let i = 0; i <= treeCount; i++) {
        const treeX = (i * 150 + (i % 2 === 0 ? 30 : 80)) % (width + 60) - 30;
        const treeBaseY = height * 0.76;
        const treeHeight = 70 + (i % 3) * 20;
        const sway = Math.sin(time * 1.8 + i) * 6;

        // Trunk
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(treeX, treeBaseY);
        ctx.quadraticCurveTo(treeX + sway * 0.5, treeBaseY - treeHeight * 0.5, treeX + sway, treeBaseY - treeHeight);
        ctx.stroke();

        // Foliage Blobs
        ctx.fillStyle = colors.mountainNear;
        ctx.beginPath();
        ctx.arc(treeX + sway, treeBaseY - treeHeight, 24, 0, Math.PI * 2);
        ctx.arc(treeX + sway - 12, treeBaseY - treeHeight + 10, 18, 0, Math.PI * 2);
        ctx.arc(treeX + sway + 12, treeBaseY - treeHeight + 10, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // -------------------------------------------------------------
      // 4. WATER SURFACE & REFLECTIONS (Bottom Area)
      // -------------------------------------------------------------
      const waterLevel = height * 0.78;
      const waterGrad = ctx.createLinearGradient(0, waterLevel, 0, height);
      waterGrad.addColorStop(0, colors.waterTop);
      waterGrad.addColorStop(1, colors.waterBottom);

      ctx.fillStyle = waterGrad;
      ctx.fillRect(-20, waterLevel, width + 40, height - waterLevel + 20);

      // Specular Water Ripples
      if (qParams.enableReflections) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        for (let rY = waterLevel + 10; rY < height; rY += 14) {
          const ripplePhase = time * 2 + rY * 0.05;
          const rippleWidth = (width * 0.6) * (1 - (rY - waterLevel) / (height - waterLevel));
          const rx = width * 0.5 + Math.sin(ripplePhase) * 20;

          ctx.beginPath();
          ctx.moveTo(rx - rippleWidth * 0.5, rY);
          ctx.lineTo(rx + rippleWidth * 0.5, rY);
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // 5. DYNAMIC WEATHER EFFECTS (Rain, Splashes, Snow)
      // -------------------------------------------------------------
      if (isRainy) {
        ctx.strokeStyle = "rgba(186, 230, 253, 0.4)";
        ctx.lineWidth = 1.2;
        rainDrops.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length);
          ctx.stroke();

          drop.y += drop.speed;
          drop.x -= 0.5;

          if (drop.y >= waterLevel) {
            // Create splash ring on hitting water
            if (Math.random() < 0.3 && splashRings.length < 25) {
              splashRings.push({
                x: drop.x,
                y: drop.y + (Math.random() * (height - waterLevel)),
                radius: 1,
                maxRadius: Math.random() * 8 + 4,
                alpha: 0.8,
              });
            }
            drop.y = -drop.length;
            drop.x = Math.random() * width;
          }
        });

        // Update Splash Rings
        for (let s = splashRings.length - 1; s >= 0; s--) {
          const ring = splashRings[s];
          ctx.strokeStyle = `rgba(255, 255, 255, ${ring.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();

          ring.radius += 0.4;
          ring.alpha -= 0.04;

          if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
            splashRings.splice(s, 1);
          }
        }
      }

      // Lightning Flashes
      if (isCyberStorm || (isRainy && Math.random() < 0.002)) {
        flashAlphaRef.current = 0.4;
      }

      if (flashAlphaRef.current > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlphaRef.current})`;
        ctx.fillRect(-20, -20, width + 40, height + 40);
        flashAlphaRef.current *= 0.85;
      }

      // -------------------------------------------------------------
      // 6. AMBIENT PARTICLES (Fireflies, Embers, Sparkles)
      // -------------------------------------------------------------
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time * 0.5 + p.phase!) * 0.4;
        p.y += p.vy + Math.cos(time * 0.4 + p.phase!) * 0.3;
        p.life -= 1;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        if (p.life <= 0) {
          p.life = p.maxLife;
          p.x = Math.random() * width;
          p.y = Math.random() * height;
        }

        const pulseAlpha = Math.abs(Math.sin(time * 2 + p.phase!)) * p.maxAlpha;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = pulseAlpha;

        if (p.type === "firefly") {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // 7. LIGHT PULSE OVERLAY (Game Event Response)
      // -------------------------------------------------------------
      if (lightPulseRef.current > 0.01) {
        const pulseGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.7);
        pulseGrad.addColorStop(0, `rgba(255, 255, 255, ${lightPulseRef.current * 0.25})`);
        pulseGrad.addColorStop(0.6, `rgba(56, 189, 248, ${lightPulseRef.current * 0.15})`);
        pulseGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = pulseGrad;
        ctx.fillRect(-20, -20, width + 40, height + 40);

        lightPulseRef.current *= 0.92;
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [themeId, quality, weatherPreset, isPaused]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 ${className}`}
      style={{ opacity }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
