// src/components/StreakAnimation.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MathGameContext } from "../App.jsx";
import audioManager from "../utils/audioUtils.js";
import { motion, AnimatePresence } from "framer-motion";
import MascotPlayer from "./MascotPlayer";

/** Timings */
const FLY_IN_MS = 600;
const ORBIT_MS = 1200;
const FLY_OUT_MS = 600;
const TOTAL_MS = FLY_IN_MS + ORBIT_MS + FLY_OUT_MS;

/** Visual sizing */
const MASCOT_SIZE = 190;   // px (Lottie size)
const CHIP_W = 160;        // px
const CHIP_H = 72;         // px
const CLEAR_MARGIN = 20;   // px extra air so the mascot never touches the chip

/** Sound keys (already defined in audio manager assets) */
const SOUNDS = {
  flyIn: "swoosh",
  celebrate: "success",
  flyOut: "whooshOut",
  perfect: "flash",
};

/** Build a circular/elliptical orbit around (0,0) */
function buildOrbit(radius = 120, points = 16, tiltRad = Math.PI / 10) {
  const xs = [];
  const ys = [];
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2 + tiltRad;
    xs.push(Math.cos(t) * radius);
    ys.push(Math.sin(t) * radius * 0.78); // slight ellipse
  }
  return { xs, ys, firstX: xs[0], firstY: ys[0] };
}

