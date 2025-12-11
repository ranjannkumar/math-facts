import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';
import { getUserQuestionStats } from '../api/mathApi.js'; // This will call the mock function

const UserQuestionStats = () => {
  // Get pin and name from the URL parameters
  const { pin: userPin, name: encodedName } = useParams();
  const name = decodeURIComponent(encodedName);
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const adminPin = localStorage.getItem('math-admin-pin');

  const fetchStats = useCallback(async () => {
    // Basic authorization and data check
    if (!adminPin || adminPin !== '7878' || !userPin) {
      navigate('/name');
      return;
    }

    try {
      setLoading(true);
      // Calls the function from mathApi.js, which currently returns mock data
      const data = await getUserQuestionStats(adminPin, userPin);
      
      // Sort stats by encountered count descending
      const sortedStats = Array.isArray(data) 
        ? data.sort((a, b) => b.encountered - a.encountered) 
        : [];
      
      setStats(sortedStats);
      setError(null);
    } catch (e) {
      console.error(`Failed to fetch stats for user ${userPin}:`, e);
      // Display a generic error message for the mock data failure scenario
      setError(e.message || `Failed to fetch question stats for ${name || userPin}. Check the mock data function.`);
    } finally {
      setLoading(false);
    }
  }, [adminPin, userPin, name, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem('math-admin-pin');
    navigate('/name', { replace: true });
  };

  const dashboardStyle = {
    backgroundImage: "url('/night_sky_landscape.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
    paddingTop: 'max(env(safe-area-inset-top), 1rem)',
    paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={dashboardStyle}>
        <p className="text-white text-2xl animate-pulse">Loading {name}'s Question Stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4" style={dashboardStyle}>
        <h1 className="text-white text-3xl font-bold mb-4">Question Stats Error</h1>
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="kid-btn bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        <button
          onClick={handleLogout}
          className="kid-btn bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center"
        >
          <FaSignOutAlt className="mr-2" /> Logout
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={dashboardStyle}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold drop-shadow">
          Question Stats for {name} (<span className="tabular-nums">#{userPin}</span>)
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="bg-blue-600/90 hover:bg-blue-700/90 text-white font-semibold py-2 px-4 rounded-xl shadow transition flex items-center"
          >
            <FaArrowLeft className="mr-1" size={16} /> Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600/90 hover:bg-red-700/90 text-white font-semibold py-2 px-4 rounded-xl shadow transition flex items-center"
          >
            <FaSignOutAlt className="mr-1" size={16} /> Logout
          </button>
        </div>
      </div>

      {stats.length === 0 ? (
        <p className="text-white/80 text-xl text-center">
            No question history found for {name}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-2xl bg-white/10 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/80 text-white">
              <tr>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Question Type
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Encountered
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-green-400">
                  Correct
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-red-400">
                  Wrong
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700 text-white">
              {stats.map((item, index) => {
                const accuracy = item.encountered > 0 
                    ? ((item.correct / item.encountered) * 100).toFixed(0) 
                    : 'N/A';
                const accuracyColor = accuracy === 'N/A' || accuracy >= 80 
                    ? 'text-green-400' 
                    : accuracy >= 50 
                    ? 'text-yellow-400' 
                    : 'text-red-400';

                return (
                  <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-semibold">
                      {item.question}
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums">
                      {item.encountered}
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums text-green-400 font-bold">
                      {item.correct}
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums text-red-400 font-bold">
                      {item.wrong}
                    </td>
                    <td className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums font-bold ${accuracyColor}`}>
                      {accuracy !== 'N/A' ? `${accuracy}%` : accuracy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserQuestionStats;