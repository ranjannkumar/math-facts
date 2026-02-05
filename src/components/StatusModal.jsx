import React from 'react';

const TYPE_STYLES = {
  error: {
    title: 'Something went wrong',
    accent: 'from-red-500 to-rose-500',
    ring: 'ring-red-200',
    button: 'bg-red-500 hover:bg-red-600',
    icon: '!',
  },
  info: {
    title: 'Heads up',
    accent: 'from-blue-500 to-sky-500',
    ring: 'ring-blue-200',
    button: 'bg-blue-500 hover:bg-blue-600',
    icon: 'i',
  },
};

const StatusModal = ({
  type = 'error',
  title,
  message,
  primaryLabel = 'OK',
  onPrimary,
  secondaryLabel,
  onSecondary,
}) => {
  const palette = TYPE_STYLES[type] || TYPE_STYLES.error;
  const resolvedTitle = title || palette.title;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center animate-fade-in modal-safe">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 flex flex-col items-center text-center animate-pop-in">
        <div
          className={`w-14 h-14 rounded-full bg-gradient-to-br ${palette.accent} text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg ring-4 ${palette.ring}`}
        >
          {palette.icon}
        </div>
        <h2 className="text-2xl font-extrabold mb-2 text-gray-900">{resolvedTitle}</h2>
        <p className="text-gray-700 text-base leading-relaxed">{message}</p>
        <div className="mt-6 w-full flex flex-col gap-2 sm:flex-row sm:justify-center">
          {secondaryLabel ? (
            <button
              className="kid-btn bg-gray-200 hover:bg-gray-300 text-gray-800 w-full sm:w-auto"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            className={`kid-btn ${palette.button} text-white w-full sm:w-auto`}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
