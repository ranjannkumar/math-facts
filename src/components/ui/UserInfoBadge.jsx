import React, { useContext } from 'react';
import { MathGameContext } from '../../App.jsx';

const UserInfoBadge = () => {
  const { childName, childPin } = useContext(MathGameContext);

  if (!childPin || !childName) return null;

  return (
    <div
      className="
        fixed z-50 select-none
        rounded-2xl px-3.5 py-2.5
        bg-gradient-to-br from-slate-800/85 to-slate-700/70
        backdrop-blur-md
        ring-1 ring-white/15 shadow-lg
        hover:from-slate-800/95 hover:to-slate-700/90
        transition-all duration-300 group
        flex items-center
      "
      style={{
        top: 'max(env(safe-area-inset-top), 1.8rem)',
        right: 'max(env(safe-area-inset-right), 6.75rem)',
        transform: 'translateY(-2px)',
      }}
    >
    <span className="flex flex-col items-start text-left leading-snug text-white drop-shadow-sm">
      <span
        className="text-base font-bold tracking-normal max-w-[11rem] sm:max-w-[12rem] truncate"
        title={childName}
      >
        {childName}
      </span>

      <span className="mt-0.5 text-[17px] font-bold tabular-nums opacity-90">
        #{childPin}
      </span>
    </span>
    </div>
  );
};

export default UserInfoBadge;
