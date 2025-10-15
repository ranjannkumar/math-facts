// src/components/NameForm.jsx
import React, { useContext, useEffect, useState } from 'react';
import { MathGameContext } from '../App.jsx';

const NameForm = () => {
  const {
    childPin,
    childName, 
    handleNameChange,
    handlePinChange,
    handlePinSubmit,
  } = useContext(MathGameContext);

  const [error, setError] = useState('');

    useEffect(() => {
    handlePinChange({ target: { value: '' } });
  }, [handlePinChange]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const nameToSubmit = childName.trim(); // Use current childName from context
    const pinToSubmit = childPin.trim(); 
    if (!nameToSubmit || nameToSubmit.length < 2) { //  Name validation
        setError('Please enter a valid name (at least 2 characters).');
        return;
    }
    if (!pinToSubmit || pinToSubmit.length < 2) {
      setError('Please enter a valid Passcode (at least 2 characters).');
      return;
    }
    setError('');
    
    try {
        await handlePinSubmit(pinToSubmit, nameToSubmit); // Pass both PIN and Name
    } catch (err) {
        setError(err.message || 'Login failed. Please check your name and passcode.');
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
// put this near the top of the component, before return:
const inputBaseClass =
  "block w-full max-w-xs mx-auto box-border mb-4 sm:mb-6 px-4 sm:px-6 h-14 sm:h-16 " +
  "rounded-xl sm:rounded-2xl opacity-80 text-white font-bold text-center text-4xl tracking-widest " +
  "transition-all duration-200 bg-gray-800/50 " +
  "appearance-none outline-none ring-0 border-0 shadow-none " +
  "focus:outline-none focus:ring-0 focus:border-0";




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
      <style>{`
        /* kill autofill white */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(31,41,55,0.5) inset !important;
          transition: background-color 9999s ease-in-out 0s !important;
          caret-color: #ffffff;
        }
        /* nuke any UA border/shadow/focus ring on our inputs */
        input[data-flat-input]{
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
          -webkit-appearance:none !important;
                  appearance:none !important;
        }
        input[data-flat-input]:focus,
        input[data-flat-input]:focus-visible{
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
        }
      `}</style>


      <div className="bg-white/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-full flex flex-col items-center relative z-10 mx-2 sm:mx-4 w-full max-w-sm backdrop-blur-md">

        <form onSubmit={onSubmit} className="w-full flex flex-col items-center" autoComplete="off">
          {/* Name Input Field */}
          <label className="text-xl sm:text-2xl md:text-3xl text-center font-sans text-white font-semibold tracking-wide mb-2 sm:mb-3">
             Enter Your Name
          </label>
          <input
            data-flat-input
            className={inputBaseClass}
            value={childName}
            onChange={handleNameChange}
            type="text"
            maxLength={15}
            autoFocus
            autoComplete="off"
            name="child-name"
          />
          {/* Passcode Input Field */}
          <label className="text-xl sm:text-2xl md:text-3xl text-center font-sans text-white font-semibold tracking-wide mb-2 sm:mb-3">
             Enter Your Passcode
          </label>

          <input
          data-flat-input
            className={inputBaseClass}
            value={childPin || ''}
            readOnly
            type="password"
            maxLength={4}
            inputMode="none"
            autoComplete="new-password"
            name="passcode"
          />

          <div className="grid grid-cols-4 gap-2 mb-1 mx-auto justify-items-center">
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