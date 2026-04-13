import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import useGuardedVideoPlayback from '../hooks/useGuardedVideoPlayback.js';
import VideoPlaybackGate from './ui/VideoPlaybackGate.jsx';

const VIDEO_MAP = {
  intro: '/RocketIntro.mp4',
  lose: '/Lose_rocket.mp4',
};

const GameModeRocketVideoScreen = () => {
  const navigate = useNavigate();
  const { kind } = useParams();
  const videoRef = useRef(null);
  const finishedRef = useRef(false);
  const finishRef = useRef(() => {});

  const {
    setIsTimerPaused,
    setPausedTime,
    isTimerPaused,
    pausedTime,
    pendingRocketPractice,
    setPendingRocketPractice,
    setShowLearningModule,
  } = useMathGamePick((ctx) => ({
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
    isTimerPaused: Boolean(ctx.isTimerPaused),
    pausedTime: ctx.pausedTime || 0,
    pendingRocketPractice: Boolean(ctx.pendingRocketPractice),
    setPendingRocketPractice: ctx.setPendingRocketPractice || (() => {}),
    setShowLearningModule: ctx.setShowLearningModule || (() => {}),
  }));

  const videoSrc = VIDEO_MAP[kind] || VIDEO_MAP.intro;

  const runFinishFallback = useCallback(() => {
    Promise.resolve(finishRef.current?.());
  }, []);

  const { showTapToPlay, handleTapToPlay } = useGuardedVideoPlayback({
    videoRef,
    onHardTimeout: runFinishFallback,
    deps: [videoSrc, kind, runFinishFallback],
    hardTimeoutMs: 7000,
  });

  useEffect(() => {
    finishedRef.current = false;
  }, [kind]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!isTimerPaused) {
      setIsTimerPaused(true);
      setPausedTime(Date.now());
    } else if (!pausedTime) {
      setPausedTime(Date.now());
    }

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      if (kind === 'intro') {
        navigate('/game-mode-rocket-intro', { replace: true });
        return;
      }

      if (kind === 'lose' && pendingRocketPractice) {
        setShowLearningModule(true);
        setPendingRocketPractice(false);
        navigate('/learning', { replace: true });
        return;
      }

      navigate('/game-mode', { replace: true });
    };
    finishRef.current = finish;

    const onEnded = () => finish();
    const onError = () => {
      // Graceful fallback if rocket videos are not added yet.
      setTimeout(finish, 1200);
    };

    if (kind === 'intro') {
      videoEl.playbackRate = 2;
    }
    videoEl.addEventListener('ended', onEnded);
    videoEl.addEventListener('error', onError);

    return () => {
      videoEl.removeEventListener('ended', onEnded);
      videoEl.removeEventListener('error', onError);
    };
  }, [
    kind,
    navigate,
    isTimerPaused,
    pausedTime,
    pendingRocketPractice,
    setIsTimerPaused,
    setPausedTime,
    setPendingRocketPractice,
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
        onSkip={runFinishFallback}
      />
    </div>
  );
};

export default GameModeRocketVideoScreen;
