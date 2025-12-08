import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GameModeVideoScreen = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    const ctx = canvasEl.getContext('2d');

    if (!videoEl || !canvasEl) return;

    // Required for iPhone
    videoEl.setAttribute('muted', '');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.defaultMuted = true;
    videoEl.muted = true;
    videoEl.volume = 0;

    // Resize canvas to full video resolution once metadata loaded
    videoEl.onloadedmetadata = () => {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
    };

    // When video starts, unmute after a moment
    videoEl.onplaying = () => {
      setTimeout(() => {
        videoEl.muted = false;
        videoEl.defaultMuted = false;
        videoEl.volume = 1.0;
      }, 600);
    };

    // Draw frame loop
    const drawLoop = () => {
      try {
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      } catch (e) {}
      animationRef.current = requestAnimationFrame(drawLoop);
    };

    // Start video after short delay (iOS behavior)
    setTimeout(() => {
      videoEl.play().catch(() => {});
      drawLoop();
    }, 100);

    // Navigate after video ends
    const handleEnded = () => {
      cancelAnimationFrame(animationRef.current);
      navigate('/game-mode-intro', { replace: true });
    };

    videoEl.addEventListener('ended', handleEnded);

    return () => {
      videoEl.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(animationRef.current);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
      <div className="w-full max-w-3xl px-4">
        
        {/* Canvas (what the user sees) */}
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl shadow-2xl"
        />

        {/* Hidden video — only used for decoding frames */}
        <video
          ref={videoRef}
          src="/GameMode.mp4"
          preload="auto"
          playsInline
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default GameModeVideoScreen;
