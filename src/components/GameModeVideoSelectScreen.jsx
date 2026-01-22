import React, { useContext, useEffect } from "react";
import { MathGameContext } from "../App.jsx";
import { useNavigate } from "react-router-dom";

const GameModeVideoSelectScreen = () => {
  const { videoOptions, handleVideoSelection } = useContext(MathGameContext);
  const navigate = useNavigate();

  // Redirect if no options are set (e.g., direct access)
  useEffect(() => {
    if (!videoOptions) {
      navigate("/game-mode", { replace: true });
    }
  }, [videoOptions, navigate]);

  useEffect(() => {
    if (!videoOptions) return;

    const timeoutId = setTimeout(() => {
      const options = [videoOptions.option1, videoOptions.option2].filter(Boolean);
      if (options.length === 0) return;
      const randomPick = options[Math.floor(Math.random() * options.length)];
      handleVideoSelection(randomPick);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [videoOptions, handleVideoSelection]);

  if (!videoOptions) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        Loading…
      </div>
    );
  }

  const renderCard = (option, accentClass) => {
    const displayName =
      option.name.length <= 16
        ? option.name.toUpperCase()
        : option.name.slice(0, 14).toUpperCase() + "…";

    return (
      <button
        type="button"
        onClick={() => handleVideoSelection(option)}
        className={`flex-1 rounded-3xl overflow-hidden shadow-xl border-2 border-white/20 bg-slate-800/80 hover:bg-slate-700/90 transition-transform duration-150 ${accentClass}`}
      >
        <div className="w-full aspect-video bg-slate-900 overflow-hidden">
          {option.thumbnailUrl ? (
            <img
              src={option.thumbnailUrl}
              alt={option.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              No thumbnail
            </div>
          )}
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-lg sm:text-xl font-extrabold tracking-wide">
            {displayName}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center px-4 text-white">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-10 text-yellow-300 drop-shadow-lg text-center">
        Speed Bonus Unlocked! ⚡
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-3xl">
        {renderCard(videoOptions.option1, "hover:scale-[1.02]")}
        {renderCard(videoOptions.option2, "hover:scale-[1.02]")}
      </div>
      
    </div>
  );
};

export default GameModeVideoSelectScreen;
