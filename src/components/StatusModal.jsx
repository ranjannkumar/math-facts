import React, { useEffect, useRef } from 'react';

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
  enableAutoClose = false,
  autoCloseMs = 5000,
}) => {
  const palette = TYPE_STYLES[type] || TYPE_STYLES.error;
  const resolvedTitle = title || palette.title;
  const didPrimaryRunRef = useRef(false);
  const onPrimaryRef = useRef(onPrimary);
  const shouldAutoClose = enableAutoClose && typeof onPrimary === 'function' && autoCloseMs > 0;

  useEffect(() => {
    onPrimaryRef.current = onPrimary;
  }, [onPrimary]);

  useEffect(() => {
    didPrimaryRunRef.current = false;
  }, [type, title, message, primaryLabel, autoCloseMs]);

  useEffect(() => {
    if (!shouldAutoClose) return undefined;

    const timeoutId = setTimeout(() => {
      if (didPrimaryRunRef.current) return;
      didPrimaryRunRef.current = true;
      onPrimaryRef.current?.();
    }, autoCloseMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [shouldAutoClose, autoCloseMs]);

  const handlePrimaryClick = () => {
    if (didPrimaryRunRef.current) return;
    didPrimaryRunRef.current = true;
    onPrimary?.();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center animate-fade-in modal-safe">
      <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-3xl p-7 sm:p-8 shadow-2xl max-w-md w-full mx-4 flex flex-col items-center text-center animate-pop-in border border-slate-200">
        <div
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${palette.accent} text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg ring-4 ${palette.ring}`}
        >
          {palette.icon}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2 text-slate-900 tracking-tight">{resolvedTitle}</h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-sm font-medium">{message}</p>

        <div className="mt-7 w-full flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
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
            onClick={handlePrimaryClick}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
