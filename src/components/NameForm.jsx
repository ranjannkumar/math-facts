// src/components/NameForm.jsx

import React, { useContext, useEffect, useState } from 'react';
import { MathGameContext } from '../App.jsx';
import { getAdminStats } from '../api/mathApi.js';
import { FaUserShield } from 'react-icons/fa';

const formInputClass =
  "!w-full !max-w-[320px] sm:!max-w-[340px] mx-auto mb-2 sm:mb-3 h-10 sm:h-12 " +
  "px-3 sm:px-4 !rounded-2xl text-gray-800 font-bold text-center " +
  "text-2xl sm:text-3xl tracking-widest !bg-white !border-4 !border-green-300 " +
  "shadow-lg focus:outline-none focus:ring-0";
const labelClass =
  "text-base sm:text-lg md:text-xl text-center font-sans text-green-600 font-semibold tracking-wide mb-1";
const panelClass =
  "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl sm:rounded-3xl " +
  "p-3 sm:p-4 shadow-2xl flex flex-col items-center relative z-10 mx-2 sm:mx-4 " +
  "w-full max-w-sm border border-blue-200/30 backdrop-blur-md";


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
            className={`h-10 sm:h-12 w-full bg-gray-100 text-gray-900 text-center font-bold text-sm rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200 flex items-center justify-center ${className || ''}`}
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
                className={`${panelClass} animate-pop-in`}
            >
                <h2 className="text-base sm:text-lg md:text-xl text-center font-sans text-green-600 font-semibold tracking-wide mb-2">
                    Enter Admin PIN
                </h2>
                <input
                    className={formInputClass + " text-center"}
                    value={adminPin}
                    readOnly
                    type="password"
                    maxLength={4}
                    inputMode="none"
                    name="admin-passcode"
                />
                <div className="grid grid-cols-4 gap-2 mb-3 mx-auto justify-items-center w-full max-w-[320px] sm:max-w-[340px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <AdminKeypadButton key={num} value={String(num)} />
                    ))}
                    <AdminKeypadButton value="0" />
                    <AdminKeypadButton
                        value="C"
                        className="col-span-2 bg-gray-200 text-gray-800 font-semibold border-gray-300"
                        label={<span className="text-lg w-full text-center">CLEAR</span>}
                    />
                </div>
                <div className="flex justify-center space-x-2 w-full">
                    <button
                        type="button"
                        onClick={handleAdminPinSubmit}
                        className="bg-green-800 hover:bg-green-900 text-white font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm max-w-[140px]"
                        disabled={adminPin.length !== 4 || isAdminLoading}
                    >
                        {/* {isAdminLoading ? 'Checking...' : 'Enter'} */}
                        Enter
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowAdminPinModal(false);
                            setError('');
                        }}
                        className="bg-gray-400 hover:bg-gray-500 text-gray-800 font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm max-w-[140px]"
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
      className={`h-10 sm:h-12 w-full bg-gray-100 text-gray-900 text-center font-bold text-sm sm:text-base rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200 flex items-center justify-center ${className || ''}`}
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

      <div className={panelClass}>

        <form onSubmit={onSubmit} className="w-full flex flex-col items-center" autoComplete="off">
          <label className={labelClass}>
             Enter Your Name
          </label>
          <input
            className={formInputClass}
            value={childName}
            onChange={handleNameChange}
            type="text"
            maxLength={15}
            autoComplete="off"
            name="child-name"
          />
          <label className={labelClass}>
             Enter Your Passcode
          </label>

          <input
            className={formInputClass}
            value={childPin || ''}
            readOnly
            type="password"
            maxLength={4}
            inputMode="none"
            autoComplete="new-password"
            name="passcode"
          />

          <div className="grid grid-cols-4 gap-2 mb-1 mx-auto justify-items-center w-full max-w-[320px] sm:max-w-[340px]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <UserKeypadButton key={num} value={String(num)} />
            ))}
            <UserKeypadButton value="9" />
            <UserKeypadButton value="0" />
            <UserKeypadButton 
              value="C" 
              className="col-span-2 bg-gray-200 text-gray-800 font-semibold border-gray-300" 
              label={<span className="text-sm sm:text-base w-full text-center">Clear</span>} 
            />
          </div>

          {error && (
            <div className="text-red-300 text-sm mb-2 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center space-x-2 mt-1">
            <button
              type="submit"
              className="bg-green-800 hover:bg-green-900 text-white font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm"
              disabled={isLoginLoading}
            >
              Start
            </button>
            
            <button
              type="button"
              onClick={handleDemoClick}
              className="bg-green-800 hover:bg-green-900 text-white font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm"
              disabled={isLoginLoading}
            >
              Demo 
            </button>
          </div>
        </form>
      </div>

      {isLoginLoading && (  
        <div 
            className="fixed inset-0 z-[101] flex items-center justify-center animate-fade-in" 
            style={{ 
                backgroundImage: "url('/night_sky_landscape.jpg')", 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                backgroundRepeat: 'no-repeat', 
                backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fallback and slight darkening 
            }} 
        > 
            <div className="text-white text-2xl animate-pulse"> 
                Loading...
            </div> 
        </div>
      )} 
      
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
