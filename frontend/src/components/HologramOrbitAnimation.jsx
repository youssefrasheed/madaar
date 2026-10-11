import React from 'react';
import PlatformIcon from './PlatformIcon';

/**
 * HologramOrbitAnimation Component
 * Renders futuristic, glowing holographic orbits of social media platforms (Facebook, Instagram,
 * X, LinkedIn, TikTok, YouTube, Snapchat) revolving gracefully around the Madaar cosmic nexus.
 * Engineered with pure CSS GPU transforms, counter-rotation for upright icons, and calibrated
 * opacity to never compromise text legibility.
 */
export default function HologramOrbitAnimation() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center"
    >
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-madaar-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Central Cosmic Core / Orbit Anchor */}
      <div className="relative w-0 h-0 flex items-center justify-center">
        {/* Core Glowing Rings */}
        <div className="absolute w-24 h-24 rounded-full border border-cyan-400/20 bg-cyan-500/5 backdrop-blur-sm shadow-[0_0_25px_rgba(6,182,212,0.15)] flex items-center justify-center animate-madaar-pulse">
          <div className="w-12 h-12 rounded-full border border-indigo-400/30 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>

        {/* =========================================================================
            ORBIT 1 — Inner Orbit (Radius: 135px | Diameter: 270px)
            Platforms: Instagram (0°), X / Twitter (180°)
           ========================================================================= */}
        <div
          className="absolute rounded-full border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.08)] animate-madaar-orbit-1"
          style={{ width: '270px', height: '270px' }}
        >
          {/* Subtle orbit accent dot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/50 shadow-[0_0_6px_#22d3ee]" />

          {/* Instagram Capsule (0° - Top) */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transformOrigin: 'center center' }}
          >
            <div className="animate-madaar-counter-1">
              <HologramBadge platform="instagram" neonColor="#E1306C" label="Instagram" />
            </div>
          </div>

          {/* X / Twitter Capsule (180° - Bottom) */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            style={{ transformOrigin: 'center center' }}
          >
            <div className="animate-madaar-counter-1">
              <HologramBadge platform="twitter" neonColor="#38bdf8" label="X" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            ORBIT 2 — Middle Orbit (Radius: 220px | Diameter: 440px)
            Platforms: LinkedIn (30°), TikTok (150°), YouTube (270°)
           ========================================================================= */}
        <div
          className="absolute rounded-full border border-dashed border-indigo-400/25 shadow-[0_0_20px_rgba(99,102,241,0.08)] animate-madaar-orbit-2"
          style={{ width: '440px', height: '440px' }}
        >
          {/* LinkedIn Capsule (~30°: Top Right) */}
          <div
            className="absolute"
            style={{
              top: '14.6%',
              right: '14.6%',
              transform: 'translate(50%, -50%)',
            }}
          >
            <div className="animate-madaar-counter-2">
              <HologramBadge platform="linkedin" neonColor="#0ea5e9" label="LinkedIn" />
            </div>
          </div>

          {/* TikTok Capsule (~150°: Bottom Right) */}
          <div
            className="absolute"
            style={{
              bottom: '14.6%',
              right: '14.6%',
              transform: 'translate(50%, 50%)',
            }}
          >
            <div className="animate-madaar-counter-2">
              <HologramBadge platform="tiktok" neonColor="#06b6d4" label="TikTok" />
            </div>
          </div>

          {/* YouTube Capsule (~270°: Left) */}
          <div
            className="absolute"
            style={{
              top: '50%',
              left: '0%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="animate-madaar-counter-2">
              <HologramBadge platform="youtube" neonColor="#ef4444" label="YouTube" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            ORBIT 3 — Outer Orbit (Radius: 320px | Diameter: 640px)
            Platforms: Facebook (70°), Snapchat (230°)
           ========================================================================= */}
        <div
          className="absolute rounded-full border border-cyan-400/15 shadow-[0_0_25px_rgba(6,182,212,0.05)] animate-madaar-orbit-3"
          style={{ width: '640px', height: '640px' }}
        >
          {/* Facebook Capsule */}
          <div
            className="absolute"
            style={{
              top: '8%',
              left: '32%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="animate-madaar-counter-3">
              <HologramBadge platform="facebook" neonColor="#3b82f6" label="Facebook" />
            </div>
          </div>

          {/* Snapchat Capsule */}
          <div
            className="absolute"
            style={{
              bottom: '12%',
              right: '25%',
              transform: 'translate(50%, 50%)',
            }}
          >
            <div className="animate-madaar-counter-3">
              <HologramBadge platform="snapchat" neonColor="#facc15" label="Snapchat" />
            </div>
          </div>
        </div>

        {/* Ambient Starlight Dust / Orbit Particles */}
        <div className="absolute -top-44 -left-36 w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee] opacity-75" />
        <div className="absolute top-52 -left-48 w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_#818cf8] opacity-60" />
        <div className="absolute -top-60 right-32 w-1 h-1 rounded-full bg-purple-300 shadow-[0_0_6px_#c084fc] opacity-70" />
        <div className="absolute top-64 right-44 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] opacity-50" />
      </div>

      {/* Dark Readability Vignette Gradient Mask
          Ensures the holographic orbits shine brightly on the edges while remaining soft and
          transparent behind the text, giving 100% clarity to the headline and bullet points. */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/80 pointer-events-none" />
    </div>
  );
}

/**
 * Holographic Floating Capsule Badge
 */
function HologramBadge({ platform, neonColor, label }) {
  return (
    <div className="group relative flex items-center justify-center">
      {/* Outer Holographic Glow Aura */}
      <div
        className="absolute -inset-2 rounded-2xl opacity-40 blur-md transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${neonColor}44 0%, transparent 70%)`,
        }}
      />

      {/* Glassmorphic Capsule */}
      <div
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center backdrop-blur-md bg-slate-900/70 border shadow-lg transition-transform"
        style={{
          borderColor: `${neonColor}55`,
          boxShadow: `0 0 16px ${neonColor}33, inset 0 0 12px ${neonColor}22`,
        }}
      >
        {/* Holographic light sheen sweep */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Clean Platform Vector Icon */}
        <div className="relative z-10 transform scale-90 sm:scale-95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          <PlatformIcon platform={platform} size="sm" showBg={true} />
        </div>
      </div>
    </div>
  );
}
