// src/components/NameForm.jsx

import React, { useContext, useEffect, useState } from 'react';
import { MathGameContext } from '../App.jsx';
import { getAdminStats } from '../api/mathApi.js';
import { FaUserShield } from 'react-icons/fa';

const inputBaseClass =
  "block w-full max-w-xs mx-auto box-border mb-4 sm:mb-6 px-4 sm:px-6 h-14 sm:h-16 " +
  "rounded-xl sm:rounded-2xl opacity-80 text-white font-bold text-center text-4xl tracking-widest " +
  "transition-all duration-200 bg-gray-800/50 " +
  "appearance-none outline-none ring-0 border-0 shadow-none " +
  "focus:outline-none focus:ring-0 focus:border-0";


const AdminPinModal = ({
    setShowAdminPinModal,
    navigate,
    getAdminStats,
}) => {
    const [error, setError] = useState('');
    const [adminPin, setAdminPin] = useState('');
    const [isAdminLoading, setIsAdminLoading] = useState(false);

    const handleAdminKeypadInput = (key) => {
        if (isAdminLoading) return;
        if (key === 'C') return setAdminPin('');
        if (key.length === 1 && !isNaN(key) && adminPin.length < 4) {
            setAdminPin(adminPin + key);
        }
    };

    const AdminKeypadButton = ({ value, label, className }) => (
        <button
            type="button"
            onClick={() => handleAdminKeypadInput(value)}
            className={`h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center ${className || ''}`}
            tabIndex="-1"
            disabled={isAdminLoading}
        >
            {label || value}
        </button>
    );

    const handleAdminPinSubmit = async () => {
        setError('');
        if (adminPin !== '7878') {
            setError('Incorrect Admin PIN.');
            return;
        }
        if (isAdminLoading) return;
        
        setIsAdminLoading(true);

        try {
            await getAdminStats(adminPin);
            localStorage.setItem('math-admin-pin', adminPin);
            setShowAdminPinModal(false);
            navigate('/admin-dashboard');
        } catch (e) {
            setError('Admin access failed: ' + (e.message || 'Server error.'));
            setShowAdminPinModal(true);
        } finally {
            setIsAdminLoading(false);
            setAdminPin('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in"
             style={{
                 backgroundImage: "url('/night_sky_landscape.jpg')",
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 backgroundRepeat: 'no-repeat',
                 backdropFilter: 'blur(4px)',
             }}
        >
            <div
                className="bg-white/30 rounded-xl sm:rounded-2xl p-6 shadow-full flex flex-col items-center relative z-10 w-full max-w-sm backdrop-blur-md animate-pop-in"
            >
                <h2 className="text-2xl sm:text-3xl text-center font-sans text-white font-semibold tracking-wide mb-4">
                    Enter Admin PIN
                </h2>
                <input
                    data-flat-input
                    className={inputBaseClass + " text-center"}
                    value={adminPin}
                    readOnly
                    type="password"
                    maxLength={4}
                    inputMode="none"
                    name="admin-passcode"
                />
                <div className="grid grid-cols-4 gap-2 mb-4 mx-auto justify-items-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <AdminKeypadButton key={num} value={String(num)} />
                    ))}
                    <AdminKeypadButton value="0" />
                    <AdminKeypadButton
                        value="C"
                        className="col-span-2"
                        label={<span className="text-lg w-full text-center">CLEAR</span>}
                    />
                </div>
                <div className="flex justify-center space-x-4 w-full">
                    <button
                        type="button"
                        onClick={handleAdminPinSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1"
                        disabled={adminPin.length !== 4 || isAdminLoading}
                    >
                        {isAdminLoading ? 'Checking...' : 'Enter'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowAdminPinModal(false);
                            setError('');
                        }}
                        className="bg-gray-400 hover:bg-gray-500 text-gray-800 font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1"
                        disabled={isAdminLoading}
                    >
                        Cancel
                    </button>
                </div>
                {error && <div className="text-red-300 text-sm mt-2 text-center">{error}</div>}
            </div>
        </div>
    );
};
// End AdminPinModal


const NameForm = () => {
  const {
    childPin,
    childName, 
    handleNameChange,
    handlePinChange,
    handlePinSubmit,
    isLoginLoading,
    handleDemoLogin,
    navigate,
  } = useContext(MathGameContext);

  const [error, setError] = useState('');
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);


  useEffect(() => {
    if (!showAdminPinModal) { 
        handlePinChange({ target: { value: '' } });
    }
  }, [handlePinChange, showAdminPinModal]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const nameToSubmit = childName.trim(); 
    const pinToSubmit = childPin.trim(); 
    if (!nameToSubmit || nameToSubmit.length < 2) { 
        setError('Please enter a valid name (at least 2 characters).');
        return;
    }
    if (!pinToSubmit || pinToSubmit.length < 2) {
      setError('Please enter a valid Passcode (at least 2 characters).');
      return;
    }
    if (isLoginLoading) return;
    setError('');
    
    try {
        await handlePinSubmit(pinToSubmit, nameToSubmit); 
    } catch (err) {
        setError(err.message || 'Login failed. Please check your name and passcode.');
    }
  };

  const handleUserKeypadInput = (key) => { 
    let newPin = childPin;
    
    if (key === 'C') {
        newPin = '';
    } else if (key === '<') {
        newPin = childPin.slice(0, -1);
    } else if (childPin.length < 4) {
        newPin = childPin + key;
    }

    handlePinChange({ target: { value: newPin } });
  };
  
  const UserKeypadButton = ({ value, label, className }) => (
    <button
        type="button"
        onClick={() => handleUserKeypadInput(value)} 
        className={`h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center ${className || ''}`}
        tabIndex="-1" 
    >
        {label || value}
    </button>
);


const handleDemoClick = () => {
      if (isLoginLoading) return;
      setError('');
      handleDemoLogin();
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
        
        /* FIX: Ensure the main form background does not show a focus ring */
        .no-focus-ring:focus, .no-focus-ring:focus-visible { /* [!code ++] */
          outline: none !important; /* [!code ++] */
          box-shadow: none !important; /* [!code ++] */
          border-color: transparent !important; /* [!code ++] */
        } /* [!code ++] */

      `}</style>
      
      <button
        type="button"
        onClick={() => {
          setError('');
          setShowAdminPinModal(true);
        }}
        className="fixed z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-lg border-2 border-gray-400 focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center space-x-1"
        style={{
          top: 'max(env(safe-area-inset-top), 0.5rem)',
          left: 'max(env(safe-area-inset-left), 0.5rem)',
        }}
        aria-label="Admin Login"
      >
        <FaUserShield size={20} />
        <span className="text-sm font-semibold">Admin</span>
      </button>

      <div className="bg-white/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-full flex flex-col items-center relative z-10 mx-2 sm:mx-4 w-full max-w-sm backdrop-blur-md">

        <form onSubmit={onSubmit} className="w-full flex flex-col items-center" autoComplete="off">
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
              <UserKeypadButton key={num} value={String(num)} />
            ))}
            <UserKeypadButton value="0" />
            <UserKeypadButton 
              value="C" 
              className="col-span-2" 
              label={<span className="text-lg w-full text-center">CLEAR</span>} 
            />
          </div>

          {error && (
            <div className="text-red-300 text-sm mb-2 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center space-x-4 mt-2">
            <button
              type="submit"
              className="bg-green-800 hover:bg-green-900 text-white font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? 'Loading...' : 'Start'}
            </button>
            
            <button
              type="button"
              onClick={handleDemoClick}
              className="bg-green-800 hover:bg-green-900 text-white font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1"
              disabled={isLoginLoading}
            >
              Demo 
            </button>
          </div>
        </form>
      </div>
      
      {showAdminPinModal && (
        <AdminPinModal 
          setShowAdminPinModal={setShowAdminPinModal}
          navigate={navigate}
          getAdminStats={getAdminStats}
        />
      )}
    </div>
  );
};

export default NameForm;