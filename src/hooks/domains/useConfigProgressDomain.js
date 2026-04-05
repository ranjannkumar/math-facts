import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_FLOW_MODE,
  DEFAULT_OPERATION,
  MODULE_META,
  MODULE_SEQUENCE,
  getDefaultEnabledOperations,
  normalizeOperation,
} from '../../config/modulesConfig.js';
import {
  getOperationProgressSlice,
  normalizeProgressTree,
  readStoredNumber,
} from '../helpers/mathGameHelpers.js';

export const useConfigProgressDomain = ({
  childPin,
  userGetOperations,
  userGetProgress,
  lightningTargetStorageKey,
  lightningFastMsStorageKey,
  inactivityTimeoutStorageKey,
  pretestInactivityTimeoutStorageKey,
  defaultLightningTarget,
  defaultLightningFastMs,
  defaultInactivityTimeoutMs,
  defaultPretestInactivityTimeoutMs,
  setLightningTargetCorrect,
  setLightningFastThresholdMs,
  setInactivityTimeoutMs,
  setPretestInactivityTimeoutMs,
}) => {
  const [selectedOperation, setSelectedOperation] = useState(() =>
    normalizeOperation(localStorage.getItem('math-selected-operation') || DEFAULT_OPERATION)
  );
  const [tableProgress, setTableProgress] = useState({});
  const [progressByOperation, setProgressByOperation] = useState({});
  const [operationsMeta, setOperationsMeta] = useState(() => {
    const enabled = getDefaultEnabledOperations();
    return MODULE_SEQUENCE.reduce((acc, op) => {
      acc[op] = {
        maxLevel: MODULE_META[op]?.maxLevel || 19,
        enabled: MODULE_META[op]?.enabled ?? false,
        unlocked: op === DEFAULT_OPERATION,
        prerequisite: op === DEFAULT_OPERATION ? null : DEFAULT_OPERATION,
      };
      if (enabled.includes(op)) {
        acc[op].enabled = true;
      }
      return acc;
    }, {});
  });
  const [flowMode] = useState(DEFAULT_FLOW_MODE);

  const applyOperationMeta = useCallback((payload) => {
    const operations =
      payload?.operations && typeof payload.operations === 'object'
        ? payload.operations
        : payload && typeof payload === 'object'
          ? payload
          : null;
    if (!operations || typeof operations !== 'object') return;

    setOperationsMeta((prev) => {
      const next = { ...(prev || {}) };
      MODULE_SEQUENCE.forEach((op) => {
        const fromApi = operations?.[op] || {};
        next[op] = {
          maxLevel: Number.isFinite(fromApi?.maxLevel)
            ? fromApi.maxLevel
            : next?.[op]?.maxLevel || MODULE_META[op]?.maxLevel || 19,
          enabled:
            typeof fromApi?.enabled === 'boolean'
              ? fromApi.enabled
              : next?.[op]?.enabled ?? MODULE_META[op]?.enabled ?? false,
          unlocked:
            typeof fromApi?.unlocked === 'boolean'
              ? fromApi.unlocked
              : next?.[op]?.unlocked ?? op === DEFAULT_OPERATION,
          prerequisite:
            fromApi?.prerequisite !== undefined
              ? fromApi.prerequisite
              : next?.[op]?.prerequisite ?? (op === DEFAULT_OPERATION ? null : DEFAULT_OPERATION),
        };
      });
      return next;
    });
  }, []);

  const applyProgressPayload = useCallback(
    (payload, operation = selectedOperation) => {
      const normalizedTree = normalizeProgressTree(payload, operation);
      if (!normalizedTree || typeof normalizedTree !== 'object') return {};

      setProgressByOperation(normalizedTree);
      const scopedProgress = getOperationProgressSlice(normalizedTree, operation);
      setTableProgress(scopedProgress);
      return scopedProgress;
    },
    [selectedOperation]
  );

  const syncConfigFromStorage = useCallback(() => {
    setLightningTargetCorrect(readStoredNumber(lightningTargetStorageKey, defaultLightningTarget));
    setLightningFastThresholdMs(readStoredNumber(lightningFastMsStorageKey, defaultLightningFastMs));
    setInactivityTimeoutMs(readStoredNumber(inactivityTimeoutStorageKey, defaultInactivityTimeoutMs));
    setPretestInactivityTimeoutMs(
      readStoredNumber(pretestInactivityTimeoutStorageKey, defaultPretestInactivityTimeoutMs)
    );
  }, [
    defaultInactivityTimeoutMs,
    defaultLightningFastMs,
    defaultLightningTarget,
    defaultPretestInactivityTimeoutMs,
    inactivityTimeoutStorageKey,
    lightningFastMsStorageKey,
    lightningTargetStorageKey,
    pretestInactivityTimeoutStorageKey,
    setInactivityTimeoutMs,
    setLightningFastThresholdMs,
    setLightningTargetCorrect,
    setPretestInactivityTimeoutMs,
  ]);

  const refreshOperationAndProgress = useCallback(async () => {
    if (!childPin) return;

    try {
      const [operationsPayload, latestProgress] = await Promise.all([
        userGetOperations(childPin),
        userGetProgress(childPin),
      ]);

      applyOperationMeta(operationsPayload || {});
      applyProgressPayload(latestProgress || {}, selectedOperation);

      const unlockedOperations = Object.entries(operationsPayload?.operations || {})
        .filter(([, meta]) => meta?.unlocked !== false && meta?.enabled !== false)
        .map(([op]) => normalizeOperation(op));
      if (unlockedOperations.length > 0 && !unlockedOperations.includes(selectedOperation)) {
        setSelectedOperation(unlockedOperations[0]);
      }
    } catch (e) {
      console.warn('Failed to refresh operations/progress:', e?.message || e);
    }
  }, [
    applyOperationMeta,
    applyProgressPayload,
    childPin,
    selectedOperation,
    userGetOperations,
    userGetProgress,
  ]);

  useEffect(() => {
    syncConfigFromStorage();
  }, [syncConfigFromStorage]);

  useEffect(() => {
    const trackedKeys = new Set([
      inactivityTimeoutStorageKey,
      pretestInactivityTimeoutStorageKey,
      lightningTargetStorageKey,
      lightningFastMsStorageKey,
    ]);

    const handleStorage = (event) => {
      if (!trackedKeys.has(event.key)) return;
      syncConfigFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [
    inactivityTimeoutStorageKey,
    lightningFastMsStorageKey,
    lightningTargetStorageKey,
    pretestInactivityTimeoutStorageKey,
    syncConfigFromStorage,
  ]);

  useEffect(() => {
    localStorage.setItem('math-selected-operation', selectedOperation);
    const scopedProgress = getOperationProgressSlice(progressByOperation, selectedOperation);
    setTableProgress(scopedProgress);
  }, [selectedOperation, progressByOperation]);

  return {
    selectedOperation,
    setSelectedOperation,
    tableProgress,
    setTableProgress,
    progressByOperation,
    setProgressByOperation,
    operationsMeta,
    flowMode,
    applyOperationMeta,
    applyProgressPayload,
    refreshOperationAndProgress,
    syncConfigFromStorage,
  };
};
