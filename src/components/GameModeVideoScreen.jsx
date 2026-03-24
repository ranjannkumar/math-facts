import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GameModeVideoScreen = () => {
  const nav = useNavigate();
  const videoRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      nav("/game-mode-intro", { replace: true });
    };

    v.muted = false;
    v.playbackRate = 2;
    v.setAttribute("playsinline", "true");
    v.play().catch(() => {
      // If autoplay fails on a device, continue flow instead of hanging/crashing.
      setTimeout(finish, 800);
    });

    const handleEnded = () => finish();
    const handleError = () => setTimeout(finish, 1200);
    v.addEventListener("ended", handleEnded);
    v.addEventListener("error", handleError);

    return () => {
      v.removeEventListener("ended", handleEnded);
      v.removeEventListener("error", handleError);
    };
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
