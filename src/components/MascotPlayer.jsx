import { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import idleAnim from "../animations/mascot_idle.json";
import celebrateAnim from "../animations/mascot_celebrate.json";

/**
 * mode: "idle" | "celebrate"
 * onComplete: called when a non-looping animation finishes
 * size: px number
 * speed: 0.5..2 (optional)
 */
export default function MascotPlayer({ mode = "idle", size = 180, speed = 1, onComplete }) {
  const ref = useRef(null);
  const data = mode === "celebrate" ? celebrateAnim : idleAnim;
  const loop = mode === "idle";

  useEffect(() => {
    if (!ref.current) return;
    // set playback speed
    ref.current.setSpeed?.(speed);
  }, [speed, mode]);

  return (
    <Lottie
      lottieRef={ref}
      animationData={data}
      loop={loop}
      autoplay
      style={{ width: size, height: size }}
      onComplete={() => !loop && onComplete?.()}
    />
  );
}
