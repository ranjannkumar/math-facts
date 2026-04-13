import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useGuardedVideoPlayback from "../hooks/useGuardedVideoPlayback.js";
import VideoPlaybackGate from "./ui/VideoPlaybackGate.jsx";

const GameModeVideoScreen = () => {
  const nav = useNavigate();
  const videoRef = useRef(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    nav("/game-mode-intro", { replace: true });
  }, [nav]);

  const { showTapToPlay, handleTapToPlay } = useGuardedVideoPlayback({
    videoRef,
    onHardTimeout: finish,
    deps: [finish],
    hardTimeoutMs: 7000,
  });

  useEffect(() => {
    finishedRef.current = false;
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.playbackRate = 2;

    const handleEnded = () => finish();
    const handleError = () => setTimeout(finish, 1200);
    v.addEventListener("ended", handleEnded);
    v.addEventListener("error", handleError);

    return () => {
      v.removeEventListener("ended", handleEnded);
      v.removeEventListener("error", handleError);
    };
  }, [finish]);

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
      <VideoPlaybackGate visible={showTapToPlay} onTapToPlay={handleTapToPlay} onSkip={finish} />
    </div>
  );
};

export default GameModeVideoScreen;
