import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import useGuardedVideoPlayback from '../hooks/useGuardedVideoPlayback.js';
import VideoPlaybackGate from './ui/VideoPlaybackGate.jsx';

const VIDEO_MAP = {
  intro: '/SurfGameIntro.mp4',
  win: '/Win_surf.mp4',
  lose: '/Lose_surf.mp4',
};

const GameModeSurfVideoScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { kind } = useParams();
  const videoRef = useRef(null);
  const surfVideoListRef = useRef([]);
  const endHandledRef = useRef(false);
  const endHandlerRef = useRef(() => {});

  const {
    startSurfNextQuiz,
    setIsTimerPaused,
    setPausedTime,
    isTimerPaused,
    pausedTime,
    setShouldExitAfterVideo,
    setVideoOptions,
    surfVideoList,
    setSurfResumeAfterVideo,
    pendingSurfPractice,
    setPendingSurfPractice,
    setShowLearningModule,
  } = useMathGamePick((ctx) => ({
    startSurfNextQuiz: ctx.startSurfNextQuiz || (() => Promise.resolve()),
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
    isTimerPaused: Boolean(ctx.isTimerPaused),
    pausedTime: ctx.pausedTime || 0,
    setShouldExitAfterVideo: ctx.setShouldExitAfterVideo || (() => {}),
    setVideoOptions: ctx.setVideoOptions || (() => {}),
    surfVideoList: Array.isArray(ctx.surfVideoList) ? ctx.surfVideoList : [],
    setSurfResumeAfterVideo: ctx.setSurfResumeAfterVideo || (() => {}),
    pendingSurfPractice: Boolean(ctx.pendingSurfPractice),
    setPendingSurfPractice: ctx.setPendingSurfPractice || (() => {}),
    setShowLearningModule: ctx.setShowLearningModule || (() => {}),
  }));

  const videoSrc = VIDEO_MAP[kind] || VIDEO_MAP.intro;
  const exitAfter = !!location.state?.exitAfter;
  const toRocketFlow = !!location.state?.toRocketFlow;

  const runEndFallback = useCallback(() => {
    Promise.resolve(endHandlerRef.current?.());
  }, []);

  const { showTapToPlay, handleTapToPlay } = useGuardedVideoPlayback({
    videoRef,
    onHardTimeout: runEndFallback,
    deps: [videoSrc, kind, exitAfter, toRocketFlow, runEndFallback],
    hardTimeoutMs: 7000,
  });

  useEffect(() => {
    surfVideoListRef.current = surfVideoList || [];
  }, [surfVideoList]);

  useEffect(() => {
    endHandledRef.current = false;
  }, [kind]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Pause timers/inactivity while surf videos play.
    // Preserve the original paused timestamp to avoid timer jitter on resume.
    if (!isTimerPaused) {
      setIsTimerPaused(true);
      setPausedTime(Date.now());
    } else if (!pausedTime) {
      setPausedTime(Date.now());
    }

    const pickTwoOptions = (list) => {
      if (!list || list.length === 0) return null;
      if (list.length === 1) return { option1: list[0], option2: list[0] };
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      return { option1: shuffled[0], option2: shuffled[1] };
    };

    if (kind === 'intro' || kind === 'win' || kind === 'lose') {
      v.playbackRate = 2;
    }

    const handleEnded = async () => {
      // Guard against double-fire in React StrictMode/dev.
      if (endHandledRef.current) return;
      endHandledRef.current = true;

      if (kind === 'intro') {
        navigate('/game-mode-surf-intro', { replace: true });
        return;
      }

      if (kind === 'lose' && pendingSurfPractice) {
        setShowLearningModule(true);
        setPendingSurfPractice(false);
        navigate('/learning', { replace: true });
        return;
      }

      if (kind === 'win') {
        if (toRocketFlow) {
          navigate('/game-mode-surf-complete', { replace: true });
          return;
        }

        const surfOptions = pickTwoOptions(surfVideoListRef.current);

        if (surfOptions) {
          // After the bonus video, either exit or resume surf mode based on exitAfter.
          setShouldExitAfterVideo(exitAfter);
          setSurfResumeAfterVideo(!exitAfter);
          setVideoOptions(surfOptions);
          navigate('/game-mode-video-select', { replace: true });
          return;
        }

        if (exitAfter) {
          setSurfResumeAfterVideo(false);
          setShouldExitAfterVideo(false);
          navigate('/game-mode-exit', { replace: true });
          return;
        }

        setSurfResumeAfterVideo(false);
        await startSurfNextQuiz({ navigateToGameMode: true });
        return;
      }

      navigate('/game-mode', { replace: true });
    };
    endHandlerRef.current = handleEnded;

    const handleError = () => {
      // Continue the same flow as a normal completion to avoid intro crashes.
      Promise.resolve(handleEnded());
    };

    v.addEventListener('ended', handleEnded);
    v.addEventListener('error', handleError);
    return () => {
      v.removeEventListener('ended', handleEnded);
      v.removeEventListener('error', handleError);
    };
  }, [
    kind,
    toRocketFlow,
    exitAfter,
    navigate,
    isTimerPaused,
    pausedTime,
    setIsTimerPaused,
    setPausedTime,
    startSurfNextQuiz,
    setShouldExitAfterVideo,
    setVideoOptions,
    setSurfResumeAfterVideo,
    pendingSurfPractice,
    setPendingSurfPractice,
    setShowLearningModule,
  ]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        preload="auto"
        playsInline
        autoPlay
        className="w-full h-full object-contain"
      />
      <VideoPlaybackGate
        visible={showTapToPlay}
        onTapToPlay={handleTapToPlay}
        onSkip={runEndFallback}
      />
    </div>
  );
};

export default GameModeSurfVideoScreen;
