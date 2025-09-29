// src/components/NameForm.jsx
import React, { useContext, useState } from 'react';
import { MathGameContext } from '../App.jsx';

const NameForm = () => {
  const {
    childPin,
    handlePinChange,
    handlePinSubmit,
  } = useContext(MathGameContext);

  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!childPin || childPin.trim().length < 2) {
      setError('Please enter a valid PIN (at least 2 characters).');
      return;
    }
    setError('');
    
    try {
        await handlePinSubmit(childPin.trim());
    } catch (err) {
        setError(err.message || 'Login failed. Please check your PIN.');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-white/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-full flex flex-col items-center relative z-10 mx-2 sm:mx-4 w-full max-w-sm backdrop-blur-md">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-baloo text-white mb-3 sm:mb-4 drop-shadow-lg">
          Let&apos;s Get Started!
        </h1>

        <form onSubmit={onSubmit} className="w-full flex flex-col items-center">
          <label className="text-lg sm:text-xl md:text-2xl font-comic text-white font-bold mb-1 sm:mb-2">
            PIN
          </label>

          <input
            className="w-full max-w-[180px] mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl opacity-80 text-white font-bold text-center tracking-widest transition-all duration-200 bg-gray-800/50 outline-none focus:ring focus:ring-white/40 placeholder-white/60"
            value={childPin}
            onChange={handlePinChange}
            type="password"
            placeholder=""
            maxLength={4}
            autoComplete="off"
          />

          {error && (
            <div className="text-red-300 text-sm mb-2 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="bg-green-800 hover:bg-green-900 text-white font-bold py-1.5 sm:py-2 px-6 sm:px-8 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameForm;