import React, { useCallback, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { MathGameContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

const rewardVideoModules = import.meta.glob('/public/reward-videos/**/*.mp4', { as: 'url' });
const rewardThumbPngModules = import.meta.glob('/public/reward-videos/**/*.png', { as: 'url' });
const rewardThumbJpgModules = import.meta.glob('/public/reward-videos/**/*.jpg', { as: 'url' });

const getRewardMeta = (path) => {
  const parts = path.split('/');
  const idx = parts.indexOf('reward-videos');
  if (idx === -1 || idx + 1 >= parts.length) return null;
  const belt = parts[idx + 1];
  const file = parts[parts.length - 1];
  const base = file.replace(/\.(mp4|png|jpg)$/i, '');
  return { belt, base, key: `${belt}/${base}` };
};

const normalizeBeltKey = (difficulty) => {
  if (!difficulty) return null;
  const lower = String(difficulty).toLowerCase();
  if (lower.startsWith('black')) {
    const parts = lower.split('-');
    const degree = parts[1];
    return degree ? `black-degree-${degree}` : null;
  }
  return lower;
};

const VideoPlayerScreen = () => {
  const navigate = useNavigate();
  const { 
    setQuizRunId, 
    tempNextRoute, 
    setTempNextRoute, 
    selectedDifficulty
  } = useContext(MathGameContext);
  
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoOptions, setVideoOptions] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);
  const [rewardVideoList, setRewardVideoList] = useState([]);

  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.setAttribute("playsinline", "true");
    v.play().catch(() => { /* iOS may block until gesture */ });
  }, [selectedVideo]);


  useEffect(() => {
    const loadRewardVideos = async () => {
      const videoEntries = Object.entries(rewardVideoModules);
      if (videoEntries.length === 0) {
        setRewardVideoList([]);
        return;
      }

      const videoUrls = await Promise.all(videoEntries.map(([_, loader]) => loader()));

      const pngEntries = Object.entries(rewardThumbPngModules);
      const pngUrls = await Promise.all(pngEntries.map(([_, loader]) => loader()));
      const jpgEntries = Object.entries(rewardThumbJpgModules);
      const jpgUrls = await Promise.all(jpgEntries.map(([_, loader]) => loader()));

      const thumbMap = new Map();
      pngEntries.forEach(([path], idx) => {
        const meta = getRewardMeta(path);
        if (meta) thumbMap.set(meta.key, pngUrls[idx]);
      });
      jpgEntries.forEach(([path], idx) => {
        const meta = getRewardMeta(path);
        if (meta && !thumbMap.has(meta.key)) thumbMap.set(meta.key, jpgUrls[idx]);
      });

      const videos = videoEntries
        .map(([path], idx) => {
          const meta = getRewardMeta(path);
          if (!meta) return null;
          return {
            name: meta.base,
            belt: meta.belt,
            key: meta.key,
            url: videoUrls[idx],
            thumbnailUrl: thumbMap.get(meta.key) || null,
          };
        })
        .filter(Boolean);

      setRewardVideoList(videos);
    };

    loadRewardVideos();
    return () => setTempNextRoute(null);
  }, [setTempNextRoute]);

  const filteredRewardVideos = useMemo(() => {
    const beltKey = normalizeBeltKey(selectedDifficulty);
    if (!beltKey) return rewardVideoList;
    const scoped = rewardVideoList.filter((v) => v.belt === beltKey);
    return scoped.length ? scoped : rewardVideoList;
  }, [rewardVideoList, selectedDifficulty]);

  // 1. Generate two random options from the reward videos
  useEffect(() => {
    if (filteredRewardVideos && filteredRewardVideos.length > 0) {
      const shuffled = [...filteredRewardVideos].sort(() => Math.random() - 0.5);
      setVideoOptions({
        option1: shuffled[0],
        option2: shuffled[1] || shuffled[0],
      });
    } else {
      setVideoOptions(null);
    }
  }, [filteredRewardVideos]);

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

  // Navigate automatically when video ends
  useEffect(() => {
    if (videoEnded) {
      handleNavigation();
    }
  }, [videoEnded, handleNavigation]);

  const renderCard = (option) => (
    <button
      type="button"
      onClick={() => setSelectedVideo(option)}
      className="flex-1 rounded-3xl overflow-hidden shadow-xl border-2 border-white/20 bg-slate-800/80 hover:bg-slate-700/90 transition-transform duration-150 hover:scale-[1.02] text-white"
    >
      <div className="w-full aspect-video bg-slate-900 overflow-hidden">
        {option.thumbnailUrl ? (
          <img src={option.thumbnailUrl} alt={option.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No thumbnail</div>
        )}
      </div>
      <div className="px-4 py-3 text-center">
        <div className="text-lg sm:text-xl font-extrabold tracking-wide uppercase">
          {option.name.length <= 16 ? option.name : option.name.slice(0, 14) + "..."}
        </div>
      </div>
    </button>
  );

  useEffect(() => {
    if (selectedVideo || !videoOptions) return;

    const options = [videoOptions.option1, videoOptions.option2].filter(Boolean);
    if (options.length === 0) return;

    const timeoutId = setTimeout(() => {
      const randomPick = options[Math.floor(Math.random() * options.length)];
      setSelectedVideo(randomPick);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [selectedVideo, videoOptions]);

  // Phase 1: Selection Screen
  if (!selectedVideo) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-10 text-yellow-300 drop-shadow-lg text-center">
          Congrats 🎉 Belt Earned !
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-3xl">
          {videoOptions ? (
            <>
              {renderCard(videoOptions.option1)}
              {renderCard(videoOptions.option2)}
            </>
          ) : (
            <p className="text-white">Loading rewards...</p>
          )}
        </div>
      </div>
    );
  }

 // Phase 2: Video Player (iOS-safe, GameModeVideoScreen style)
return (
  <div className="fixed inset-0 bg-black flex items-center justify-center">
    <video
      ref={videoRef}
      src={selectedVideo.url}
      muted
      playsInline
      preload="auto"
      autoPlay
      onEnded={() => setVideoEnded(true)}
      className="w-full h-full object-contain pointer-events-none"
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
        🔊 Tap for sound
      </button>
    )}
  </div>
)

};

export default VideoPlayerScreen;
