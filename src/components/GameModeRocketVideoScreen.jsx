import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const VIDEO_MAP = {
  intro: '/RocketIntro.mp4',
  lose: '/Lose_rocket.mp4',
};

const GameModeRocketVideoScreen = () => {
  const navigate = useNavigate();
  const { kind } = useParams();
  const videoRef = useRef(null);
  const finishedRef = useRef(false);

  const {
    setIsTimerPaused,
    setPausedTime,
    pendingRocketPractice,
    setPendingRocketPractice,
    setShowLearningModule,
  } = useContext(MathGameContext);

  const videoSrc = VIDEO_MAP[kind] || VIDEO_MAP.intro;

  useEffect(() => {
    finishedRef.current = false;
  }, [kind]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    setIsTimerPaused(true);
    setPausedTime(Date.now());

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

    const onEnded = () => finish();
    const onError = () => {
      // Graceful fallback if rocket videos are not added yet.
      setTimeout(finish, 1200);
    };

    videoEl.muted = false;
    if (kind === 'intro') {
      videoEl.playbackRate = 2;
    }
    videoEl.setAttribute('playsinline', 'true');
    videoEl.play().catch(() => {});
    videoEl.addEventListener('ended', onEnded);
    videoEl.addEventListener('error', onError);

    return () => {
      videoEl.removeEventListener('ended', onEnded);
      videoEl.removeEventListener('error', onError);
    };
  }, [
    kind,
    navigate,
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
    </div>
  );
};

export default GameModeRocketVideoScreen;
