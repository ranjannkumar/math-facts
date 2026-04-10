import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import {
  analyticsGetSummary,
  analyticsGetFacts,
  analyticsGetFactDetail,
  analyticsGetStruggling,
  getAdminStats,
  userGetProgress,
} from "../api/mathApi.js";

const OPS = [
  { value: "all", label: "All operations" },
  { value: "add", label: "Addition" },
  { value: "sub", label: "Subtraction" },
  { value: "mul", label: "Multiplication" },
  { value: "div", label: "Division" },
];

const LEVELS = [{ value: "all", label: "All levels" }].concat(
  Array.from({ length: 19 }, (_, i) => ({ value: String(i + 1), label: `Level ${i + 1}` }))
);
const FACTS_PAGE_SIZE = 50;
const FACT_SORT = {
  ACCURACY: "accuracy",
  ATTEMPTS: "attempts",
  AVG: "avg",
};
const PROGRESS_OPERATION_ORDER = ["add", "sub", "mul", "div"];

const toSafeStudentText = (value, fallback = "N/A") => {
  const safe = String(value ?? "").trim();
  return safe.length ? safe : fallback;
};

const getBeltLabel = (levelData = {}) => {
  const beltsOrder = ["white", "yellow", "green", "blue", "red", "brown"];
  let currentBelt = "White";

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
    return "Level Mastered";
  }
  return currentBelt;
};

const parseLevelsFromNode = (node = {}) =>
  Object.keys(node)
    .filter((k) => k.startsWith("L"))
    .map((k) => ({ key: k, level: parseInt(k.substring(1), 10), data: node[k] }))
    .filter((x) => Number.isFinite(x.level))
    .sort((a, b) => a.level - b.level);

const hasFlatLevelKeys = (node) =>
  !!node &&
  typeof node === "object" &&
  Object.keys(node).some((key) => /^L\d+$/i.test(key));

const pickCurrentLevelFromLevels = (levelsAsc = []) => {
  if (!levelsAsc.length) return null;

  const unlockedLevels = levelsAsc.filter((l) => !!l.data?.unlocked);
  const highestUnlockedIncomplete = [...unlockedLevels]
    .reverse()
    .find((l) => !l.data?.completed);

  return highestUnlockedIncomplete || unlockedLevels[unlockedLevels.length - 1] || levelsAsc[0];
};

const getCurrentProgress = (progress) => {
  if (!progress) return { level: "N/A", belt: "N/A" };

  const hasScopedOps = PROGRESS_OPERATION_ORDER.some(
    (op) => progress?.[op] && typeof progress[op] === "object"
  );

  if (!hasScopedOps && hasFlatLevelKeys(progress)) {
    const flatLevels = parseLevelsFromNode(progress);
    if (flatLevels.length > 0) {
      const currentLevelInfo = pickCurrentLevelFromLevels(flatLevels);
      if (!currentLevelInfo) return { level: "N/A", belt: "N/A" };
      return {
        level: `L${currentLevelInfo.level}`,
        belt: getBeltLabel(currentLevelInfo.data),
      };
    }
  }

  const opSnapshots = PROGRESS_OPERATION_ORDER.map((operationName) => {
    const levels = parseLevelsFromNode(progress?.[operationName] || {});
    if (!levels.length) return null;
    const current = pickCurrentLevelFromLevels(levels);
    if (!current || !current.data?.unlocked) return null;
    return { operationName, current };
  }).filter(Boolean);

  if (!opSnapshots.length) return { level: "N/A", belt: "N/A" };

  const highestUnlockedIncompleteOp = [...opSnapshots]
    .reverse()
    .find((entry) => !entry.current.data?.completed);
  const active = highestUnlockedIncompleteOp || opSnapshots[opSnapshots.length - 1];
  const opLabel = active.operationName.toUpperCase();

  return {
    level: `${opLabel} L${active.current.level}`,
    belt: getBeltLabel(active.current.data),
  };
};

const findStudentFromAdminStats = async (adminPin, targetPin) => {
  const wantedPin = String(targetPin ?? "").trim();
  if (!adminPin || !wantedPin) return null;

  const pageSize = 100;
  let offset = 0;
  let safetyCounter = 0;

  while (safetyCounter < 100) {
    const response = await getAdminStats(adminPin, pageSize, offset);
    const rows = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    const found = rows.find((row) => String(row?.pin ?? "").trim() === wantedPin);
    if (found) return found;

    const hasMoreFromHeader =
      typeof response?.pagination?.hasMore === "boolean"
        ? response.pagination.hasMore
        : null;
    const hasMore = hasMoreFromHeader ?? rows.length >= pageSize;
    if (!hasMore) return null;

    offset += pageSize;
    safetyCounter += 1;
  }

  return null;
};

function pct(x) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${Math.round(x * 100)}%`;
}
function ms(x) {
  if (x == null || Number.isNaN(x)) return "—";
  if (x < 1000) return `${Math.round(x)}ms`;
  return `${(x / 1000).toFixed(1)}s`;
}

const FactDetailModal = ({ open, onClose, pin, factKey, onDetailLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!open || !factKey) return;
      setLoading(true);
      setError("");

      try {
        const data = await analyticsGetFactDetail(pin, {
          operation: factKey.operation,
          a: factKey.a,
          b: factKey.b,
          limit: 200,
        });
        if (alive) {
          setDetail(data);
          onDetailLoaded?.(data, factKey);
        }
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load fact details");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [open, pin, factKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 shrink-0">
          <div className="text-lg font-extrabold text-gray-900">
            {detail?.fact?.question || "Fact details"}
          </div>
          <button
            className="rounded-xl px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* BODY (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <div className="text-gray-600">Loading…</div>}
          {error && <div className="text-red-600">{error}</div>}

          {detail && !loading && !error && (
            <>
              {/* STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Attempts", value: detail.stats?.totalAttempts ?? 0 },
                  { label: "Accuracy", value: pct(detail.stats?.accuracy ?? 0) },
                  { label: "Avg time", value: ms(detail.stats?.avgMs) },
                  { label: "Median time", value: ms(detail.stats?.medianMs) },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 border border-gray-200 rounded-xl p-4"
                  >
                    <div className="text-xs text-gray-600 font-medium">
                      {s.label}
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* RECENT ATTEMPTS */}
              <div className="font-bold text-gray-900 mb-3">
                Recent attempts
              </div>

              {detail.recentAttempts?.length === 0 && (
                <div className="text-gray-600">No attempts recorded yet.</div>
              )}

              <div className="space-y-3 pb-4">
                {detail.recentAttempts?.map((a, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2"
                  >
                    <div className="font-semibold text-gray-900">
                      {a.correct ? "✅ Correct" : "⏰ Timed Out"} · answered{" "}
                      <span className="font-mono">{a.userAnswer}</span>{" "}
                      (correct {a.correctAnswer})
                    </div>

                    <div className="text-xs text-gray-600">
                      {new Date(a.attemptedAt).toLocaleString()} ·{" "}
                      {ms(a.responseMs)} ·{" "}
                      {a.gameMode ? "Game mode" : "Quiz"}
                    </div>

                    {Array.isArray(a.choices) && (
                      <div className="text-sm text-gray-800">
                        Choices:{" "}
                        <span className="font-mono">
                          {a.choices.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default function AnalyticsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pin: routePin } = useParams();

  const pin = useMemo(() => {
    return routePin || localStorage.getItem("math-child-pin") || "";
  }, [routePin]);

  const [summary, setSummary] = useState(null);
  const [struggling, setStruggling] = useState(null);
  const [studentInfo, setStudentInfo] = useState(() => ({
    name: toSafeStudentText(location.state?.studentName, "Loading..."),
    level: toSafeStudentText(location.state?.studentLevel, "Loading..."),
    belt: toSafeStudentText(location.state?.studentBelt, "Loading..."),
    pin: toSafeStudentText(routePin || location.state?.studentPin, "N/A"),
  }));

  const [level, setLevel] = useState("all");
  const [operation, setOperation] = useState("all");

  const [facts, setFacts] = useState([]);
  const [factsSort, setFactsSort] = useState(FACT_SORT.ACCURACY);
  const [pagination, setPagination] = useState({
    limit: FACTS_PAGE_SIZE,
    nextOffset: 0,
    total: 0,
    hasMore: false,
  });

  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingFacts, setLoadingFacts] = useState(true);
  const [loadingMoreFacts, setLoadingMoreFacts] = useState(false);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailFact, setDetailFact] = useState(null);
  const [lastFactDetail, setLastFactDetail] = useState(null);
  const [lastFactKey, setLastFactKey] = useState(null);
  const loadMoreRef = useRef(null);
  const factsRequestSeqRef = useRef(0);

  const sortedFacts = useMemo(() => {
    if (!Array.isArray(facts)) return [];
    const avgDisplayBucketMs = (rawAvg) => {
      const avg = Number(rawAvg ?? 0);
      if (!Number.isFinite(avg)) return 0;
      // Match display precision while keeping one unit (milliseconds) for sorting.
      // <1000ms is displayed as integer ms, >=1000ms is displayed as 0.1s (100ms steps).
      return avg < 1000 ? Math.round(avg) : Math.round(avg / 100) * 100;
    };

    return [...facts].sort((a, b) => {
      const accA = Number(a?.stats?.accuracy ?? 0);
      const accB = Number(b?.stats?.accuracy ?? 0);
      const attemptsA = Number(a?.stats?.totalAttempts ?? 0);
      const attemptsB = Number(b?.stats?.totalAttempts ?? 0);
      const avgA = Number(a?.stats?.avgMs ?? 0);
      const avgB = Number(b?.stats?.avgMs ?? 0);
      const avgBucketA = avgDisplayBucketMs(avgA);
      const avgBucketB = avgDisplayBucketMs(avgB);

      if (factsSort === FACT_SORT.ATTEMPTS) {
        if (attemptsB !== attemptsA) return attemptsB - attemptsA;
        if (accB !== accA) return accB - accA;
        return avgB - avgA;
      }

      if (factsSort === FACT_SORT.AVG) {
        if (avgBucketB !== avgBucketA) return avgBucketB - avgBucketA;
        if (attemptsB !== attemptsA) return attemptsB - attemptsA;
        return accB - accA;
      }

      if (accB !== accA) return accB - accA;
      if (attemptsB !== attemptsA) return attemptsB - attemptsA;
      return avgB - avgA;
    });
  }, [facts, factsSort]);

  const renderSortHeader = (key, label) => (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {factsSort === key ? <span aria-hidden="true">↓</span> : null}
    </span>
  );

  const handleDetailLoaded = (data, key) => {
    setLastFactDetail(data);
    setLastFactKey(key);
  };

  const getFactStableId = (f) => f?._id ?? f?.id ?? f?.factId ?? f?.fact?._id ?? null;
  const mergeFacts = (prevFacts, nextFacts) => {
    const combined = [...prevFacts, ...nextFacts];
    const hasStableIds = combined.some((f) => getFactStableId(f) != null);
    if (!hasStableIds) {
      return combined;
    }

    const seen = new Set();
    const merged = [];
    combined.forEach((f) => {
      const stableId = getFactStableId(f);
      if (stableId == null) {
        merged.push(f);
        return;
      }
      const idKey = String(stableId);
      if (seen.has(idKey)) return;
      seen.add(idKey);
      merged.push(f);
    });
    return merged;
  };

  const escapeCsv = (value) => {
    if (value == null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatCsvDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const handleExportCsv = () => {
    const rows = [];
    const todayLabel = new Date().toISOString().slice(0, 10);

    rows.push(["Summary Totals"]);
    rows.push(["Student name", studentInfo.name || ""]);
    rows.push(["Current level", studentInfo.level || ""]);
    rows.push(["Current belt", studentInfo.belt || ""]);
    rows.push(["PIN", pin || ""]);
    rows.push(["Date (exported)", todayLabel]);
    rows.push(["Level filter", level]);
    rows.push(["Operation filter", operation]);
    rows.push([
      "Total attempts",
      summary?.overall?.totalAttempts ?? 0,
    ]);
    rows.push([
      "Total correct",
      summary?.overall?.totalCorrect ?? 0,
    ]);
    rows.push([
      "Accuracy",
      pct(summary?.overall?.accuracy ?? 0),
    ]);
    rows.push([]);
    rows.push(["Facts"]);
    rows.push(["Question", "Accuracy", "Attempts", "Avg Time", "Last Attempt", "Flags"]);
    sortedFacts.forEach((f) => {
      rows.push([
        f.question,
        pct(f.stats?.accuracy),
        f.stats?.totalAttempts ?? 0,
        ms(f.stats?.avgMs),
        f.stats?.lastAttemptAt ? new Date(f.stats.lastAttemptAt).toLocaleDateString() : "",
        `${f.stats?.mastered ? "mastered" : ""}${f.stats?.struggling ? " struggling" : ""}`.trim(),
      ]);
    });

    rows.push([]);
    rows.push(["Recent Attempts (Selected Fact)"]);
    rows.push([
      "Question",
      "Timestamp",
      "Correct",
      "User Answer",
      "Correct Answer",
      "Response Ms",
      "Mode",
      "Choices",
    ]);

    if (lastFactDetail?.recentAttempts?.length) {
      lastFactDetail.recentAttempts.forEach((a) => {
        rows.push([
          lastFactDetail?.fact?.question || "",
          formatCsvDate(a.attemptedAt),
          a.correct ? "Correct" : "Wrong",
          a.userAnswer ?? "",
          a.correctAnswer ?? "",
          a.responseMs ?? "",
          a.gameMode ? "Game mode" : "Quiz",
          Array.isArray(a.choices) ? a.choices.join(" ") : "",
        ]);
      });
    } else {
      rows.push(["", "", "No recent attempts loaded", "", "", "", "", ""]);
    }

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics_${pin || "user"}_${todayLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!pin) return;

    let cancelled = false;
    const loadStudentInfo = async () => {
      const initialName = toSafeStudentText(location.state?.studentName, "Loading...");
      const initialLevel = toSafeStudentText(location.state?.studentLevel, "Loading...");
      const initialBelt = toSafeStudentText(location.state?.studentBelt, "Loading...");
      const initialPin = toSafeStudentText(routePin || location.state?.studentPin || pin, "N/A");

      setStudentInfo((prev) => ({
        ...prev,
        name: initialName,
        level: initialLevel,
        belt: initialBelt,
        pin: initialPin,
      }));

      const adminPin = localStorage.getItem("math-admin-pin") || "";

      const [progressResult, adminStudent] = await Promise.allSettled([
        userGetProgress(pin),
        findStudentFromAdminStats(adminPin, pin),
      ]);

      if (cancelled) return;

      const progressPayload =
        progressResult.status === "fulfilled" ? progressResult.value?.progress : null;
      const progressInfo = getCurrentProgress(progressPayload);
      const resolvedName =
        adminStudent.status === "fulfilled" ? toSafeStudentText(adminStudent.value?.name, "") : "";

      setStudentInfo((prev) => ({
        name: resolvedName || (prev.name === "Loading..." ? "N/A" : prev.name),
        level: progressInfo.level || prev.level || "N/A",
        belt: progressInfo.belt || prev.belt || "N/A",
        pin: toSafeStudentText(pin, prev.pin || "N/A"),
      }));
    };

    loadStudentInfo().catch(() => {
      if (cancelled) return;
      setStudentInfo((prev) => ({
        ...prev,
        name: prev.name === "Loading..." ? "N/A" : prev.name,
        level: prev.level === "Loading..." ? "N/A" : prev.level,
        belt: prev.belt === "Loading..." ? "N/A" : prev.belt,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [pin, routePin, location.state]);

  useEffect(() => {
    if (!pin) {
      setError("Missing user PIN. Please log in again.");
      setLoadingTop(false);
      setLoadingFacts(false);
      return;
    }

    let alive = true;
    async function loadTop() {
      setLoadingTop(true);
      setError("");
      try {
        const [s, st] = await Promise.all([
          analyticsGetSummary(pin),
          analyticsGetStruggling(pin, { level, limit: 10 }),
        ]);
        if (!alive) return;
        setSummary(s);
        setStruggling(st);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load analytics");
      } finally {
        if (alive) setLoadingTop(false);
      }
    }
    loadTop();
    return () => {
      alive = false;
    };
  }, [pin, level]);

  const loadFacts = useCallback(
    async (nextOffset = 0, { append = false } = {}) => {
      if (!pin) return;
      const requestSeq = ++factsRequestSeqRef.current;

      if (append) {
        setLoadingMoreFacts(true);
      } else {
        setLoadingFacts(true);
      }
      setError("");

      try {
        const data = await analyticsGetFacts(pin, {
          level,
          operation,
          limit: FACTS_PAGE_SIZE,
          offset: nextOffset,
        });
        if (requestSeq !== factsRequestSeqRef.current) return;

        const nextFacts = Array.isArray(data?.facts) ? data.facts : [];
        setFacts((prev) => (append ? mergeFacts(prev, nextFacts) : nextFacts));

        const rawPagination = data?.pagination || {};
        const limit = Number(rawPagination.limit);
        const resolvedLimit = Number.isFinite(limit) && limit > 0 ? limit : FACTS_PAGE_SIZE;
        const offset = Number(rawPagination.offset);
        const resolvedOffset = Number.isFinite(offset) && offset >= 0 ? offset : nextOffset;
        const totalRaw = Number(rawPagination.total ?? rawPagination.totalCount);
        const hasMore = Boolean(rawPagination.hasMore);

        setPagination((prev) => ({
          limit: resolvedLimit,
          nextOffset: resolvedOffset + resolvedLimit,
          total: Number.isFinite(totalRaw) && totalRaw >= 0 ? totalRaw : prev.total,
          hasMore,
        }));
      } catch (e) {
        if (requestSeq !== factsRequestSeqRef.current) return;
        setError(e?.message || "Failed to load facts");
      } finally {
        if (append) {
          setLoadingMoreFacts(false);
        } else {
          setLoadingFacts(false);
        }
      }
    },
    [pin, level, operation]
  );

  useEffect(() => {
    setFacts([]);
    setPagination({
      limit: FACTS_PAGE_SIZE,
      nextOffset: 0,
      total: 0,
      hasMore: false,
    });
    loadFacts(0, { append: false });
  }, [loadFacts]);

  const loadMoreFacts = useCallback(() => {
    if (!pagination.hasMore || loadingFacts || loadingMoreFacts) return;
    loadFacts(pagination.nextOffset, { append: true });
  }, [pagination.hasMore, pagination.nextOffset, loadingFacts, loadingMoreFacts, loadFacts]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !pagination.hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMoreFacts();
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pagination.hasMore, loadMoreFacts]);

  const openFact = (f) => {
    setDetailFact({ operation: f.operation, a: f.a, b: f.b });
    setDetailOpen(true);
  };

  const dashboardStyle = {
    background: "radial-gradient(circle at top, #0f172a 0%, #020617 60%, #000 100%)",
    minHeight: "100vh",
    paddingTop: "max(env(safe-area-inset-top), 1rem)",
    paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
  };

  return (
    <div style={dashboardStyle} className="text-white">
      <div className="max-w-8xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            className="kid-btn bg-white/90 hover:bg-white text-black px-4 py-2 flex items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> 
          </button>
          <div className="text-3xl font-extrabold"> Analytics  </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="kid-btn bg-white/90 hover:bg-white text-black px-4 py-2"
          >
            Export CSV
          </button>
        </div>

        {(loadingTop || loadingFacts) && (
          <div className="text-white/80 animate-pulse mb-4">Loading analytics…</div>
        )}

        {error && (
          <div className="bg-red-600/20 border border-red-400 text-red-100 rounded-2xl p-4 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">Name</div>
            <div className="text-2xl font-extrabold">{studentInfo.name}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">Level</div>
            <div className="text-2xl font-extrabold">{studentInfo.level}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">Belt</div>
            <div className="text-2xl font-extrabold">{studentInfo.belt}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">PIN</div>
            <div className="text-2xl font-extrabold">{studentInfo.pin}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">Total attempts</div>
            <div className="text-2xl font-extrabold">{summary?.overall?.totalAttempts ?? 0}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">Total correct</div>
            <div className="text-2xl font-extrabold">{summary?.overall?.totalCorrect ?? 0}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="text-xs text-white/70">Accuracy</div>
            <div className="text-2xl font-extrabold">{pct(summary?.overall?.accuracy ?? 0)}</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 mb-5">
          <div className="font-bold mb-3">Filters</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-white/70 mb-1">Level</div>
              <select
                className="w-full rounded-xl px-3 py-2 text-black"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-white/70 mb-1">Operation</div>
              <select
                className="w-full rounded-xl px-3 py-2 text-black"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                {OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 font-bold mb-3">
            <FaExclamationTriangle /> Struggling facts
          </div>

          {Array.isArray(struggling?.strugglingFacts) && struggling.strugglingFacts.length === 0 && (
            <div className="text-white/70">No struggling facts 🎉</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {struggling?.strugglingFacts?.map((sf, idx) => (
              <button
                key={idx}
                className="text-left bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl p-3 transition"
                onClick={() => openFact({ operation: sf.fact.operation, a: sf.fact.a, b: sf.fact.b })}
              >
                <div className="font-semibold">{sf.question}</div>
                <div className="text-xs text-white/70">
                  attempts {sf.totalAttempts} • accuracy {pct(sf.accuracy)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="font-bold mb-3">Facts</div>

          {loadingFacts && <div className="text-white/70">Loading facts…</div>}

          {!loadingFacts && Array.isArray(sortedFacts) && sortedFacts.length === 0 && (
            <div className="text-white/70">No facts match this filter yet.</div>
          )}

          {!loadingFacts && sortedFacts.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead className="text-xs text-white/70">
                  <tr>
                    <th className="px-2">Question</th>
                    <th className="px-2">
                      <button
                        type="button"
                        onClick={() => setFactsSort(FACT_SORT.ACCURACY)}
                        className="inline-flex items-center p-0 m-0 border-0 bg-transparent text-inherit font-inherit leading-none hover:text-white transition-colors"
                      >
                        {renderSortHeader(FACT_SORT.ACCURACY, "Accuracy")}
                      </button>
                    </th>
                    <th className="px-2">
                      <button
                        type="button"
                        onClick={() => setFactsSort(FACT_SORT.ATTEMPTS)}
                        className="inline-flex items-center p-0 m-0 border-0 bg-transparent text-inherit font-inherit leading-none hover:text-white transition-colors"
                      >
                        {renderSortHeader(FACT_SORT.ATTEMPTS, "Attempts")}
                      </button>
                    </th>
                    <th className="px-2">
                      <button
                        type="button"
                        onClick={() => setFactsSort(FACT_SORT.AVG)}
                        className="inline-flex items-center p-0 m-0 border-0 bg-transparent text-inherit font-inherit leading-none hover:text-white transition-colors"
                      >
                        {renderSortHeader(FACT_SORT.AVG, "Avg")}
                      </button>
                    </th>
                    <th className="px-2">Last</th>
                    <th className="px-2">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFacts.map((f, idx) => (
                    <tr
                      key={
                        getFactStableId(f) ??
                        `${f.operation}-${f.a}-${f.b}-${f.question ?? ""}-${idx}`
                      }
                      className="bg-black/20 hover:bg-black/30 cursor-pointer"
                      onClick={() => openFact(f)}
                    >
                      <td className="px-2 py-2 rounded-l-xl font-semibold">{f.question}</td>
                      <td className="px-2 py-2">{pct(f.stats?.accuracy)}</td>
                      <td className="px-2 py-2">{f.stats?.totalAttempts ?? 0}</td>
                      <td className="px-2 py-2">{ms(f.stats?.avgMs)}</td>
                      <td className="px-2 py-2">
                        {f.stats?.lastAttemptAt ? new Date(f.stats.lastAttemptAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-2 py-2 rounded-r-xl text-xs">
                        {f.stats?.mastered ? "🏆 mastered" : ""}
                        {f.stats?.struggling ? " ⚠️ struggling" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-sm text-white/70">
            <div>
              Showing {sortedFacts.length > 0 ? 1 : 0}-{sortedFacts.length} of{" "}
              {pagination.total || sortedFacts.length}
            </div>
            <div className="flex gap-2">
              <button
                className="kid-btn bg-white/90 hover:bg-white text-black px-4 py-2 disabled:opacity-50"
                disabled={!pagination.hasMore || loadingMoreFacts || loadingFacts}
                onClick={loadMoreFacts}
              >
                {loadingMoreFacts ? "Loading..." : "Load more"}
              </button>
            </div>
          </div>

          {loadingMoreFacts && (
            <div className="mt-3 text-sm text-white/70">Loading more facts...</div>
          )}
          {!pagination.hasMore && !loadingFacts && sortedFacts.length > 0 && (
            <div className="mt-3 text-sm text-white/60">All facts loaded.</div>
          )}
          <div ref={loadMoreRef} className="h-2" />
        </div>
      </div>

      <FactDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        pin={pin}
        factKey={detailFact}
        onDetailLoaded={handleDetailLoaded}
      />
    </div>
  );
}