export default function StreakAnimation({ streakCount, symbolType, onAnimationComplete }) {
  const { /* childName */ } = useContext(MathGameContext);
  const [phase, setPhase] = useState("idle"); // idle | in | celebrate | out | done

  // === Safe radius so mascot never overlaps the chip ===
  const CHIP_DIAG_HALF = Math.hypot(CHIP_W, CHIP_H) / 2;
  const SAFE_RADIUS = CHIP_DIAG_HALF + MASCOT_SIZE / 2 + CLEAR_MARGIN;

  const orbit = useMemo(() => buildOrbit(SAFE_RADIUS, 18, Math.PI / 10), [SAFE_RADIUS]);

  // Confetti burst during celebrate
  const particles = useMemo(() => {
    const count = 26;
    return Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      const R = SAFE_RADIUS + 60 + Math.random() * 100;
      return {
        id: i,
        x: Math.cos(a) * R,
        y: Math.sin(a) * R * 0.85,
        scale: 0.75 + Math.random() * 0.8,
        rotate: Math.floor(Math.random() * 360),
        delay: Math.random() * 0.06,
        emoji: symbolType === "lightning"
          ? ["⚡", "✨", "🌟"][Math.floor(Math.random() * 3)]
          : ["🔥", "⭐", "🎉"][Math.floor(Math.random() * 3)],
      };
    });
  }, [SAFE_RADIUS, symbolType, streakCount]);

  // ---- SOUND LOOP for animation beat during celebrate ----
  const beatTimerRef = useRef(null);
  const startBeat = () => {
    stopBeat();
    // gentle metronome while orbiting (every ~300ms fits 1200ms nicely)
    audioManager.playAnimationSound?.();
    beatTimerRef.current = setInterval(() => {
      audioManager.playAnimationSound?.();
    }, 300);
  };
  const stopBeat = () => {
    if (beatTimerRef.current) {
      clearInterval(beatTimerRef.current);
      beatTimerRef.current = null;
    }
  };

  // Phase scheduling + one-shot sounds
  useEffect(() => {
    // Ensure context resumes if browser suspended it
    audioManager.resume?.();

    // Base cue + whoosh in
    if (symbolType === "lightning") audioManager._playBuffer?.(SOUNDS.perfect, 1.0);
    else audioManager.playCompleteSound?.();
    audioManager._playBuffer?.(SOUNDS.flyIn, 0.9);

    if (navigator?.vibrate) { try { navigator.vibrate(15); } catch {} }

    setPhase("in");
    const t1 = setTimeout(() => {
      setPhase("celebrate");
      audioManager._playBuffer?.(SOUNDS.celebrate, 1.0);
      startBeat(); // <- start animation beat when celebration begins
    }, FLY_IN_MS);

    const t2 = setTimeout(() => {
      stopBeat(); // stop beat before exit
      setPhase("out");
      audioManager._playBuffer?.(SOUNDS.flyOut, 0.9);
    }, FLY_IN_MS + ORBIT_MS);

    const t3 = setTimeout(() => {
      setPhase("done");
      onAnimationComplete?.(TOTAL_MS);
    }, TOTAL_MS);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      stopBeat();
    };
  }, [symbolType, onAnimationComplete]);

  if (phase === "idle" || phase === "done") return null;

  // Mascot movement relative to center anchor (0,0)
  const mascotPath = {
    in: {
      // approach first orbit point from the right (relative to center)
      x: ["65vw", orbit.firstX, orbit.firstX],
      y: [0, orbit.firstY, orbit.firstY],
      rotate: [-4, -4, -2],
      transition: {
        duration: FLY_IN_MS / 1000,
        ease: [0.18, 0.9, 0.24, 1.02],
        times: [0, 0.9, 1],
      },
    },
    celebrate: {
      x: orbit.xs,
      y: orbit.ys,
      rotate: [-6, -3, 0, 3, 6, 3, 0, -3, -6, -3, 0, 3, -3, -6, -3],
      transition: {
        duration: ORBIT_MS / 1000,
        ease: "linear",
        times: orbit.xs.map((_, i) => i / orbit.xs.length),
      },
    },
    out: {
      // leave to the left (relative to center)
      x: [0, "-70vw"],
      y: [0, "-3vh"],
      rotate: [-2, 2],
      transition: { duration: FLY_OUT_MS / 1000, ease: [0.18, 0.9, 0.24, 1.02] },
    },
  };

  // Subtle squash/stretch to sell speed
  const squash = {
    in: {
      scaleX: [1, 1.08, 1],
      scaleY: [1, 0.92, 1],
      transition: { duration: FLY_IN_MS / 1000, ease: "easeOut" },
    },
    celebrate: {
      scaleX: [1, 0.98, 1],
      scaleY: [1, 1.02, 1],
      transition: { duration: ORBIT_MS / 1000, ease: "easeInOut" },
    },
    out: {
      scaleX: [1, 1.06],
      scaleY: [1, 0.94],
      transition: { duration: FLY_OUT_MS / 1000, ease: "easeIn" },
    },
  };

  // Chip fades/pops but stays fixed at center
  const chip = {
    in: { opacity: 0, scale: 0.96 },
    celebrate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 160, damping: 14 } },
    out: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
  };

  // Display format: +N normally, !N for perfect (per your spec)
  const displayCount = (symbolType === "lightning" ? "!" : "+") + String(streakCount);

  return (
    <AnimatePresence>
      <motion.div
        key="streak-overlay"
        className="fixed inset-0 z-[1000] select-none pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop + ambient energy */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 animate-sweep bg-[radial-gradient(85%_60%_at_50%_35%,rgba(255,255,255,0.12),transparent),conic-gradient(from_220deg_at_50%_50%,rgba(16,185,129,0.16),rgba(34,197,94,0.16),rgba(16,185,129,0.16))]" />

        {/* Absolute center anchor (0,0) */}
        <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)" }}>
          {/* Celebration ring */}
          {phase === "celebrate" && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/85 animate-ring-pop shadow-[0_0_40px_rgba(255,255,255,0.6)]" />
          )}

          {/* Confetti emitted from the exact center */}
          {phase === "celebrate" &&
            particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute left-1/2 top-1/2 text-2xl"
                initial={{ x: 0, y: 0, scale: 0.2, rotate: 0, opacity: 0 }}
                animate={{ x: p.x, y: p.y, scale: p.scale, rotate: p.rotate, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 14,
                  mass: 0.5,
                  delay: p.delay,
                }}
              >
                {p.emoji}
              </motion.span>
            ))}

          {/* ---- CHIP: fixed at center, GREEN, only streak count ---- */}
          <motion.div
            className="relative z-20 rounded-2xl border-4 border-white/90 text-center shadow-2xl"
            style={{
              width: `${CHIP_W}px`,
              height: `${CHIP_H}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(145deg, rgba(22,163,74,0.98) 0%, rgba(34,197,94,0.98) 100%)",
            }}
            variants={chip}
            animate={phase === "in" ? "in" : phase === "celebrate" ? "celebrate" : "out"}
          >
            <div className="absolute -inset-1 rounded-2xl bg-white/15 blur-lg" />
            <span className="relative text-3xl font-black tracking-tight text-white drop-shadow-md">
              {displayCount}
            </span>
          </motion.div>

          {/* ---- MASCOT: true orbit around (0,0) — never overlaps the chip ---- */}
          <motion.div
            className="absolute left-1/2 top-1/2 z-10"
            style={{ transform: "translate(-50%, -50%)" }}
            variants={mascotPath}
            animate={phase}
          >
            <motion.div variants={squash} animate={phase} className="relative">
              {phase === "celebrate" && (
                <div className="absolute -inset-6 rounded-full" style={{ background: "rgba(255,255,255,0.18)", filter: "blur(22px)" }} />
              )}
              <MascotPlayer
                mode={phase === "celebrate" ? "celebrate" : "idle"}
                size={MASCOT_SIZE}
                speed={symbolType === "lightning" ? 1.2 : 1}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
