// src/components/ThemePicker.jsx
import React, { useState, useContext, useMemo } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate as useRRNavigate } from 'react-router-dom';
import { themeConfigs, ageThemeMap } from '../utils/mathGameLogic.js';
import { MathGameContext } from '../App.jsx';

const cardTitle = (key) =>
  key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

const ThemePicker = () => {
  const ctx = useContext(MathGameContext);
  const rrNavigate = useRRNavigate();
  const navigate = ctx?.navigate || rrNavigate; // safe fallback
  const setSelectedTheme = ctx?.setSelectedTheme || (() => {});

  const [themePickerMode] = useState('slide');
  const [currentThemeIdx, setCurrentThemeIdx] = useState(0);

  // 1) Age → preferred theme keys
  const age = localStorage.getItem('math-child-age') || '5';
  const preferredKeys = useMemo(() => {
    try {
      const keys = ageThemeMap(age);
      return Array.isArray(keys) ? keys : [];
    } catch {
      return [];
    }
  }, [age]);

  // 2) Build themes list from config; if preferred is empty or mismatched, fall back to all
  const themes = useMemo(() => {
    const allKeys = Object.keys(themeConfigs);
    const keys =
      preferredKeys.filter((k) => allKeys.includes(k)).length > 0
        ? preferredKeys.filter((k) => allKeys.includes(k))
        : allKeys;

    const list = keys
      .map((k) => (themeConfigs[k] ? { key: k, ...themeConfigs[k] } : null))
      .filter(Boolean);

    // Absolute last resort: single default item
    return list.length
      ? list
      : [{ key: 'space', image: '', tableEmojis: ['🚀', '🛰️', '🪐', '🌌', '☄️', '⭐'] }];
  }, [preferredKeys]);

  const currentTheme =
    themes[Math.min(Math.max(currentThemeIdx, 0), themes.length - 1)];

  const handleBackToNameForm = () => navigate('/name');

  const gotoPrev = () => {
    if (!themes.length) return;
    setCurrentThemeIdx((i) => (i - 1 + themes.length) % themes.length);
  };

  const gotoNext = () => {
    if (!themes.length) return;
    setCurrentThemeIdx((i) => (i + 1) % themes.length);
  };

  const handleChooseTheme = () => {
    if (!themes.length || !currentTheme) return;
    // Persist the whole theme object (key + config) into context
    setSelectedTheme(currentTheme);
    try { localStorage.setItem('math-selected-theme', currentTheme.key); } catch {}
    navigate('/levels');
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center ${
        themePickerMode === 'grid'
          ? 'justify-start overflow-y-auto'
          : 'justify-center overflow-hidden'
      }`}
      style={{
        background: 'linear-gradient(135deg, #23272f 0%, #18181b 60%, #111113 100%)',
        width: '100vw',
        minHeight: '100vh',
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      <button
        className="fixed z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-lg border-2 border-gray-400 focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95"
        style={{
          fontSize: 'clamp(1rem, 4vw, 1.5rem)',
          top: 'max(env(safe-area-inset-top), 0.5rem)',
          left: 'max(env(safe-area-inset-left), 0.5rem)',
        }}
        onClick={handleBackToNameForm}
        aria-label="Back to Name and Avatar"
      >
        <FaArrowLeft size={24} />
      </button>

      <h1
        className="font-baloo text-white text-center drop-shadow-lg"
        style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}
      >
        Choose Your Adventure!
      </h1>

      {themePickerMode === 'slide' && (
        <>
          <div
            className="flex flex-row items-center justify-center w-full mb-4"
            style={{ minHeight: 'clamp(200px, 40vh, 320px)' }}
          >
            <button
              className="kid-btn bg-yellow-300 hover:bg-yellow-400 text-white rounded-full mr-1"
              style={{
                fontSize: '16px',
                padding: '1px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={gotoPrev}
              aria-label="Previous Adventure"
              disabled={!themes.length}
              title={!themes.length ? 'No themes available' : 'Previous'}
            >
              &#8592;
            </button>

            <div
              className="flex flex-col items-center justify-center"
              style={{
                minWidth: 'clamp(200px, 60vw, 640px)',
                maxWidth: 'clamp(300px, 80vw, 840px)',
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="relative rounded-2xl overflow-hidden shadow-2xl w-full"
                  style={{
                    height: 'clamp(150px, 35vh, 520px)',
                  }}
                >
                  {currentTheme?.image ? (
                    <img
                      src={currentTheme.image}
                      alt={currentTheme.key}
                      className="rounded-2xl object-cover w-full h-full"
                    />
                  ) : (
                    // Fallback visual if image missing
                    <div className="text-7xl sm:text-8xl md:text-9xl select-none">
                      {(currentTheme?.tableEmojis && currentTheme.tableEmojis[0]) || '🎨'}
                    </div>
                  )}
                </div>
                <span
                  className="font-baloo text-white drop-shadow-lg text-center font-bold bg-black bg-opacity-50 px-3 py-2 rounded-2xl border-2 border-yellow-200 mt-2"
                  style={{ fontSize: 'clamp(0.85rem, 3vw, 1.5rem)' }}
                >
                  {cardTitle(currentTheme?.key || 'Theme')}
                </span>
              </div>
            </div>

            <button
              className="kid-btn bg-yellow-300 hover:bg-yellow-400 text-white rounded-full ml-1"
              style={{
                fontSize: '16px',
                padding: '1px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={gotoNext}
              aria-label="Next Adventure"
              disabled={!themes.length}
              title={!themes.length ? 'No themes available' : 'Next'}
            >
              &#8594;
            </button>
          </div>

          <button
            className={`kid-btn text-white font-bold rounded-2xl mt-2 ${
              themes.length ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'
            }`}
            style={{
              padding: 'clamp(0.5rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
              fontSize: 'clamp(0.875rem, 3vw, 1.25rem)',
            }}
            onClick={handleChooseTheme}
            disabled={!themes.length}
          >
            {themes.length ? 'Choose' : 'No Themes Available'}
          </button>
        </>
      )}
    </div>
  );
};

export default ThemePicker;
