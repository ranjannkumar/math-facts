import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContext } from "react";
import { MathGameContext } from '../App.jsx';


const GameModeVideoPlayer = () => {
  const navigate = useNavigate();
  const gameContext = useContext(MathGameContext);
  const { level } = useParams();      
  const videoRef = useRef(null);

const TOTAL_VIDEOS_AVAILABLE = 2;

const actualVideoIndex = ((parseInt(level) - 1) % TOTAL_VIDEOS_AVAILABLE) + 1;

const videoSrc = `/GameMode${actualVideoIndex}.mp4`;


  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // When video finishes → go back to game mode
    const handleEnded = () => {

      gameContext.setIsTimerPaused(false);

      gameContext.questionStartTimestamp.current = Date.now();

      if (gameContext.shouldExitAfterVideo) {
        gameContext.setShouldExitAfterVideo(false); // reset flag
        return navigate('/game-mode-exit', { replace: true });
      }

      // Otherwise → NORMAL return to /game-mode
      navigate('/game-mode', { replace: true });
    };


    // Prevent user pause (even touch)
    const preventPause = () => {
      if (videoEl.paused) videoEl.play().catch(() => {});
    };

    videoEl.addEventListener("ended", handleEnded);
    videoEl.addEventListener("pause", preventPause);

    videoEl.play().catch(() => {});

    return () => {
      videoEl.removeEventListener("ended", handleEnded);
      videoEl.removeEventListener("pause", preventPause);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        muted={false}
        disableRemotePlayback
        className="w-screen h-screen object-contain"
      />
    </div>
  );
};

export default GameModeVideoPlayer;
