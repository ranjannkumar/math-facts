import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import {
  getAppConfig,
  reloadAppConfig,
  restoreUserProgress,
  resetAppConfig,
  updateAdminPin,
  updateAppConfig,
  updateBlackBeltTimer,
} from '../api/mathApi.js';

const DEFAULT_NUMBERS = {
  blackDegree1: 60,
  blackDegree2: 55,
  blackDegree3: 50,
  blackDegree4: 45,
  blackDegree5: 40,
  blackDegree6: 35,
  blackDegree7: 60,
  lightningTarget: 5,
  lightningTimer: 2,
  surfQuestionsPerQuiz: 4,
  surfQuizzesRequired: 5,
  rocketQuestionsPerQuiz: 4,
  rocketQuizzesRequired: 5,
  inactivityTimer: 5,
  pretestInactivityTimer: 3,
  pretestQuestionCount: 20,
  pretestDefaultTimer: 50,
};
const PRETEST_LEVEL_COUNT = 19;
const RESTORE_OPERATION_KEYS = ['add', 'sub', 'mul', 'div'];

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const timerSeconds = (timer, fallback) => {
  if (!timer) return fallback;
  if (Number.isFinite(timer.seconds)) return timer.seconds;
  if (Number.isFinite(timer.ms)) return Math.round(timer.ms / 1000);
  return fallback;
};

const buildEmptyPretestLevelTimers = () =>
  Object.fromEntries(
    Array.from({ length: PRETEST_LEVEL_COUNT }, (_, idx) => [String(idx + 1), ''])
  );

const parseLevelFromKey = (key) => {
  if (typeof key !== 'string') return null;
  if (key.startsWith('level')) {
    return Number.parseInt(key.replace('level', ''), 10);
  }
  return Number.parseInt(key, 10);
};

const parseSecondsFromTimerValue = (value) => {
  if (Number.isFinite(value)) {
    return value >= 1000 ? Math.round(value / 1000) : Math.round(value);
  }
  if (!value || typeof value !== 'object') return null;
  if (Number.isFinite(value.seconds)) return Math.round(value.seconds);
  if (Number.isFinite(value.ms)) return Math.round(value.ms / 1000);
  return null;
};

const mapPretestLevelTimers = (resolved) => {
  const mapped = buildEmptyPretestLevelTimers();
  const sources = [
    resolved?.pretestMode?.timeLimitsPerLevel,
    resolved?.pretestMode?.timeLimitsPerLevelMs,
    resolved?.pretestTimeLimitsPerLevelMs,
  ];

  sources.forEach((source) => {
    if (!source || typeof source !== 'object') return;
    Object.entries(source).forEach(([key, value]) => {
      const level = parseLevelFromKey(key);
      if (!Number.isInteger(level) || level < 1 || level > PRETEST_LEVEL_COUNT) return;
      const seconds = parseSecondsFromTimerValue(value);
      if (Number.isFinite(seconds) && seconds > 0) {
        mapped[String(level)] = String(seconds);
      }
    });
  });

  return mapped;
};

const isPretestLevelTimersEqual = (a = {}, b = {}) => {
  for (let level = 1; level <= PRETEST_LEVEL_COUNT; level += 1) {
    const key = String(level);
    if ((a[key] ?? '') !== (b[key] ?? '')) return false;
  }
  return true;
};

