import React, { useEffect, useRef, useState, useContext } from 'react';
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
  const [hasAudio, setHasAudio] = useState(false);

  const {
    startSurfNextQuiz,
    setIsTimerPaused,
    setPausedTime,
    setShouldExitAfterVideo,
    pendingSurfPractice,
    setPendingSurfPractice,
    setShowLearningModule,
  } = useContext(MathGameContext);

  const videoSrc = VIDEO_MAP[kind] || VIDEO_MAP.intro;
  const exitAfter = !!location.state?.exitAfter;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    if (kind === 'win' || kind === 'lose') {
      v.playbackRate = 2;
    }
    v.setAttribute('playsinline', 'true');
    v.play().catch(() => {});

    const handleEnded = async () => {
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
        if (exitAfter) {
          setShouldExitAfterVideo(false);
          navigate('/game-mode-exit', { replace: true });
          return;
        }
        await startSurfNextQuiz({ navigateToGameMode: true });
        return;
      }

      navigate('/game-mode', { replace: true });
    };

    v.addEventListener('ended', handleEnded);
    return () => v.removeEventListener('ended', handleEnded);
  }, [
    kind,
    exitAfter,
    navigate,
    setIsTimerPaused,
    setPausedTime,
    startSurfNextQuiz,
    setShouldExitAfterVideo,
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

      {!hasAudio && (
        <button
          className="absolute bottom-12 bg-white text-black px-6 py-3 rounded-xl shadow-xl text-lg font-semibold"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            v.muted = false;
            v.play();
            setHasAudio(true);
          }}
        >
          Tap for sound
        </button>
      )}
    </div>
  );
};

export default GameModeSurfVideoScreen;
