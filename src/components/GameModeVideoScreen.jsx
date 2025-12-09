import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GameModeVideoScreen = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

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
        // These attributes are enough for iOS when user interaction precedes
        playsInline 
        preload="auto"
        className="w-full max-w-3xl rounded-2xl shadow-2xl pointer-events-none"
        style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
      />
    </div>
  );
};

export default GameModeVideoScreen;