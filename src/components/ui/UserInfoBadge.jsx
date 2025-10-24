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
            className="fixed z-50 bg-green-700/80 hover:bg-gray-800 text-white font-bold rounded-full py-2.5 px-2.5   transition-all duration-300 flex items-center"
            style={{
                // Positioned next to the settings icon (which is at 'right: 4')
                top: 'max(env(safe-area-inset-top), 2.5rem)',
                right: 'max(env(safe-area-inset-right), 6.5rem)',
                transform: 'translateY(-2px)' // Slight lift for visual effect
            }}
        >
            <span className="text-lg leading-none whitespace-nowrap overflow-hidden  ">
                {childName}#{childPin}
            </span>
        </div>
    );
};

export default UserInfoBadge;