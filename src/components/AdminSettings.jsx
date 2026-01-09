import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const AdminSettings = () => {
  const navigate = useNavigate();
  const adminPin = localStorage.getItem('math-admin-pin');

  useEffect(() => {
    if (!adminPin || adminPin !== '7878') {
      navigate('/name', { replace: true });
    }
  }, [adminPin, navigate]);

  const dashboardStyle = useMemo(
    () => ({
      backgroundImage: "url('/night_sky_landscape.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      paddingTop: 'max(env(safe-area-inset-top), 1rem)',
      paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
    }),
    []
  );

  const [values, setValues] = useState({
    blackDegree1: '60',
    blackDegree2: '55',
    blackDegree3: '50',
    blackDegree4: '45',
    blackDegree5: '40',
    blackDegree6: '35',
    blackDegree7: '60',
    lightningSuccess: '5',
    accuracyStreak: '4',
    surfGameWins: '5',
    lightningTimer: '2',
    inactivityTimer: '5',
    lightningGamesToPass: '100',
  });

  const handleChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const inputClass =
    'w-32 bg-white/10 rounded-lg pl-3 pr-8 py-2 text-left text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400';
  const cardClass = 'rounded-2xl bg-white/10 border border-white/10 shadow-xl backdrop-blur-sm';
  const sectionTitleClass = 'text-white text-lg font-bold';

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={dashboardStyle}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 shadow transition"
            aria-label="Back to admin dashboard"
          >
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-white text-3xl sm:text-4xl font-extrabold drop-shadow">
            App Configuration
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={sectionTitleClass}>Black Belt Timers</div>
              <p className="text-white/70 text-sm">Seconds per degree (1-7).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[
              ['Degree 1', 'blackDegree1'],
              ['Degree 2', 'blackDegree2'],
              ['Degree 3', 'blackDegree3'],
              ['Degree 4', 'blackDegree4'],
              ['Degree 5', 'blackDegree5'],
              ['Degree 6', 'blackDegree6'],
              ['Degree 7', 'blackDegree7'],
            ].map(([label, key]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-2 bg-white/5 rounded-xl px-4 py-3"
              >
                <span className="text-white/90">{label} </span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values[key]}
                  onChange={handleChange(key)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardClass} p-5 sm:p-6`}>
            <div className={sectionTitleClass}>Game Mode 1 (Speed)</div>
            <p className="text-white/70 text-sm mb-4">Lightning bolt rules and pacing.</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Lightning bolt success</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.lightningSuccess}
                  onChange={handleChange('lightningSuccess')}
                />
              </label>
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Lightning timer (sec)</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.lightningTimer}
                  onChange={handleChange('lightningTimer')}
                />
              </label>
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Lightning count to pass game</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.lightningGamesToPass}
                  onChange={handleChange('lightningGamesToPass')}
                />
              </label>
            </div>
          </div>

          <div className={`${cardClass} p-5 sm:p-6`}>
            <div className={sectionTitleClass}>Game Mode 2 (Accuracy)</div>
            <p className="text-white/70 text-sm mb-4">Streaks and surf wins required.</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Correct answers in a row</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.accuracyStreak}
                  onChange={handleChange('accuracyStreak')}
                />
              </label>
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Number of surf games to pass</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.surfGameWins}
                  onChange={handleChange('surfGameWins')}
                />
              </label>
            </div>
          </div>
        </div>

        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className={sectionTitleClass}>Global Timers</div>
          <p className="text-white/70 text-sm mb-4">Applies to quizzes and both game modes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">Inactivity timer (sec)</span>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={values.inactivityTimer}
                onChange={handleChange('inactivityTimer')}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-emerald-600/90 hover:bg-emerald-700/90 text-white font-semibold py-2 px-6 rounded-xl shadow transition"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
