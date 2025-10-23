import React, { useContext } from 'react';
import { MathGameContext } from '../App.jsx';

const SiblingCheckModal = () => {
    const { 
        showSiblingCheck, 
        loginPendingName, 
        handleSiblingCheck 
    } = useContext(MathGameContext);

    // Only render if the flag is true and we have a name
    if (!showSiblingCheck || !loginPendingName) {
        return null;
    }
    
    const userName = loginPendingName || 'this user';
    
    const handleYes = () => handleSiblingCheck(true);
    const handleNo = () => handleSiblingCheck(false);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] animate-fade-in">
            <div 
                className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full flex flex-col items-center animate-pop-in"
                style={{
                    background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                    border: '4px solid white',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.2) inset'
                }}
            >
                <h2 className="text-3xl font-extrabold text-white mb-6">
                    Are you <span className="font-extrabold text-yellow-300">{userName}</span> ?
                </h2>
                {/* <h2 className="text-3xl font-bold mb-4">Confirm To Quit ?</h2> */}
                {/* --- Button Group --- */}
                <div className="flex justify-between w-full space-x-4">
                    <button 
                        className="kid-btn bg-green-600 hover:bg-green-700 text-white flex-1" 
                        onClick={handleYes}
                    >
                        YES
                    </button>
                    <button 
                        className="kid-btn bg-red-600 hover:bg-red-700 text-white flex-1" 
                        onClick={handleNo}
                    >
                        NO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SiblingCheckModal;