import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GameModeVideoScreen = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleEnded = () => {
      // After video finishes, go to Game Mode intro
      navigate('/game-mode-intro', { replace: true });
    };

    // If user / device pauses the video, immediately resume
    const handlePause = () => {
      if (videoEl.currentTime < videoEl.duration) {
        videoEl.play().catch(() => {
          // Ignore play errors (e.g. autoplay restrictions)
        });
      }
    };

    videoEl.addEventListener('ended', handleEnded);
    videoEl.addEventListener('pause', handlePause);

    return () => {
      videoEl.removeEventListener('ended', handleEnded);
      videoEl.removeEventListener('pause', handlePause);
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
      <div className="w-full max-w-3xl px-4">
        <video
          ref={videoRef}
          className="w-full rounded-2xl shadow-2xl pointer-events-none"  // no touch/click on video
          src="/GameMode.mp4"   // make sure this matches the actual filename in /public
          autoPlay
          playsInline
          controls={false}      //  no visible controls
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default GameModeVideoScreen;
