// src/components/AdminDashboard.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { getAdminStats, userGetProgress } from '../api/mathApi.js';

const MS_PER_SEC = 1000;
const MS_PER_MIN = 60000;

const formatTime = (ms) => {
  if (ms < MS_PER_SEC) return '0s';
  const totalSeconds = Math.round(ms / MS_PER_SEC);
  const hours = Math.floor(totalSeconds / 3600); 
  const minutes = Math.floor((totalSeconds % 3600) / 60); 
  const seconds = totalSeconds % 60;
  
  if (hours > 0) { 
    return `${hours}h ${minutes}m ${seconds}s`;
  } 
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}; 

// Get the current level and belt from the progress object
const getCurrentProgress = (progress) => { 
  if (!progress) return { level: 'N/A', belt: 'N/A' };
  
  const levels = Object.keys(progress)
    .filter(k => k.startsWith('L'))
    .map(k => ({ key: k, level: parseInt(k.substring(1), 10), data: progress[k] }))
    .sort((a, b) => b.level - a.level); // Sort descending to find highest level first

  if (levels.length === 0) return { level: 'N/A', belt: 'N/A' };

  // Find the highest level that is not yet fully completed (or the highest completed level if all are)
  const currentLevelInfo = levels.find(l => l.data.unlocked) || levels[0];
  const levelData = currentLevelInfo.data;
  const levelNumber = currentLevelInfo.level;
  
  const beltsOrder = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
  let currentBelt = 'White'; 
  
  // 1. Check Black Belt Degrees (highest priority for in-progress work)
  if (levelData.black?.unlocked) {
    const completedDegrees = levelData.black.completedDegrees || [];
    const currentDegree = completedDegrees.length + 1;
    currentBelt = `Black Degree ${currentDegree}`;
  } 
  // 2. Check Colored Belts
  else {
    // Find the highest completed or currently unlocked belt
    for (const belt of beltsOrder) {
      if (levelData[belt] && (levelData[belt].unlocked || levelData[belt].completed)) {
        currentBelt = belt.charAt(0).toUpperCase() + belt.slice(1);
      }
    }
  }
  
  if (levelData.completed && !levelData.black?.unlocked) {
      currentBelt = "Level Mastered";
  }

  return { level: `L${levelNumber}`, belt: currentBelt };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const adminPin = localStorage.getItem('math-admin-pin');

  const fetchStats = useCallback(async () => {
    if (!adminPin || adminPin !== '7878') {
      navigate('/name');
      return;
    }

    try {
      setLoading(true);
      const initialData = await getAdminStats(adminPin); 
      
      const statsWithProgressPromises = initialData.map(async (student) => {
        // Fetch progress for each student using their pin
        let currentLevel = 'N/A';
        let currentBelt = 'N/A';
        
        try {
            const progressResponse = await userGetProgress(student.pin);
            const progress = progressResponse.progress;
            const progressInfo = getCurrentProgress(progress);
            currentLevel = progressInfo.level;
            currentBelt = progressInfo.belt;
        } catch (e) {
            console.warn(`Failed to fetch progress for ${student.name} (${student.pin}):`, e);
            currentLevel = 'Error';
            currentBelt = 'Error';
        }
        
        return {
            ...student,
            currentLevel: currentLevel,
            currentBelt: currentBelt,
        };
      });
      
      const finalStats = await Promise.all(statsWithProgressPromises);
      setStats(finalStats);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch admin stats or progress:', e);
      setError(e.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [adminPin, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem('math-admin-pin');
    navigate('/name', { replace: true });
  };
  
  const handleRefresh = () => {
      fetchStats();
  };

  const sortedStats = [...stats].sort((a, b) => {
    // Sort descending (b - a) to put the highest score on top.
    return b.grandTotalCorrect - a.grandTotalCorrect;
  });

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
        <p className="text-white text-2xl animate-pulse">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4" style={dashboardStyle}>
        <h1 className="text-white text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-red-400 text-lg mb-4">{error}</p>
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
          Student Stats
        </h1>
        <div className="flex space-x-2">
            <button
                onClick={handleRefresh}
                className="bg-green-600/90 hover:bg-green-700/90 text-white font-semibold py-2 px-4 rounded-xl shadow transition"
            >
                Refresh
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
        <p className="text-white/80 text-xl text-center">No students found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-2xl bg-white/10 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/80 text-white">
              <tr>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Name (#PIN)
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Logged In Today
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Level 
                </th> 
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider"> 
                  Belt 
                </th> 
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Today Time
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Today Score
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-white">
              {sortedStats.map((student) => (
                <tr 
                  key={student._id} 
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-semibold">
                    {student.name} (<span className="tabular-nums">#{student.pin}</span>)
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                    {student.loggedInToday ? '✅ Yes' : '❌ No'}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm"> 
                    {student.currentLevel} 
                  </td> 
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium"> 
                    {student.currentBelt} 
                  </td> 
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums">
                    {formatTime(student.todayActiveMs)}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums">
                    {student.todayCorrect}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm tabular-nums">
                    {formatTime(student.grandTotalActiveMs)} 
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-bold tabular-nums">
                    {student.grandTotalCorrect}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;