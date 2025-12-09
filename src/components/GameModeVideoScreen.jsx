import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GameModeVideoScreen = () => {
  const nav = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => nav("/game-mode-intro", { replace: true });
    v.addEventListener("ended", handleEnded);

    // iOS requires explicit "muted" setup
    v.muted = true;
    v.setAttribute("muted", "true");
    v.setAttribute("playsinline", "true");

    // Manual force-play for iOS
    const playVideo = () => {
      v.play().catch((err) => console.log("iOS autoplay issue", err));
    };
    playVideo();

    return () => {
      v.removeEventListener("ended", handleEnded);
    };
  }, [nav]);

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center touch-none">
      <video
        ref={videoRef}
        src="/GameMode.mp4"
        preload="auto"
        autoPlay
        muted
        playsInline
        disablePictureInPicture
        webkit-playsinline="true"
        x-webkit-airplay="deny"
        disableRemotePlayback
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default GameModeVideoScreen;
