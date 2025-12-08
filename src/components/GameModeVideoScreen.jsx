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

    // Prevent pausing
    const handlePause = () => {
      if (videoEl.currentTime < videoEl.duration) {
        videoEl.play().catch(() => {});
      }
    };

    // After video begins, unmute (important for iOS)
    const handlePlaying = () => {
      setTimeout(() => {
        videoEl.muted = false; // allow audio
      }, 100); // small delay works best for all devices
    };

    videoEl.addEventListener('ended', handleEnded);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('playing', handlePlaying);

    return () => {
      videoEl.removeEventListener('ended', handleEnded);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('playing', handlePlaying);
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
          src="/GameMode.mp4"
          preload="auto"              // best for autoplay + no freeze
          muted                       // required for autoplay on iOS initially
          autoPlay
          playsInline                 // required for iOS
          controls={false}            // no UI controls
          className="w-full rounded-2xl shadow-2xl pointer-events-none"
          onCanPlayThrough={() => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onPause={() => {
            if (
              videoRef.current &&
              videoRef.current.currentTime < videoRef.current.duration
            ) {
              videoRef.current.play().catch(() => {});
            }
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default GameModeVideoScreen;
