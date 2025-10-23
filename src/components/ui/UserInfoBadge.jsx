// src/components/ui/UserInfoBadge.jsx
import React, { useContext } from 'react';
import { MathGameContext } from '../../App.jsx';

/**
 * Displays the logged-in user's name and passcode (PIN)
 * in the top-right corner of the screen.
 */
const UserInfoBadge = () => {
    const { childName, childPin } = useContext(MathGameContext);

    // Only render if logged in (PIN exists)
    if (!childPin || !childName) {
        return null;
    }

    return (
        <div 
            className="fixed z-50 bg-gray-700/80 hover:bg-gray-800 text-white font-bold rounded-full py-2 px-3 shadow-lg border-2 border-gray-600 transition-all duration-300 flex items-center"
            style={{
                // Positioned next to the settings icon (which is at 'right: 4')
                top: 'max(env(safe-area-inset-top), 2.3rem)',
                right: 'max(env(safe-area-inset-right), 7.5rem)',
                transform: 'translateY(-2px)' // Slight lift for visual effect
            }}
            title={`Passcode: ${childPin}`}
        >
            <span className="text-sm sm:text-base leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                {childName}
            </span>
            <span className="text-xs font-mono ml-2 opacity-70">
                ({childPin})
            </span>
        </div>
    );
};

export default UserInfoBadge;