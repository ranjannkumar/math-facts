import React from 'react';

const VideoPlaybackGate = ({ visible, onTapToPlay }) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <button
        type="button"
        aria-label="Play video"
        onClick={onTapToPlay}
        className="pointer-events-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/90 hover:bg-white shadow-2xl flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10 sm:h-12 sm:w-12 fill-slate-900" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  );
};

export default VideoPlaybackGate;