const mapConfigToValues = (config) => {
  const resolved = config?.config ?? config;
  return {
    blackDegree1: String(timerSeconds(resolved?.blackBeltTimers?.degree1, DEFAULT_NUMBERS.blackDegree1)),
    blackDegree2: String(timerSeconds(resolved?.blackBeltTimers?.degree2, DEFAULT_NUMBERS.blackDegree2)),
    blackDegree3: String(timerSeconds(resolved?.blackBeltTimers?.degree3, DEFAULT_NUMBERS.blackDegree3)),
    blackDegree4: String(timerSeconds(resolved?.blackBeltTimers?.degree4, DEFAULT_NUMBERS.blackDegree4)),
    blackDegree5: String(timerSeconds(resolved?.blackBeltTimers?.degree5, DEFAULT_NUMBERS.blackDegree5)),
    blackDegree6: String(timerSeconds(resolved?.blackBeltTimers?.degree6, DEFAULT_NUMBERS.blackDegree6)),
    blackDegree7: String(timerSeconds(resolved?.blackBeltTimers?.degree7, DEFAULT_NUMBERS.blackDegree7)),
    lightningTarget: String(
      Number.isFinite(resolved?.lightningMode?.targetCorrect)
        ? resolved.lightningMode.targetCorrect
        : DEFAULT_NUMBERS.lightningTarget
    ),
    lightningTimer: String(
      Number.isFinite(resolved?.lightningMode?.fastThresholdSeconds)
        ? resolved.lightningMode.fastThresholdSeconds
        : Number.isFinite(resolved?.lightningMode?.fastThresholdMs)
        ? Math.round(resolved.lightningMode.fastThresholdMs / 1000)
        : DEFAULT_NUMBERS.lightningTimer
    ),
    surfQuestionsPerQuiz: String(
      Number.isFinite(resolved?.surfMode?.questionsPerQuiz)
        ? resolved.surfMode.questionsPerQuiz
        : DEFAULT_NUMBERS.surfQuestionsPerQuiz
    ),
    surfQuizzesRequired: String(
      Number.isFinite(resolved?.surfMode?.quizzesRequired)
        ? resolved.surfMode.quizzesRequired
        : DEFAULT_NUMBERS.surfQuizzesRequired
    ),
    rocketQuestionsPerQuiz: String(
      Number.isFinite(resolved?.rocketMode?.questionsPerQuiz)
        ? resolved.rocketMode.questionsPerQuiz
        : DEFAULT_NUMBERS.rocketQuestionsPerQuiz
    ),
    rocketQuizzesRequired: String(
      Number.isFinite(resolved?.rocketMode?.quizzesRequired)
        ? resolved.rocketMode.quizzesRequired
        : DEFAULT_NUMBERS.rocketQuizzesRequired
    ),
    inactivityTimer: String(
      Number.isFinite(resolved?.general?.inactivityThresholdSeconds)
        ? resolved.general.inactivityThresholdSeconds
        : Number.isFinite(resolved?.general?.inactivityThresholdMs)
        ? Math.round(resolved.general.inactivityThresholdMs / 1000)
        : DEFAULT_NUMBERS.inactivityTimer
    ),
    pretestQuestionCount: String(
      Number.isFinite(resolved?.pretestMode?.questionCount)
        ? resolved.pretestMode.questionCount
        : Number.isFinite(resolved?.general?.pretestQuestionCount)
        ? resolved.general.pretestQuestionCount
        : DEFAULT_NUMBERS.pretestQuestionCount
    ),
    pretestDefaultTimer: String(
      Number.isFinite(resolved?.pretestMode?.defaultTimeLimitSeconds)
        ? Math.round(resolved.pretestMode.defaultTimeLimitSeconds)
        : Number.isFinite(resolved?.pretestMode?.defaultTimeLimitMs)
        ? Math.round(resolved.pretestMode.defaultTimeLimitMs / 1000)
        : Number.isFinite(resolved?.pretestMode?.timeLimitSeconds)
        ? Math.round(resolved.pretestMode.timeLimitSeconds)
        : Number.isFinite(resolved?.pretestMode?.timeLimitMs)
        ? Math.round(resolved.pretestMode.timeLimitMs / 1000)
        : Number.isFinite(resolved?.general?.pretestTimeLimitMs)
        ? Math.round(resolved.general.pretestTimeLimitMs / 1000)
        : DEFAULT_NUMBERS.pretestDefaultTimer
    ),
    pretestInactivityTimer: String(
      Number.isFinite(resolved?.pretestMode?.inactivityThresholdSeconds)
        ? Math.round(resolved.pretestMode.inactivityThresholdSeconds)
        : Number.isFinite(resolved?.pretestMode?.inactivityThresholdMs)
        ? Math.round(resolved.pretestMode.inactivityThresholdMs / 1000)
        : Number.isFinite(resolved?.general?.pretestInactivityThresholdMs)
        ? Math.round(resolved.general.pretestInactivityThresholdMs / 1000)
        : Number.isFinite(resolved?.pretestInactivityThresholdMs)
        ? Math.round(resolved.pretestInactivityThresholdMs / 1000)
        : DEFAULT_NUMBERS.pretestInactivityTimer
    ),
    pretestTimersPerLevel: mapPretestLevelTimers(resolved),
  };
};

