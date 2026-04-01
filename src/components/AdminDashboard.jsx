import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';
import { getAdminStats, userGetProgress } from '../api/mathApi.js';

const MS_PER_SEC = 1000;
// const MS_PER_MIN = 60000;

const formatTime = (ms) => {
  const safeMs = Number(ms);
  if (!Number.isFinite(safeMs) || safeMs < MS_PER_SEC) return '0s';
  const totalSeconds = Math.round(safeMs / MS_PER_SEC);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const OPERATION_ORDER = ['add', 'sub', 'mul', 'div'];

const getBeltLabel = (levelData = {}) => {
  const beltsOrder = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
  let currentBelt = 'White';

  if (levelData.black?.unlocked) {
    const completedDegrees = Array.isArray(levelData.black?.completedDegrees)
      ? levelData.black.completedDegrees
      : [];
    const currentDegree = Math.min(completedDegrees.length + 1, 7);
    currentBelt = `Black Degree ${currentDegree}`;
  } else {
    for (const belt of beltsOrder) {
      if (levelData[belt] && (levelData[belt].unlocked || levelData[belt].completed)) {
        currentBelt = belt.charAt(0).toUpperCase() + belt.slice(1);
      }
    }
  }

  if (levelData.completed && !levelData.black?.unlocked) {
    return 'Level Mastered';
  }
  return currentBelt;
};

const parseLevelsFromNode = (node = {}) =>
  Object.keys(node)
    .filter((k) => k.startsWith('L'))
    .map((k) => ({ key: k, level: parseInt(k.substring(1), 10), data: node[k] }))
    .filter((x) => Number.isFinite(x.level))
    .sort((a, b) => a.level - b.level);

const pickCurrentLevelFromLevels = (levelsAsc = []) => {
  if (!levelsAsc.length) return null;

  const unlockedLevels = levelsAsc.filter((l) => !!l.data?.unlocked);
  const highestUnlockedIncomplete = [...unlockedLevels]
    .reverse()
    .find((l) => !l.data?.completed);

  return highestUnlockedIncomplete || unlockedLevels[unlockedLevels.length - 1] || levelsAsc[0];
};

const getCurrentProgress = (progress) => {
  if (!progress) return { level: 'N/A', belt: 'N/A' };

  // Backward-compatible: old flat format { L1, L2, ... }
  const flatLevels = parseLevelsFromNode(progress);
  if (flatLevels.length > 0) {
    const currentLevelInfo = pickCurrentLevelFromLevels(flatLevels);
    if (!currentLevelInfo) return { level: 'N/A', belt: 'N/A' };
    return {
      level: `L${currentLevelInfo.level}`,
      belt: getBeltLabel(currentLevelInfo.data),
    };
  }

  // New format: operation-scoped { add: {L1...}, sub: {L1...}, ... }
  const opSnapshots = OPERATION_ORDER.map((operation) => {
    const levels = parseLevelsFromNode(progress?.[operation] || {});
    if (!levels.length) return null;
    const current = pickCurrentLevelFromLevels(levels);
    if (!current || !current.data?.unlocked) return null;
    return { operation, current };
  }).filter(Boolean);

  if (!opSnapshots.length) return { level: 'N/A', belt: 'N/A' };

  const firstIncompleteOp = opSnapshots.find((entry) => !entry.current.data?.completed);
  const active = firstIncompleteOp || opSnapshots[opSnapshots.length - 1];
  const opLabel = active.operation.toUpperCase();

  return {
    level: `${opLabel} L${active.current.level}`,
    belt: getBeltLabel(active.current.data),
  };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const loadMoreSentinelRef = useRef(null);
  const requestingNextPageRef = useRef(false);

  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('math-admin-pin'));

  useEffect(() => {
    const storedPin = localStorage.getItem('math-admin-pin');
    if (storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
  }, [adminPin]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'math-admin-pin') return;
      setAdminPin(event.newValue || '');
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchStats = useCallback(async () => {
    const storedPin = localStorage.getItem('math-admin-pin') || adminPin;
    if (!storedPin) {
      navigate('/name');
      return;
    }

    try {
      setLoading(true);

      // NEW: paginated backend request
      const statsResponse = await getAdminStats(storedPin, limit, offset);
      const initialData = Array.isArray(statsResponse)
        ? statsResponse
        : Array.isArray(statsResponse?.data)
          ? statsResponse.data
          : [];
      const hasMoreFromHeader =
        typeof statsResponse?.pagination?.hasMore === 'boolean'
          ? statsResponse.pagination.hasMore
          : null;
      setHasMore(hasMoreFromHeader ?? initialData.length >= limit);

      const statsWithProgressPromises = initialData.map(async (student) => {
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
          currentLevel,
          currentBelt,
        };
      });

      const finalStats = await Promise.all(statsWithProgressPromises);

      // NEW: append pages
      if (offset === 0) {
        setStats(finalStats);
      } else {
        setStats((prev) => [...prev, ...finalStats]);
      }

      setError(null);
    } catch (e) {
      console.error('Failed to fetch admin stats or progress:', e);
      setError(e.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [adminPin, offset, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!loading) {
      requestingNextPageRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || requestingNextPageRef.current || !hasMore) return;
        requestingNextPageRef.current = true;
        setOffset((prev) => prev + limit);
      },
      {
        root: null,
        rootMargin: '240px 0px 240px 0px',
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, limit]);

  const handleLogout = () => {
    localStorage.removeItem('math-admin-pin');
    navigate('/name', { replace: true });
  };

  const handleRefresh = () => {
    setStats([]);
    setOffset(0);
    setHasMore(true);
  };

  const handleViewStats = (pin) => {
  navigate(`/admin/students/${pin}/analytics`);
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

  if (loading && offset === 0) {
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-6">
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold drop-shadow">
          Student Stats
        </h1>
        <button
          onClick={() => navigate('/admin-settings')}
          type="button"
          className="justify-self-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full shadow flex items-center gap-2"
          aria-label="Open app settings"
        >
          <FaCog size={16} />
          App Settings
        </button>
        <div className="flex justify-self-end space-x-2">
          {/* <button
            onClick={handleRefresh}
            className="bg-green-600/90 hover:bg-green-700/90 text-white font-semibold py-2 px-4 rounded-xl shadow transition"
          >
            Refresh
          </button> */}
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
        <>
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
                {stats.map((student) => (
                  <tr
                    key={student.id || student._id || student.pin}
                    className="cursor-pointer transition duration-200 ease-out hover:bg-gray-700/55 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
                    onClick={() => handleViewStats(student.pin)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleViewStats(student.pin);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View question stats for ${student.name}`}
                  >
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-semibold">
                      <span
                        className="text-blue-300 hover:text-blue-500 transition duration-150 ease-in-out underline text-left"
                        title={`View question stats for ${student.name}`}
                      >
                        {student.name} (<span className="tabular-nums">#{student.pin}</span>)
                      </span>
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

          <div className="flex flex-col items-center mt-5 pb-2">
            <div ref={loadMoreSentinelRef} className="h-1 w-full" aria-hidden="true" />
            {hasMore && (
              <div className="mt-3 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-600/90 ring-1 ring-green-300/40 shadow-lg backdrop-blur-sm text-white">
                <span className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {loading && offset > 0 ? 'Loading more students...' : 'Scroll down to load more'}
                </span>
              </div>
            )}
            {!hasMore && stats.length > 0 && (
              <div className="mt-3 text-xs sm:text-sm text-white/70">
                All students loaded
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
