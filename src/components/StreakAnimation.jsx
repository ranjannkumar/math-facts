import React, { useContext, useEffect, useMemo, useState } from "react";
import { MathGameContext } from "../App.jsx";
import audioManager from "../utils/audioUtils.js";
import { motion, AnimatePresence } from "framer-motion";
import MascotPlayer from "./MascotPlayer";

// Total time (fly-in + celebrate + fly-out). Tweak as you like.
const ANIMATION_DURATION_MS = 2200;
const FLY_IN_MS = 600;
const CELEBRATE_MS = 1000;
const FLY_OUT_MS = 600;

const ICONS = {
  perfect: { chipIcon: "⚡", label: "Perfect!" },
  mixed: { chipIcon: "🔥", label: "Correct!" },
};

export default function StreakAnimation({ streakCount, symbolType, onAnimationComplete }) {
  const { childName } = useContext(MathGameContext);

  const [phase, setPhase] = useState("idle"); // 'idle' | 'fly-in' | 'celebrate' | 'fly-out' | 'done'
  const isPerfect = symbolType === "lightning";
  const visual = isPerfect ? ICONS.perfect : ICONS.mixed;

  // Simple confetti only during celebrate
  const particles = useMemo(() => {
    const count = 22;
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 140 + Math.random() * 80;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const rotate = Math.floor(Math.random() * 360);
      const scale = 0.8 + Math.random() * 0.7;
      const delay = Math.random() * 0.08;
      const emoji = isPerfect
        ? ["⚡", "✨", "🌟"][Math.floor(Math.random() * 3)]
        : ["🔥", "⭐", "🎉"][Math.floor(Math.random() * 3)];
      return { id: i, x, y, rotate, scale, delay, emoji };
    });
  }, [isPerfect, streakCount]);

  useEffect(() => {
    // sound cue
    if (isPerfect) audioManager._playBuffer?.("flash", 1.0);
    else audioManager.playCompleteSound?.();

    // fly-in → celebrate → fly-out → done
    setPhase("fly-in");
    const t1 = setTimeout(() => setPhase("celebrate"), FLY_IN_MS);
    const t2 = setTimeout(() => setPhase("fly-out"), FLY_IN_MS + CELEBRATE_MS);
    const t3 = setTimeout(() => {
      setPhase("done");
      onAnimationComplete?.(ANIMATION_DURATION_MS);
    }, FLY_IN_MS + CELEBRATE_MS + FLY_OUT_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isPerfect, onAnimationComplete]);

  if (phase === "idle" || phase === "done") return null;

  // Mascot motion variants: enter from right, slight arc at center, exit left
  const mascotVariants = {
    "fly-in": {
      x: ["100vw", "0vw"],
      y: ["0vh", "-4vh"],
      rotate: [0, -3],
      transition: { duration: FLY_IN_MS / 1000, ease: [0.22, 0.93, 0.34, 0.99] },
    },
    celebrate: {
      x: "0vw",
      y: ["-4vh", "-1vh", "-4vh"],
      rotate: [-3, 0, -3],
      transition: { duration: CELEBRATE_MS / 1000, times: [0, 0.5, 1], ease: "easeInOut" },
    },
    "fly-out": {
      x: ["0vw", "-120vw"],
      y: ["-4vh", "-2vh"],
      rotate: [-3, 0],
      transition: { duration: FLY_OUT_MS / 1000, ease: [0.22, 0.93, 0.34, 0.99] },
    },
  };

  const cardVariants = {
    "fly-in": { scale: 0.95, opacity: 0 },
    celebrate: { scale: 1, opacity: 1, transition: { duration: 0.25 } },
    "fly-out": { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        key="streak-overlay"
        className="fixed inset-0 z-[1000] select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop & subtle gradient */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="absolute inset-0 animate-sweep bg-[radial-gradient(85%_60%_at_50%_35%,rgba(255,255,255,0.12),transparent),conic-gradient(from_220deg_at_50%_50%,rgba(255,215,0,0.16),rgba(255,107,107,0.16),rgba(255,215,0,0.16))]" />

        {/* Expanding ring only when hitting center (celebrate) */}
        {phase === "celebrate" && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full border-4 border-white/80 animate-ring-pop shadow-[0_0_40px_rgba(255,255,255,0.6)]" />
        )}

        {/* Confetti at celebrate */}
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

        {/* Moving lane: mascot + chip ride together across screen */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4"
          variants={mascotVariants}
          animate={phase}
        >
          {/* Mascot: celebrate at center, idle while moving */}
          <MascotPlayer
            mode={phase === "celebrate" ? "celebrate" : "idle"}
            size={180}
            speed={isPerfect ? 1.2 : 1}
          />

          {/* Floating chip card */}
          <motion.div
            className="relative rounded-2xl border-4 border-white/90 px-5 py-3 text-center shadow-2xl"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,107,107,0.95) 0%, rgba(255,215,0,0.95) 100%)",
            }}
            variants={cardVariants}
            animate={phase}
          >
            <div className="absolute -inset-1 rounded-2xl bg-white/20 blur-lg" />
            <div className="relative">
              <div className="text-lg font-extrabold text-white drop-shadow-md">
                {visual.label}
              </div>

              <div className="mt-1 rounded-xl border border-white bg-white/90 px-4 py-1 text-gray-900 shadow-xl backdrop-blur-sm">
                <span className="text-xl font-extrabold tracking-tight">
                  {streakCount} {visual.chipIcon}
                </span>
              </div>

              {childName ? (
                <div className="mt-1 text-xs font-semibold text-white/95">Way to go, {childName}!</div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
