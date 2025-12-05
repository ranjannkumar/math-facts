import React, { useCallback, useContext, useEffect, useState,useRef } from 'react';
import { MathGameContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';
import { submitVideoRating } from '../api/mathApi.js';


const getVideoPath = (difficulty) => {
  if (!difficulty) return null;

  // Colored Belts
  switch (difficulty) {
    case 'white': return '/white_video.mp4';
    case 'yellow': return '/yellow_video.mp4';
    case 'green': return '/green_video.mp4';
    case 'blue': return '/blue_video.mp4';
    case 'red': return '/red_video.mp4';
    case 'brown': return '/brown_video.mp4';
  }

  // Black Belt Degrees
  if (difficulty.startsWith('black-')) {
    const degree = parseInt(difficulty.split('-')[1], 10);
    if (degree === 1) return '/degree1_video.mp4';
    if (degree === 2) return '/degree2_video.mp4';
    if (degree === 3 ) return '/degree3_video.mp4'; 
    if (degree === 4 ) return '/degree4_video.mp4';
    if (degree === 5 ) return '/degree5_video.mp4';
    if (degree === 6 ) return '/degree6_video.mp4';
    if (degree === 7 ) return '/degree7_video.mp4';
  }
  
  return null;
};

//Rating Panel Component
const RatingPanel = ({ onRate, onSkip, isSubmitting }) => {
  const [selectedRating, setSelectedRating] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-8 shadow-2xl max-w-lg w-full flex flex-col items-center animate-pop-in">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Rate this video</h2>

        {/* Rating Grid */}
        <div className="grid grid-cols-5 gap-3 w-full max-w-md mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(r)}
              disabled={isSubmitting}
              className={`py-3 px-2 rounded-lg font-semibold text-lg transition-all duration-200 
                ${selectedRating === r 
                  ? 'bg-green-500 text-white shadow-xl scale-105' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onRate(selectedRating)}
            disabled={selectedRating === 0 || isSubmitting}
            className={`kid-btn text-white transition-all bg-gray-600 ${
              selectedRating === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit '}
          </button>
          <button
            onClick={() => onSkip()}
            disabled={isSubmitting}
            className="kid-btn bg-gray-800 hover:bg-gray-900 text-gray-800"
          >
            Skip 
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoPlayerScreen = () => {
  const navigate = useNavigate();
  const { 
    selectedTable, 
    setQuizRunId, 
    tempNextRoute, 
    setTempNextRoute, 
    selectedDifficulty,
    childPin,
  } = useContext(MathGameContext);
  
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoKey, setVideoKey] = useState(0); // Key to force remount of <video> element
  const [videoEnded, setVideoEnded] = useState(false); // New state to track video end
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for rating submission
  const videoRef = useRef(null); //  ref for preventing pause

  useEffect(() => {
    // 1. Determine video path based on the completed level
    const path = getVideoPath(selectedDifficulty);
    
    if (path) {
      setVideoSrc(path);
      setVideoKey(prev => prev + 1); // Force remount if src changes
    } else {
      setVideoEnded(true);
    }

    return () => setTempNextRoute(null); // Clear the temp route on unmount
  }, [selectedDifficulty, setTempNextRoute]);

    useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const handlePause = () => {
      // If video isn't finished, force it to keep playing
      if (el.currentTime < el.duration) {
        el.play().catch(() => {
          // Ignore play errors (e.g. Safari autoplay policies)
        });
      }
    };

    el.addEventListener('pause', handlePause);

    return () => {
      el.removeEventListener('pause', handlePause);
    };
  }, [videoSrc]);


  const handleNavigation = useCallback(() => {
        let finalDestination = tempNextRoute;

        if (!finalDestination) {
            const isBlack = String(selectedDifficulty || '').startsWith('black');
            const degree = isBlack ? parseInt(String(selectedDifficulty).split('-')[1] || '0', 10) : 0;

            if (selectedDifficulty === 'brown' || (isBlack && degree >= 1 && degree <= 6)) {
                finalDestination = '/black';
            } else if (isBlack && degree === 7) {
                finalDestination = '/levels';
            } else {
                finalDestination = '/belts'; 
            }
        }
        
        finalDestination = finalDestination || '/levels'; 

        setQuizRunId(null);
        setTempNextRoute(null);
        navigate(finalDestination, { replace: true });

    }, [tempNextRoute, selectedDifficulty, setQuizRunId, setTempNextRoute, navigate]);

  const handleRateSubmit = async (rating) => {
    setIsSubmitting(true);
    
    // Ensure we have the context needed for the API call
    const level = selectedTable;
    const beltOrDegree = selectedDifficulty;

    try {
        if (rating > 0 && childPin && level && beltOrDegree) {
            // Call the new API to submit rating and trigger email
            await submitVideoRating(rating, level, beltOrDegree, childPin);
        }
    } catch (e) {
        console.error('Failed to submit video rating:', e);
        // Continue navigation even if email fails
    } finally {
        setIsSubmitting(false);
        handleNavigation();
    }
  };
if (!videoSrc) {
    if (videoEnded) {
        return <RatingPanel 
                    onRate={handleRateSubmit} 
                    onSkip={() => handleNavigation()} 
                    isSubmitting={isSubmitting} 
                />;
    }
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <p className="text-white">Preparing video...</p>
      </div>
    );
  }

 return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      {!videoEnded && (
        <video 
          ref={videoRef} 
          key={videoKey} 
          src={videoSrc}
          onEnded={() => setVideoEnded(true)} // Set state to show rating panel
          autoPlay
          controls={false} 
          className="max-w-full max-h-screen pointer-events-none"
          style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Button to skip video and go to rating
      {!videoEnded && (
        <button 
            onClick={() => setVideoEnded(true)} // Skip video -> show rating panel
            className="fixed bottom-10 right-10 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl z-50 transition-all duration-300"
        >
            Skip Video
        </button>
      )} */}

      {/* Rating Panel Overlay */}
      {videoEnded && (
        <RatingPanel 
            onRate={handleRateSubmit} 
            onSkip={() => handleNavigation()} 
            isSubmitting={isSubmitting} 
        />
      )}
    </div>
  );
};

export default VideoPlayerScreen;