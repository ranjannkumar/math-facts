import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GameModeVideoScreen = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Required for iPhone
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.setAttribute('muted', '');
    videoEl.muted = true;
    videoEl.volume = 0;

    // iOS autoplay timing fix
    setTimeout(() => {
      videoEl.play().catch(() => {});
    }, 100);

    // When video starts, unmute after a delay
    videoEl.onplaying = () => {
      setTimeout(() => {
        videoEl.muted = false;
        videoEl.volume = 1.0;
      }, 400);
    };

    // Navigate after video ends
    const handleEnded = () => {
      navigate('/game-mode-intro', { replace: true });
    };

    videoEl.addEventListener('ended', handleEnded);
    return () => videoEl.removeEventListener('ended', handleEnded);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src="/GameMode.mp4"
        autoPlay
        controls={false}
        playsInline
        preload="auto"
        className="w-full max-w-3xl rounded-2xl shadow-2xl pointer-events-none"
        style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
      />
    </div>
  );
};

export default GameModeVideoScreen;