const buildTimer = (seconds) => ({
  ms: seconds * 1000,
  seconds,
  display: `${seconds} sec`,
});

const buildConfigPayload = (values) => {
  const lightningTarget = toInt(values.lightningTarget, DEFAULT_NUMBERS.lightningTarget);
  const lightningTimer = toInt(values.lightningTimer, DEFAULT_NUMBERS.lightningTimer);
  const surfQuestionsPerQuiz = toInt(values.surfQuestionsPerQuiz, DEFAULT_NUMBERS.surfQuestionsPerQuiz);
  const surfQuizzesRequired = toInt(values.surfQuizzesRequired, DEFAULT_NUMBERS.surfQuizzesRequired);
  const rocketQuestionsPerQuiz = toInt(
    values.rocketQuestionsPerQuiz,
    DEFAULT_NUMBERS.rocketQuestionsPerQuiz
  );
  const rocketQuizzesRequired = toInt(
    values.rocketQuizzesRequired,
    DEFAULT_NUMBERS.rocketQuizzesRequired
  );
  const inactivityTimer = toInt(values.inactivityTimer, DEFAULT_NUMBERS.inactivityTimer);
  const pretestInactivityTimer = toInt(
    values.pretestInactivityTimer,
    DEFAULT_NUMBERS.pretestInactivityTimer
  );
  const pretestQuestionCount = toInt(values.pretestQuestionCount, DEFAULT_NUMBERS.pretestQuestionCount);

  return {
    lightningTargetCorrect: lightningTarget,
    lightningFastThresholdMs: lightningTimer * 1000,
    surfQuestionsPerQuiz,
    surfQuizzesRequired,
    rocketQuestionsPerQuiz,
    rocketQuizzesRequired,
    inactivityThresholdMs: inactivityTimer * 1000,
    pretestInactivityThresholdMs: pretestInactivityTimer * 1000,
    pretestQuestionCount,
    pretestMode: {
      questionCount: pretestQuestionCount,
    },
  };
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('math-admin-pin'));

  useEffect(() => {
    if (!adminPin) {
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

  const [values, setValues] = useState(() => ({
    blackDegree1: String(DEFAULT_NUMBERS.blackDegree1),
    blackDegree2: String(DEFAULT_NUMBERS.blackDegree2),
    blackDegree3: String(DEFAULT_NUMBERS.blackDegree3),
    blackDegree4: String(DEFAULT_NUMBERS.blackDegree4),
    blackDegree5: String(DEFAULT_NUMBERS.blackDegree5),
    blackDegree6: String(DEFAULT_NUMBERS.blackDegree6),
    blackDegree7: String(DEFAULT_NUMBERS.blackDegree7),
    lightningTarget: String(DEFAULT_NUMBERS.lightningTarget),
    lightningTimer: String(DEFAULT_NUMBERS.lightningTimer),
    surfQuestionsPerQuiz: String(DEFAULT_NUMBERS.surfQuestionsPerQuiz),
    surfQuizzesRequired: String(DEFAULT_NUMBERS.surfQuizzesRequired),
    rocketQuestionsPerQuiz: String(DEFAULT_NUMBERS.rocketQuestionsPerQuiz),
    rocketQuizzesRequired: String(DEFAULT_NUMBERS.rocketQuizzesRequired),
    inactivityTimer: String(DEFAULT_NUMBERS.inactivityTimer),
    pretestInactivityTimer: String(DEFAULT_NUMBERS.pretestInactivityTimer),
    pretestQuestionCount: String(DEFAULT_NUMBERS.pretestQuestionCount),
    pretestDefaultTimer: String(DEFAULT_NUMBERS.pretestDefaultTimer),
    pretestTimersPerLevel: buildEmptyPretestLevelTimers(),
  }));
  const [baselineValues, setBaselineValues] = useState(() => ({
    blackDegree1: String(DEFAULT_NUMBERS.blackDegree1),
    blackDegree2: String(DEFAULT_NUMBERS.blackDegree2),
    blackDegree3: String(DEFAULT_NUMBERS.blackDegree3),
    blackDegree4: String(DEFAULT_NUMBERS.blackDegree4),
    blackDegree5: String(DEFAULT_NUMBERS.blackDegree5),
    blackDegree6: String(DEFAULT_NUMBERS.blackDegree6),
    blackDegree7: String(DEFAULT_NUMBERS.blackDegree7),
    lightningTarget: String(DEFAULT_NUMBERS.lightningTarget),
    lightningTimer: String(DEFAULT_NUMBERS.lightningTimer),
    surfQuestionsPerQuiz: String(DEFAULT_NUMBERS.surfQuestionsPerQuiz),
    surfQuizzesRequired: String(DEFAULT_NUMBERS.surfQuizzesRequired),
    rocketQuestionsPerQuiz: String(DEFAULT_NUMBERS.rocketQuestionsPerQuiz),
    rocketQuizzesRequired: String(DEFAULT_NUMBERS.rocketQuizzesRequired),
    inactivityTimer: String(DEFAULT_NUMBERS.inactivityTimer),
    pretestInactivityTimer: String(DEFAULT_NUMBERS.pretestInactivityTimer),
    pretestQuestionCount: String(DEFAULT_NUMBERS.pretestQuestionCount),
    pretestDefaultTimer: String(DEFAULT_NUMBERS.pretestDefaultTimer),
    pretestTimersPerLevel: buildEmptyPretestLevelTimers(),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [isPinSaving, setIsPinSaving] = useState(false);
  const [restoreForm, setRestoreForm] = useState({
    pin: '',
    add: '0',
    sub: '0',
    mul: '0',
    div: '0',
    grandTotalCorrect: '',
    currentStreak: '',
  });
  const [isRestoringUser, setIsRestoringUser] = useState(false);

  const getStoredAdminPin = () => localStorage.getItem('math-admin-pin') || '';

  const loadConfig = useCallback(
    async ({ preserveStatus = false } = {}) => {
      const storedPin = getStoredAdminPin();
      if (storedPin && storedPin !== adminPin) {
        setAdminPin(storedPin);
      }
      if (!storedPin) return;
      if (!preserveStatus) setStatus(null);
      setIsLoading(true);
      try {
        const config = await getAppConfig(storedPin);
        const mapped = mapConfigToValues(config);
        setValues(mapped);
        setBaselineValues(mapped);
      } catch (e) {
        const message = e.message || 'Failed to load configuration.';
        setStatus({ type: 'error', message });
        if (/401|403|unauthorized/i.test(message)) {
          localStorage.removeItem('math-admin-pin');
          setAdminPin('');
          navigate('/name', { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [adminPin, navigate]
  );

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handlePretestLevelTimerChange = (level) => (e) => {
    const key = String(level);
    setValues((prev) => ({
      ...prev,
      pretestTimersPerLevel: {
        ...prev.pretestTimersPerLevel,
        [key]: e.target.value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const degreeChanges = [
        { key: 'blackDegree1', degree: 1 },
        { key: 'blackDegree2', degree: 2 },
        { key: 'blackDegree3', degree: 3 },
        { key: 'blackDegree4', degree: 4 },
        { key: 'blackDegree5', degree: 5 },
        { key: 'blackDegree6', degree: 6 },
        { key: 'blackDegree7', degree: 7 },
      ].filter(({ key }) => values[key] !== baselineValues[key]);

      const generalKeys = [
        'lightningTarget',
        'lightningTimer',
        'surfQuestionsPerQuiz',
        'surfQuizzesRequired',
        'rocketQuestionsPerQuiz',
        'rocketQuizzesRequired',
        'inactivityTimer',
        'pretestInactivityTimer',
        'pretestQuestionCount',
      ];
      const hasGeneralChanges = generalKeys.some(
        (key) => values[key] !== baselineValues[key]
      );
      const hasPerLevelPretestTimerChanges = !isPretestLevelTimersEqual(
        values.pretestTimersPerLevel,
        baselineValues.pretestTimersPerLevel
      );

      if (hasGeneralChanges || hasPerLevelPretestTimerChanges) {
        const payload = buildConfigPayload(values);
        if (hasPerLevelPretestTimerChanges) {
          const pretestTimeLimitsPerLevelMs = {};
          for (let level = 1; level <= PRETEST_LEVEL_COUNT; level += 1) {
            const key = String(level);
            const nextRaw = String(values.pretestTimersPerLevel?.[key] ?? '').trim();
            const prevRaw = String(baselineValues.pretestTimersPerLevel?.[key] ?? '').trim();
            if (nextRaw === prevRaw) continue;

            if (nextRaw === '') {
              pretestTimeLimitsPerLevelMs[key] = 0;
              continue;
            }

            const nextSeconds = Number.parseInt(nextRaw, 10);
            if (!Number.isFinite(nextSeconds) || nextSeconds < 0) {
              setStatus({
                type: 'error',
                message: `Pretest timer for level ${level} must be 0 or greater.`,
              });
              setIsSaving(false);
              return;
            }
            pretestTimeLimitsPerLevelMs[key] = nextSeconds === 0 ? 0 : nextSeconds * 1000;
          }

          if (Object.keys(pretestTimeLimitsPerLevelMs).length > 0) {
            payload.pretestTimeLimitsPerLevelMs = pretestTimeLimitsPerLevelMs;
          }
        }
        await updateAppConfig(storedPin, payload);
      }

      if (degreeChanges.length > 0) {
        await Promise.all(
          degreeChanges.map(({ key, degree }) =>
            updateBlackBeltTimer(storedPin, degree, {
              timerMs: toInt(values[key], DEFAULT_NUMBERS[`blackDegree${degree}`]) * 1000,
            })
          )
        );
      }

      if (hasGeneralChanges || hasPerLevelPretestTimerChanges || degreeChanges.length > 0) {
        await reloadAppConfig(storedPin);
      }

      const refreshed = await getAppConfig(storedPin);
      const refreshedConfig = refreshed?.config || refreshed;
      let refreshedMapped = mapConfigToValues(refreshedConfig);

      const desiredDegreeTimers = [
        { key: 'blackDegree1', degree: 1 },
        { key: 'blackDegree2', degree: 2 },
        { key: 'blackDegree3', degree: 3 },
        { key: 'blackDegree4', degree: 4 },
        { key: 'blackDegree5', degree: 5 },
        { key: 'blackDegree6', degree: 6 },
        { key: 'blackDegree7', degree: 7 },
      ];
      const mismatchedDegrees = desiredDegreeTimers.filter(({ key, degree }) => {
        const desiredSeconds = toInt(values[key], DEFAULT_NUMBERS[`blackDegree${degree}`]);
        const backendSeconds = Number(refreshedConfig?.blackBeltTimers?.[`degree${degree}`]?.seconds);
        return Number.isFinite(backendSeconds) && backendSeconds !== desiredSeconds;
      });

      if (mismatchedDegrees.length > 0) {
        await Promise.all(
          mismatchedDegrees.map(({ key, degree }) =>
            updateBlackBeltTimer(storedPin, degree, {
              timerMs: toInt(values[key], DEFAULT_NUMBERS[`blackDegree${degree}`]) * 1000,
            })
          )
        );
        await reloadAppConfig(storedPin);
        const synced = await getAppConfig(storedPin);
        const syncedConfig = synced?.config || synced;
        refreshedMapped = mapConfigToValues(syncedConfig);
      }

      setValues(refreshedMapped);
      setBaselineValues(refreshedMapped);

      if (refreshedConfig?.lightningMode) {
        const targetCorrect = Number(refreshedConfig.lightningMode.targetCorrect);
        const fastThresholdMs = Number(refreshedConfig.lightningMode.fastThresholdMs);
        if (Number.isFinite(targetCorrect)) {
          localStorage.setItem('math-lightning-target', String(targetCorrect));
        }
        if (Number.isFinite(fastThresholdMs)) {
          localStorage.setItem('math-lightning-fast-ms', String(fastThresholdMs));
        }
      }
      if (refreshedConfig?.general) {
        const inactivityThresholdMs = Number(refreshedConfig.general.inactivityThresholdMs);
        if (Number.isFinite(inactivityThresholdMs)) {
          localStorage.setItem('math-inactivity-ms', String(inactivityThresholdMs));
        }
      }
      const pretestInactivityThresholdMs = Number(
        refreshedConfig?.pretestMode?.inactivityThresholdMs
      );
      if (Number.isFinite(pretestInactivityThresholdMs)) {
        localStorage.setItem('math-pretest-inactivity-ms', String(pretestInactivityThresholdMs));
      }

      if (hasGeneralChanges) {
        const savedQuestionsPerQuiz = Number(refreshedConfig?.surfMode?.questionsPerQuiz);
        if (
          Number.isFinite(savedQuestionsPerQuiz) &&
          savedQuestionsPerQuiz !==
            toInt(values.surfQuestionsPerQuiz, DEFAULT_NUMBERS.surfQuestionsPerQuiz)
        ) {
          setStatus({
            type: 'error',
            message: 'Save completed, but the backend did not persist the new surf quiz count.',
          });
          return;
        }

        const savedRocketQuestionsPerQuiz = Number(refreshedConfig?.rocketMode?.questionsPerQuiz);
        if (
          Number.isFinite(savedRocketQuestionsPerQuiz) &&
          savedRocketQuestionsPerQuiz !==
            toInt(values.rocketQuestionsPerQuiz, DEFAULT_NUMBERS.rocketQuestionsPerQuiz)
        ) {
          setStatus({
            type: 'error',
            message: 'Save completed, but the backend did not persist the new rocket quiz count.',
          });
          return;
        }
      }

      setStatus({ type: 'success', message: 'Settings saved.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await resetAppConfig(storedPin);
      await loadConfig({ preserveStatus: true });
      setStatus({ type: 'success', message: 'Settings reset to defaults.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to reset settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReload = async () => {
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await reloadAppConfig(storedPin);
      await loadConfig({ preserveStatus: true });
      setStatus({ type: 'success', message: 'Configuration reloaded.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to reload configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinFieldChange = (key) => (e) => {
    setPinForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRestoreFieldChange = (key) => (e) => {
    setRestoreForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRestoreUserSubmit = async () => {
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;

    const targetPin = restoreForm.pin.trim();
    if (!targetPin) {
      setStatus({ type: 'error', message: 'User PIN is required for restore.' });
      return;
    }

    const operations = {};
    for (const op of RESTORE_OPERATION_KEYS) {
      const raw = String(restoreForm[op] ?? '').trim();
      const parsed = raw === '' ? 0 : Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setStatus({
          type: 'error',
          message: `Operation level count for "${op}" must be 0 or greater.`,
        });
        return;
      }
      operations[op] = parsed;
    }

    const payload = {
      pin: targetPin,
      operations,
    };

    const grandTotalRaw = String(restoreForm.grandTotalCorrect ?? '').trim();
    if (grandTotalRaw !== '') {
      const grandTotalCorrect = Number.parseInt(grandTotalRaw, 10);
      if (!Number.isFinite(grandTotalCorrect) || grandTotalCorrect < 0) {
        setStatus({
          type: 'error',
          message: 'Grand total correct must be 0 or greater.',
        });
        return;
      }
      payload.grandTotalCorrect = grandTotalCorrect;
    }

    const streakRaw = String(restoreForm.currentStreak ?? '').trim();
    if (streakRaw !== '') {
      const currentStreak = Number.parseInt(streakRaw, 10);
      if (!Number.isFinite(currentStreak) || currentStreak < 0) {
        setStatus({
          type: 'error',
          message: 'Current streak must be 0 or greater.',
        });
        return;
      }
      payload.currentStreak = currentStreak;
    }

    setIsRestoringUser(true);
    setStatus(null);
    try {
      const out = await restoreUserProgress(storedPin, payload);
      const restoredUserName = out?.user ? ` (${out.user})` : '';
      setStatus({
        type: 'success',
        message: out?.message
          ? `${out.message}${restoredUserName}`
          : `User progress restored${restoredUserName}.`,
      });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to restore user progress.' });
    } finally {
      setIsRestoringUser(false);
    }
  };

  const handleAdminPinSubmit = async (e) => {
    e.preventDefault();
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    const currentPin = pinForm.currentPin.trim();
    const nextPin = pinForm.newPin.trim();
    const confirmPin = pinForm.confirmPin.trim();

    if (!/^\d{4}$/.test(currentPin)) {
      setStatus({ type: 'error', message: 'Current admin PIN must be exactly 4 digits.' });
      return;
    }
    if (!/^\d{4}$/.test(nextPin)) {
      setStatus({ type: 'error', message: 'Admin PIN must be exactly 4 digits.' });
      return;
    }
    if (nextPin !== confirmPin) {
      setStatus({ type: 'error', message: 'Admin PIN entries do not match.' });
      return;
    }

    setIsPinSaving(true);
    setStatus(null);
    try {
      await updateAdminPin(currentPin, currentPin, nextPin);
      await reloadAppConfig(nextPin);
      localStorage.setItem('math-admin-pin', nextPin);
      setAdminPin(nextPin);
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setStatus({ type: 'success', message: 'Admin PIN updated.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to update admin PIN.' });
    } finally {
      setIsPinSaving(false);
    }
  };

  const inputClass =
    'w-32 bg-white/10 rounded-lg pl-3 pr-8 py-2 text-left text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed';
  const cardClass = 'rounded-2xl bg-white/10 border border-white/10 shadow-xl backdrop-blur-sm';
  const sectionTitleClass = 'text-white text-lg font-bold';
  const isBusy = isLoading || isSaving || isRestoringUser;

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

      {isLoading && (
        <p className="text-white/70 text-sm mb-4">Loading configuration...</p>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="max-w-5xl mx-auto space-y-6">
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
                  disabled={isBusy}
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
                <span className="text-white/90">Lightning target correct</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.lightningTarget}
                  onChange={handleChange('lightningTarget')}
                  disabled={isBusy}
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
                  disabled={isBusy}
                />
              </label>
            </div>
          </div>

          <div className={`${cardClass} p-5 sm:p-6`}>
            <div className={sectionTitleClass}>Game Mode 2 (Accuracy)</div>
            <p className="text-white/70 text-sm mb-4">Streaks and surf wins required.</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Questions per surf quiz</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.surfQuestionsPerQuiz}
                  onChange={handleChange('surfQuestionsPerQuiz')}
                  disabled={isBusy}
                />
              </label>
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Surf quizzes required</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.surfQuizzesRequired}
                  onChange={handleChange('surfQuizzesRequired')}
                  disabled={isBusy}
                />
              </label>
            </div>
          </div>

          <div className={`${cardClass} p-5 sm:p-6`}>
            <div className={sectionTitleClass}>Game Mode 3 (Rocket)</div>
            <p className="text-white/70 text-sm mb-4">Reverse quiz size and wins required.</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Questions per rocket quiz</span>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.rocketQuestionsPerQuiz}
                  onChange={handleChange('rocketQuestionsPerQuiz')}
                  disabled={isBusy}
                />
              </label>
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Rocket quizzes required</span>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.rocketQuizzesRequired}
                  onChange={handleChange('rocketQuizzesRequired')}
                  disabled={isBusy}
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
                disabled={isBusy}
              />
            </label>
          </div>
        </div>

        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className={sectionTitleClass}>Pretest Settings</div>
          <p className="text-white/70 text-sm mb-4">Pretest length and time limit.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">Pretest questions</span>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={values.pretestQuestionCount}
                onChange={handleChange('pretestQuestionCount')}
                disabled={isBusy}
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">Pretest inactivity timer (sec)</span>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={values.pretestInactivityTimer}
                onChange={handleChange('pretestInactivityTimer')}
                disabled={isBusy}
              />
            </label>
          </div>
          <div className="mt-4">
            <p className="text-white/70 text-sm mb-3">
              Per-level Pretest timer (sec).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: PRETEST_LEVEL_COUNT }, (_, idx) => idx + 1).map((level) => (
                <label
                  key={`pretest-level-${level}`}
                  className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3"
                >
                  <span className="text-white/90">Level {level}</span>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={values.pretestTimersPerLevel[String(level)]}
                    onChange={handlePretestLevelTimerChange(level)}
                    placeholder={values.pretestDefaultTimer}
                    autoComplete="off"
                    name={`pretest-level-${level}-timer`}
                    disabled={isBusy}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className={sectionTitleClass}>Admin PIN</div>
          <p className="text-white/70 text-sm mb-4">Update the admin PIN used for access.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">Current PIN</span>
              <input
                type="password"
                className={inputClass}
                value={pinForm.currentPin}
                onChange={handlePinFieldChange('currentPin')}
                disabled={isBusy || isPinSaving}
                maxLength={4}
                inputMode="numeric"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">New PIN</span>
              <input
                type="password"
                className={inputClass}
                value={pinForm.newPin}
                onChange={handlePinFieldChange('newPin')}
                disabled={isBusy || isPinSaving}
                maxLength={4}
                inputMode="numeric"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">Confirm PIN</span>
              <input
                type="password"
                className={inputClass}
                value={pinForm.confirmPin}
                onChange={handlePinFieldChange('confirmPin')}
                disabled={isBusy || isPinSaving}
                maxLength={4}
                inputMode="numeric"
              />
            </label>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleAdminPinSubmit}
              className="bg-blue-600/90 hover:bg-blue-700/90 text-white font-semibold py-2 px-6 rounded-xl shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isBusy || isPinSaving}
            >
              {isPinSaving ? 'Updating...' : 'Update PIN'}
            </button>
          </div>
        </div>

        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className={sectionTitleClass}>Restore User Progress</div>
          <p className="text-white/70 text-sm mb-4">
            Recover a user if progress was reset by mistake.
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/90">User PIN</span>
              <input
                type="text"
                className={inputClass}
                value={restoreForm.pin}
                onChange={handleRestoreFieldChange('pin')}
                disabled={isBusy}
                autoComplete="off"
                inputMode="numeric"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {RESTORE_OPERATION_KEYS.map((op) => (
                <label
                  key={`restore-op-${op}`}
                  className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3"
                >
                  <span className="text-white/90">{op.toUpperCase()} levels</span>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={restoreForm[op]}
                    onChange={handleRestoreFieldChange(op)}
                    disabled={isBusy}
                  />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Grand total correct </span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={restoreForm.grandTotalCorrect}
                  onChange={handleRestoreFieldChange('grandTotalCorrect')}
                  disabled={isBusy}
                />
              </label>
              <label className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/90">Current streak</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={restoreForm.currentStreak}
                  onChange={handleRestoreFieldChange('currentStreak')}
                  disabled={isBusy}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleRestoreUserSubmit}
              className="bg-fuchsia-600/90 hover:bg-fuchsia-700/90 text-white font-semibold py-2 px-6 rounded-xl shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isBusy}
            >
              {isRestoringUser ? 'Restoring...' : 'Restore User'}
            </button>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3">
          {status && (
            <div
              className={`rounded-xl px-4 py-2 text-sm ${
                status.type === 'error'
                  ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
              }`}
            >
              {status.message}
              {status.type === 'error' && /admin access required/i.test(status.message) ? (
                <span className="block text-white/70 mt-1">
                  Re-enter the admin PIN (top-left admin login) and try again.
                </span>
              ) : null}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="bg-amber-600/90 hover:bg-amber-700/90 text-white font-semibold py-2 px-6 rounded-xl shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isBusy}
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleReload}
                className="bg-indigo-600/90 hover:bg-indigo-700/90 text-white font-semibold py-2 px-6 rounded-xl shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isBusy}
              >
                Reload Config
              </button>
            </div>
            <button
              type="submit"
              className="bg-emerald-600/90 hover:bg-emerald-700/90 text-white font-semibold py-2 px-6 rounded-xl shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isBusy}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
