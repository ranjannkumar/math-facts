// src/components/NameForm.jsx
import React, { useContext, useEffect, useState } from 'react';
import { MathGameContext } from '../App.jsx';

const NameForm = () => {
  const {
    childPin,
    handlePinChange,
    handlePinSubmit,
  } = useContext(MathGameContext);

  const [error, setError] = useState('');

    useEffect(() => {
    handlePinChange({ target: { value: '' } });
  }, [handlePinChange]);

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

  const handleKeypadInput = (key) => {
    let newPin = childPin;
    
    if (key === 'C') {
        newPin = ''; // Clear
    } else if (key === '<') {
        newPin = childPin.slice(0, -1); // Backspace
    } else if (childPin.length < 4) {
        // Append number (1-9, 0)
        newPin = childPin + key;
    }

    handlePinChange({ target: { value: newPin } });
  };
  
const KeypadButton = ({ value, label, className }) => (
    <button
        type="button"
        onClick={() => handleKeypadInput(value)}
        className={`h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center ${className || ''}`}
        tabIndex="-1" 
    >
        {label || value}
    </button>
);

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

        <form onSubmit={onSubmit} className="w-full flex flex-col items-center" autoComplete="off">
          <label className="text-xl sm:text-2xl md:text-3xl text-center font-sans text-white font-semibold tracking-wide mb-2 sm:mb-3">
             Enter Your Passcode
          </label>

          <input
            className="w-full max-w-[380px] mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-2 rounded-xl sm:rounded-2xl opacity-80 text-white font-bold text-center text-4xl tracking-widest transition-all duration-200 bg-gray-800/50 outline-none focus:ring focus:ring-white/40"
            value={childPin || ''}
            readOnly 
            type="password"
            maxLength={4}
            inputMode="none" 
            autoComplete="new-password"
            name="passcode"   
          />

          <div className="grid grid-cols-4 gap-3 mb-4 mx-auto justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <KeypadButton key={num} value={String(num)} />
            ))}
            {/* Clear, 0, Backspace */}
            <KeypadButton value="0" />
            <KeypadButton 
              value="C" 
              className="col-span-2" 
              label={<span className="text-lg w-full text-center">CLEAR</span>} 
/>
            {/* <KeypadButton value="<" label="⌫" /> */}
          </div>

          {error && (
            <div className="text-red-300 text-sm mb-2 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="bg-green-800 hover:bg-green-900 text-white font-bold py-1.5 sm:py-2 px-6 sm:px-8 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg mt-2"
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameForm;