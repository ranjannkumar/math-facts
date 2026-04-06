export const MODULE_SEQUENCE = ['add', 'sub', 'mul', 'div'];

export const MODULE_META = {
  add: {
    id: 'add',
    label: 'Addition',
    maxLevel: 19,
    enabled: true,
    unlockedByDefault: true,
    prerequisite: null,
  },
  sub: {
    id: 'sub',
    label: 'Subtraction',
    maxLevel: 11,
    enabled: true,
    unlockedByDefault: false,
    prerequisite: 'add',
  },
  mul: {
    id: 'mul',
    label: 'Multiplication',
    maxLevel: 10,
    enabled: true,
    unlockedByDefault: false,
    prerequisite: 'sub',
  },
  div: {
    id: 'div',
    label: 'Division',
    maxLevel: 19,
    enabled: false,
    unlockedByDefault: false,
    prerequisite: 'mul',
  },
};

export const DEFAULT_FLOW_MODE = 'sequential';
export const DEFAULT_OPERATION = 'add';

export const normalizeOperation = (value) => {
  if (!value) return DEFAULT_OPERATION;
  const normalized = String(value).toLowerCase();
  if (MODULE_META[normalized]) return normalized;
  return DEFAULT_OPERATION;
};

export const getOperationLabel = (op) => MODULE_META[normalizeOperation(op)]?.label || 'Addition';

export const getDefaultEnabledOperations = () =>
  MODULE_SEQUENCE.filter((op) => MODULE_META[op]?.enabled);

export const getOperationMaxLevel = (op, fallback = MODULE_META[DEFAULT_OPERATION].maxLevel) =>
  MODULE_META[normalizeOperation(op)]?.maxLevel || fallback;
