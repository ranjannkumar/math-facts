import React, { useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MathGameContext } from "../App.jsx";

const GameModeVideoPlayer = () => {
  const navigate = useNavigate();
  const {
    setIsTimerPaused,
    questionStartTimestamp,
    setPausedTime,
    shouldExitAfterVideo,
    setShouldExitAfterVideo,
    shouldGoToLightningCompleteAfterVideo,
    setShouldGoToLightningCompleteAfterVideo,
    lightningCount,
    setLightningCycleStart,
    surfResumeAfterVideo,
    setSurfResumeAfterVideo,
    startSurfNextQuiz,
  } = useContext(MathGameContext);

  const { videoName } = useParams();
  const location = useLocation();
  const videoUrl = location.state?.videoUrl; // came from selection screen
  const videoRef = useRef(null);

  // prevent replay while we're already finishing/navigating
  const finishTriggeredRef = useRef(false);

  // reset guard when a new video is loaded
  useEffect(() => {
    finishTriggeredRef.current = false;
  }, [videoUrl]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl) return;

    //  if we've already ended/errored and are navigating, do nothing
    if (finishTriggeredRef.current) return;

    const cleanupAndNavigate = async () => {
      // guard against re-entry (ended + rerender + ended again etc)
      if (finishTriggeredRef.current) return;
      finishTriggeredRef.current = true;

      // stop the element immediately so it can’t restart while waiting
      try {
        videoEl.pause();
      } catch {}

      // Resume timers & inactivity tracking
      setIsTimerPaused(false);
      if (questionStartTimestamp?.current != null) {
        questionStartTimestamp.current = Date.now();
      }
      setPausedTime?.(0);

      if (surfResumeAfterVideo) {
        setSurfResumeAfterVideo(false);
        await startSurfNextQuiz({ navigateToGameMode: true });
        return;
      }

      const shouldResumeGameMode =
        !shouldGoToLightningCompleteAfterVideo && !shouldExitAfterVideo;

      if (shouldResumeGameMode) {
        setLightningCycleStart(lightningCount);
      }

      if (shouldGoToLightningCompleteAfterVideo) {
        setShouldGoToLightningCompleteAfterVideo(false);
        navigate("/game-mode-lightning-complete", { replace: true });
      } else if (shouldExitAfterVideo) {
        setShouldExitAfterVideo(false);
        navigate("/game-mode-exit", { replace: true });
      } else {
        navigate("/game-mode", { replace: true });
      }
    };

    const handleEnded = () => cleanupAndNavigate();
    const handleError = () => {
      console.warn("[GameMode] Failed to load bonus video:", videoUrl);
      cleanupAndNavigate();
    };

    videoEl.playbackRate = 2.0;
    videoEl.addEventListener("ended", handleEnded);
    videoEl.addEventListener("error", handleError);

    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("[GameMode] Autoplay failed:", err);
      });
    }

    return () => {
      videoEl.removeEventListener("ended", handleEnded);
      videoEl.removeEventListener("error", handleError);
    };
  }, [
    navigate,
    videoUrl,
    setIsTimerPaused,
    questionStartTimestamp,
    setPausedTime,
    shouldExitAfterVideo,
    setShouldExitAfterVideo,
    shouldGoToLightningCompleteAfterVideo,
    setShouldGoToLightningCompleteAfterVideo,
    lightningCount,
    setLightningCycleStart,
    surfResumeAfterVideo,
    setSurfResumeAfterVideo,
    startSurfNextQuiz,
  ]);

  if (!videoUrl) {
    //  if user somehow lands here without state, just go back to game mode
    navigate("/game-mode", { replace: true });
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        muted={false}
        disableRemotePlayback
        className="w-screen h-screen object-contain pointer-events-none"
        key={videoName || videoUrl}
      />
    </div>
  );
};

export default GameModeVideoPlayer;
