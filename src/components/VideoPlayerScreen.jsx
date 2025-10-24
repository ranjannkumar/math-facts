import React, { useContext, useEffect, useState } from 'react';
import { MathGameContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * Maps the completed level to the appropriate video path.
 * The videos are assumed to be in the /public folder.
 */
const getVideoPath = (level) => {
  const levelNum = parseInt(level, 10);
  if (levelNum === 1) return '/level1_video.mp4';
  if (levelNum === 2) return '/level2_video.mp4';
  // Use level3_video for all other levels (3+)
  if (levelNum >= 3) return '/level3_video.mp4';
  return null; // Fallback
};

const VideoPlayerScreen = () => {
  const navigate = useNavigate();
  const { 
    selectedTable, 
    setQuizRunId, 
    tempNextRoute, 
    setTempNextRoute, 
    selectedDifficulty,
  } = useContext(MathGameContext);
  
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoKey, setVideoKey] = useState(0); // Key to force remount of <video> element

  useEffect(() => {
    // 1. Determine video path based on the completed level
    const path = getVideoPath(selectedTable);
    
    if (path) {
      setVideoSrc(path);
      setVideoKey(prev => prev + 1); // Force remount if src changes
    } else {
      // If no video or level is invalid, immediately navigate to the final destination
      console.warn("No video path found, navigating to next route immediately.");
      handleVideoEnd(true); // Treat as completed immediately
    }

    return () => setTempNextRoute(null); // Clear the temp route on unmount
  }, [selectedTable]);

  const handleVideoEnd = (skip = false) => {
    
    const finalDestination = tempNextRoute || '/levels';

    // console.log(`Video ${skip ? 'skipped' : 'ended'}, navigating to:`, finalDestination);
    
    setQuizRunId(null);
    setTempNextRoute(null);

    // Use replace: true to prevent navigating back to the video screen
    navigate(finalDestination, { replace: true });
  };

  if (!videoSrc) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <p className="text-white">Preparing video...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <video 
        key={videoKey} // Remounts the video element if the source changes
        src={videoSrc}
        onEnded={() => handleVideoEnd(false)}
        autoPlay
        controls={false} // Hide controls for seamless playback
        className="max-w-full max-h-screen"
        style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
        onLoadedData={(e) => {
             console.log(`Video loaded: ${e.currentTarget.duration}s`);
        }}
      >
        Your browser does not support the video tag.
      </video>
      <button 
          onClick={() => handleVideoEnd(true)}
          className="fixed bottom-10 right-10 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl z-50 transition-all duration-300"
      >
          Skip Video
      </button>
    </div>
  );
};

export default VideoPlayerScreen;