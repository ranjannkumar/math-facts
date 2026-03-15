import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GameModeVideoScreen = () => {
  const nav = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = false;
    v.setAttribute("playsinline", "true");
    v.play().catch(() => {});

    const handleEnded = () => nav("/game-mode-intro", { replace: true });
    v.addEventListener("ended", handleEnded);

    return () => v.removeEventListener("ended", handleEnded);
  }, [nav]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src="/GameMode.mp4"
        preload="auto"
        playsInline
        autoPlay
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default GameModeVideoScreen;
