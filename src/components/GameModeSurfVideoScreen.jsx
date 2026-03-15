import React, { useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

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

  const {
    startSurfNextQuiz,
    setIsTimerPaused,
    setPausedTime,
    setShouldExitAfterVideo,
    setVideoOptions,
    surfVideoList,
    setSurfResumeAfterVideo,
    pendingSurfPractice,
    setPendingSurfPractice,
    setShowLearningModule,
  } = useContext(MathGameContext);

  const videoSrc = VIDEO_MAP[kind] || VIDEO_MAP.intro;
  const exitAfter = !!location.state?.exitAfter;
  const toRocketFlow = !!location.state?.toRocketFlow;

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
    setIsTimerPaused(true);
    setPausedTime(Date.now());

    const pickTwoOptions = (list) => {
      if (!list || list.length === 0) return null;
      if (list.length === 1) return { option1: list[0], option2: list[0] };
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      return { option1: shuffled[0], option2: shuffled[1] };
    };

    v.muted = false;
    if (kind === 'win' || kind === 'lose') {
      v.playbackRate = 2;
    }
    v.setAttribute('playsinline', 'true');
    v.play().catch(() => {});

    const handleEnded = async () => {
      // Guard against double-fire in React StrictMode/dev.
      if (endHandledRef.current) return;
      endHandledRef.current = true;

      if (kind === 'intro') {
        setIsTimerPaused(false);
        setPausedTime(0);
        navigate('/game-mode-surf-intro', { replace: true });
        return;
      }

      if (kind === 'lose' && pendingSurfPractice) {
        setShowLearningModule(true);
        setPendingSurfPractice(false);
        navigate('/learning', { replace: true });
        return;
      }

      setIsTimerPaused(false);
      setPausedTime(0);

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

    v.addEventListener('ended', handleEnded);
    return () => v.removeEventListener('ended', handleEnded);
  }, [
    kind,
    toRocketFlow,
    exitAfter,
    navigate,
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
    </div>
  );
};

export default GameModeSurfVideoScreen;
