import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const GameModeVideoScreen = () => {
  const nav = useNavigate();
  const videoRef = useRef(null);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.setAttribute("playsinline", "true");
    v.play();

    const handleEnded = () => nav("/game-mode-intro", { replace: true });
    v.addEventListener("ended", handleEnded);

    return () => v.removeEventListener("ended", handleEnded);
  }, [nav]);

  const enableAudio = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play();
    setHasAudio(true);
  };

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

      {/* Show tap button until audio enabled */}
      {!hasAudio && (
        <button
          className="absolute bottom-12 bg-white text-black px-6 py-3 rounded-xl shadow-xl text-lg font-semibold"
          onClick={enableAudio}
        >
          🔊 Tap for sound
        </button>
      )}
    </div>
  );
};

export default GameModeVideoScreen;
