import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { weeklySummaryAPI } from '../api';
import {
  Flame, TrendingUp, TrendingDown, Minus, Target,
  BarChart3, PieChart, Activity, Award, Zap,
  Calendar, Scale, Dumbbell, Droplets, Crown,
  CheckCircle2, Sparkles, ArrowRight, Lock,
} from 'lucide-react';
import './WeeklySummaryPage.css';

// ── Helpers ──

function formatDateRange(start, end, offset = 0) {
  const opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  
  let s = start ? new Date(typeof start === 'string' && !start.includes('T') ? start + 'T00:00:00' : start) : null;
  let e = end ? new Date(typeof end === 'string' && !end.includes('T') ? end + 'T00:00:00' : end) : null;
  
  if (!s || isNaN(s.getTime()) || !e || isNaN(e.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    s = new Date(today);
    s.setDate(today.getDate() - daysToMonday - (offset * 7));
    
    e = new Date(s);
    e.setDate(s.getDate() + 6);
  }
  
  return `${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', opts)}`;
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatWeight(w) {
  if (w === null || w === undefined) return '—';
  return `${w.toFixed(1)} kg`;
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getWeekLabel(offset) {
  if (offset === 0) return 'This Week';
  if (offset === 1) return 'Last Week';
  return `${offset} Weeks Ago`;
}

// ── Skeleton Loader ──

function WeeklySkeleton() {
  return (
    <div className="ws">
      <div className="ws__skeleton-tabs">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="ws__skeleton-bar ws__skeleton-tab" />
        ))}
      </div>
      <div className="ws__skeleton-bar ws__skeleton-header" />
      <div className="ws__skeleton-bar ws__skeleton-section" />
      <div className="ws__skeleton-bar ws__skeleton-section" />
    </div>
  );
}

// ── Empty State ──

function WeeklyEmpty() {
  return (
    <div className="ws__empty">
      <div className="ws__empty-icon">📊</div>
      <h3 className="ws__empty-title">No data for this week</h3>
      <p className="ws__empty-sub">
        Start logging your meals, workouts, and weight to see your weekly analytics here.
      </p>
    </div>
  );
}

// ── Consistency Ring ──

function ConsistencyRing({ value, max, variant = 'orange', label, displayValue }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = pct * circ;

  return (
    <div className="ws__consistency-item">
      <div className="ws__consistency-ring">
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} className="ws__consistency-ring-bg" />
          <circle
            cx="28" cy="28" r={r}
            className={`ws__consistency-ring-fill ws__consistency-ring-fill--${variant}`}
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <span className="ws__consistency-ring-text">{displayValue ?? value}</span>
      </div>
      <span className="ws__consistency-label">{label}</span>
    </div>
  );
}

// ── Bar Chart (Calories Trend) ──

function CaloriesBarChart({ dailyBreakdown, target }) {
  const maxCal = Math.max(target, ...dailyBreakdown.map(d => d.food_calories), 1);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="ws__chart-card">
      <div className="ws__chart-title">
        <BarChart3 size={16} />
        Weekly Calories Trend
      </div>
      <div className="ws__bar-chart">
        {dailyBreakdown.map(d => {
          const height = maxCal > 0 ? (d.food_calories / maxCal) * 100 : 0;
          const isToday = d.date === todayStr;
          return (
            <div key={d.date} className="ws__bar-col">
              {d.food_calories > 0 && (
                <span className="ws__bar-value">{d.food_calories}</span>
              )}
              <div
                className={`ws__bar ${isToday ? 'ws__bar--today' : ''}`}
                style={{ height: `${Math.max(height, 1)}%` }}
                title={`${d.day}: ${d.food_calories} kcal`}
              />
              <span className="ws__bar-label">{d.day.slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Line Chart (Weight Trend) ──

function WeightLineChart({ dailyBreakdown }) {
  const weightDays = dailyBreakdown.filter(d => d.weight_kg !== null);

  if (weightDays.length < 2) {
    return (
      <div className="ws__chart-card">
        <div className="ws__chart-title">
          <TrendingUp size={16} />
          Weekly Weight Trend
        </div>
        <div className="ws__empty" style={{ padding: 'var(--space-6) 0' }}>
          <p className="ws__empty-sub">Log weight on at least 2 days to see the trend.</p>
        </div>
      </div>
    );
  }

  const weights = weightDays.map(d => d.weight_kg);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW || 1;

  const width = 280;
  const height = 120;
  const padding = 10;
  const chartW = width - 2 * padding;
  const chartH = height - 2 * padding;

  const points = weightDays.map((d, i) => {
    const x = padding + (i / (weightDays.length - 1)) * chartW;
    const y = padding + chartH - ((d.weight_kg - minW) / range) * chartH;
    return { x, y, weight: d.weight_kg, day: d.day };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="ws__chart-card">
      <div className="ws__chart-title">
        <TrendingUp size={16} />
        Weekly Weight Trend
      </div>
      <div className="ws__line-chart">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} className="ws__line-area" />
          <path d={pathD} className="ws__line-path" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" className="ws__line-dot">
              <title>{p.day}: {p.weight} kg</title>
            </circle>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Donut Chart (Macro Distribution) ──

function MacroDonutChart({ totalProtein, totalCarbs, totalFat }) {
  const total = totalProtein + totalCarbs + totalFat || 1;
  const protPct = totalProtein / total;
  const carbPct = totalCarbs / total;
  const fatPct = totalFat / total;

  const r = 40;
  const circ = 2 * Math.PI * r;

  const protDash = protPct * circ;
  const carbDash = carbPct * circ;
  const fatDash = fatPct * circ;

  const protOffset = 0;
  const carbOffset = protDash;
  const fatOffset = protDash + carbDash;

  return (
    <div className="ws__chart-card">
      <div className="ws__chart-title">
        <PieChart size={16} />
        Macro Distribution
      </div>
      <div className="ws__donut-chart">
        <svg className="ws__donut-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r}
            className="ws__donut-segment ws__donut-segment--protein"
            strokeDasharray={`${protDash} ${circ}`}
            strokeDashoffset={-protOffset}
            transform="rotate(-90 50 50)"
          />
          <circle cx="50" cy="50" r={r}
            className="ws__donut-segment ws__donut-segment--carbs"
            strokeDasharray={`${carbDash} ${circ}`}
            strokeDashoffset={-carbOffset}
            transform="rotate(-90 50 50)"
          />
          <circle cx="50" cy="50" r={r}
            className="ws__donut-segment ws__donut-segment--fat"
            strokeDasharray={`${fatDash} ${circ}`}
            strokeDashoffset={-fatOffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="ws__donut-legend">
          <div className="ws__donut-legend-item">
            <span className="ws__donut-legend-dot ws__donut-legend-dot--protein" />
            Protein: <span className="ws__donut-legend-value">{Math.round(totalProtein)}g</span>
            ({Math.round(protPct * 100)}%)
          </div>
          <div className="ws__donut-legend-item">
            <span className="ws__donut-legend-dot ws__donut-legend-dot--carbs" />
            Carbs: <span className="ws__donut-legend-value">{Math.round(totalCarbs)}g</span>
            ({Math.round(carbPct * 100)}%)
          </div>
          <div className="ws__donut-legend-item">
            <span className="ws__donut-legend-dot ws__donut-legend-dot--fat" />
            Fat: <span className="ws__donut-legend-value">{Math.round(totalFat)}g</span>
            ({Math.round(fatPct * 100)}%)
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gauge Chart (Consistency Score) ──

function ConsistencyGaugeChart({ score }) {
  // Score is 0-100
  const r = 50;
  const circ = Math.PI * r; // half circle
  const dash = (score / 100) * circ;

  const variant = score >= 70 ? 'good' : score >= 40 ? 'ok' : 'low';

  return (
    <div className="ws__chart-card">
      <div className="ws__chart-title">
        <Activity size={16} />
        Consistency Score
      </div>
      <div className="ws__gauge-chart">
        <svg className="ws__gauge-svg" viewBox="0 0 120 70">
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            className="ws__gauge-bg"
          />
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            className={`ws__gauge-fill ws__gauge-fill--${variant}`}
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <div className="ws__gauge-label">{Math.round(score)}%</div>
        <div className="ws__gauge-sub">
          {score >= 70 ? 'Great consistency!' : score >= 40 ? 'Room to improve' : 'Keep pushing!'}
        </div>
      </div>
    </div>
  );
}

// ── Premium Lock ──

function PremiumLock({ children }) {
  return (
    <div className="ws__premium-lock">
      <div className="ws__premium-lock-content">{children}</div>
      <div className="ws__premium-lock-overlay">
        <div className="ws__premium-lock-icon">
          <Lock size={20} />
        </div>
        <span className="ws__premium-lock-text">Premium Feature</span>
        <a href="/premium" className="ws__premium-lock-btn">
          Upgrade to Premium <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
        </a>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function WeeklySummaryPage() {
  const { isPremium } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tabsRef = useRef(null);

  // Week limit: 52 for premium, 4 for free
  const maxWeeks = isPremium ? 52 : 4;

  // ── Fetch week data ──
  const fetchWeek = useCallback(async (offset) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await weeklySummaryAPI.getWeek(offset);
      setData(res);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('premium');
      } else {
        setError(err.response?.data?.error || 'Failed to load weekly summary.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(weekOffset);
  }, [weekOffset, fetchWeek]);

  // Auto-scroll to active tab
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('.ws__week-tab--active');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [weekOffset]);

  const handleWeekSelect = (offset) => {
    if (!isPremium && offset >= maxWeeks) return;
    setWeekOffset(offset);
  };

  // ── Computed values ──
  const dailyBreakdown = data?.daily_breakdown || [];
  const hasData = data && data.days_tracked > 0;
  const consistencyScore = hasData
    ? Math.round(
        ((data.days_tracked / 7) * 40) +
        ((data.workout_completion_pct || 0) * 0.3) +
        ((data.goal_achievement_pct || 0) * 0.3)
      )
    : 0;

  // ── Render ──
  return (
    <div className="ws animate-fade-in" id="weekly-summary-page">
      {/* ── Week Navigation Tabs ── */}
      <div className="ws__week-nav">
        <div className="ws__week-tabs" ref={tabsRef}>
          {Array.from({ length: 52 }, (_, i) => {
            const isLocked = !isPremium && i >= maxWeeks;
            return (
              <button
                key={i}
                className={[
                  'ws__week-tab',
                  weekOffset === i && 'ws__week-tab--active',
                  isLocked && 'ws__week-tab--locked',
                ].filter(Boolean).join(' ')}
                onClick={() => handleWeekSelect(i)}
                disabled={isLocked}
                type="button"
                id={`week-tab-${i}`}
              >
                {getWeekLabel(i)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && <WeeklySkeleton />}

      {/* ── Error State ── */}
      {!loading && error === 'premium' && (
        <div className="ws__empty">
          <div className="ws__empty-icon">🔒</div>
          <h3 className="ws__empty-title">Premium Feature</h3>
          <p className="ws__empty-sub">
            Access to full 52-week history requires Premium. Upgrade to unlock.
          </p>
          <a href="/premium" className="ws__premium-lock-btn" style={{ marginTop: 'var(--space-4)' }}>
            Upgrade Now
          </a>
        </div>
      )}

      {!loading && error && error !== 'premium' && (
        <div className="ws__empty">
          <div className="ws__empty-icon">⚠️</div>
          <h3 className="ws__empty-title">Something went wrong</h3>
          <p className="ws__empty-sub">{error}</p>
        </div>
      )}

      {/* ── Main Content ── */}
      {!loading && !error && data && (
        <>
          {/* ── Header Card ── */}
          <div className="ws__header" id="ws-header-card">
            <div className="ws__header-range">
              <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {formatDateRange(data.week_start, data.week_end, weekOffset)}
            </div>
            <div className="ws__header-stats">
              <div className="ws__header-stat">
                <span className="ws__header-stat-value">
                  {data.total_calories?.toLocaleString() || 0}
                </span>
                <span className="ws__header-stat-label">Total Calories</span>
              </div>
              <div className="ws__header-stat">
                <span className="ws__header-stat-value">{data.days_tracked}/7</span>
                <span className="ws__header-stat-label">Days Tracked</span>
              </div>
              <div className="ws__header-stat">
                <span className="ws__header-stat-value">{data.goal_achievement_pct || 0}%</span>
                <span className="ws__header-stat-label">Goal Hit</span>
              </div>
            </div>
            <div className="ws__header-bottom">
              {data.calorie_diff_vs_prev !== null && (
                <span className="ws__header-badge">
                  {data.calorie_diff_vs_prev > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {data.calorie_diff_vs_prev > 0 ? '+' : ''}{data.calorie_diff_vs_prev} kcal vs last week
                </span>
              )}
              {data.weight_change !== null && (
                <span className="ws__header-badge">
                  <Scale size={13} />
                  {data.weight_change > 0 ? '+' : ''}{data.weight_change} kg
                </span>
              )}
              {data.streak_count > 0 && (
                <span className="ws__header-badge">
                  <Zap size={13} />
                  {data.streak_count} day streak
                </span>
              )}
              <span className="ws__header-badge">
                <Award size={13} />
                {data.meals_logged} meals logged
              </span>
            </div>
          </div>

          {/* ── Empty Week ── */}
          {!hasData && <WeeklyEmpty />}

          {hasData && (
            <>
              {/* ── Calories Section ── */}
              <div className="ws__section" id="ws-calories-section">
                <div className="ws__section-header">
                  <div className="ws__section-icon ws__section-icon--orange">
                    <Flame size={18} />
                  </div>
                  <h3 className="ws__section-title">Calories</h3>
                </div>
                <div className="ws__section-body">
                  <div className="ws__table-wrap">
                    <table className="ws__table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Date</th>
                          <th>Food Cal</th>
                          <th>Exercise Cal</th>
                          <th>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyBreakdown.map(d => (
                          <tr key={d.date}>
                            <td className="ws__table-day">{d.day}</td>
                            <td><span className="ws__table-date">{formatShortDate(d.date)}</span></td>
                            <td>
                              {d.meals_logged > 0
                                ? <span className="ws__table-value--highlight">{d.food_calories}</span>
                                : <span className="ws__table-empty">—</span>}
                            </td>
                            <td>{d.exercise_calories > 0 ? d.exercise_calories : <span className="ws__table-empty">—</span>}</td>
                            <td>{d.meals_logged > 0 ? d.remaining_calories : <span className="ws__table-empty">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="ws__table-footer">
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Weekly Total</span>
                      <span className="ws__table-footer-value">{data.total_calories?.toLocaleString()} kcal</span>
                    </div>
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Daily Average</span>
                      <span className="ws__table-footer-value">{data.avg_calories?.toLocaleString()} kcal</span>
                    </div>
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">vs Previous Week</span>
                      <span className={`ws__table-footer-value ${
                        data.calorie_diff_vs_prev > 0
                          ? 'ws__table-footer-value--negative'
                          : data.calorie_diff_vs_prev < 0
                            ? 'ws__table-footer-value--positive'
                            : 'ws__table-footer-value--neutral'
                      }`}>
                        {data.calorie_diff_vs_prev !== null
                          ? `${data.calorie_diff_vs_prev > 0 ? '+' : ''}${data.calorie_diff_vs_prev} kcal`
                          : '—'}
                      </span>
                    </div>
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Goal Achievement</span>
                      <span className="ws__table-footer-value">{data.goal_achievement_pct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Macronutrient Section ── */}
              <div className="ws__section" id="ws-macros-section">
                <div className="ws__section-header">
                  <div className="ws__section-icon ws__section-icon--blue">
                    <PieChart size={18} />
                  </div>
                  <h3 className="ws__section-title">Macronutrients</h3>
                </div>
                <div className="ws__section-body">
                  <div className="ws__table-wrap">
                    <table className="ws__table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Carbs (g)</th>
                          <th>Protein (g)</th>
                          <th>Fat (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyBreakdown.map(d => (
                          <tr key={d.date}>
                            <td className="ws__table-day">
                              {d.day}
                              <span className="ws__table-date"> {formatShortDate(d.date)}</span>
                            </td>
                            <td>{d.meals_logged > 0 ? Math.round(d.carbs) : <span className="ws__table-empty">—</span>}</td>
                            <td>{d.meals_logged > 0 ? Math.round(d.protein) : <span className="ws__table-empty">—</span>}</td>
                            <td>{d.meals_logged > 0 ? Math.round(d.fat) : <span className="ws__table-empty">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="ws__table-footer">
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Total Protein</span>
                      <span className="ws__table-footer-value">{Math.round(data.total_protein)}g</span>
                    </div>
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Total Carbs</span>
                      <span className="ws__table-footer-value">{Math.round(data.total_carbs)}g</span>
                    </div>
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Total Fat</span>
                      <span className="ws__table-footer-value">{Math.round(data.total_fat)}g</span>
                    </div>
                    <div className="ws__table-footer-item">
                      <span className="ws__table-footer-label">Macro Adherence</span>
                      <span className="ws__table-footer-value">{data.macro_adherence_pct || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Weight Section ── */}
              <div className="ws__section" id="ws-weight-section">
                <div className="ws__section-header">
                  <div className="ws__section-icon ws__section-icon--green">
                    <Scale size={18} />
                  </div>
                  <h3 className="ws__section-title">Weight Tracking</h3>
                </div>
                <div className="ws__section-body">
                  {dailyBreakdown.some(d => d.weight_kg !== null) ? (
                    <>
                      <div className="ws__table-wrap">
                        <table className="ws__table">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Time</th>
                              <th>Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyBreakdown.map(d => (
                              <tr key={d.date}>
                                <td className="ws__table-day">
                                  {d.day}
                                  <span className="ws__table-date"> {formatShortDate(d.date)}</span>
                                </td>
                                <td>{d.weight_kg !== null ? formatTime(d.weight_time) : <span className="ws__table-empty">—</span>}</td>
                                <td>
                                  {d.weight_kg !== null
                                    ? <span className="ws__table-value--highlight">{formatWeight(d.weight_kg)}</span>
                                    : <span className="ws__table-empty">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="ws__table-footer">
                        <div className="ws__table-footer-item">
                          <span className="ws__table-footer-label">Starting Weight</span>
                          <span className="ws__table-footer-value">{formatWeight(data.start_weight)}</span>
                        </div>
                        <div className="ws__table-footer-item">
                          <span className="ws__table-footer-label">Ending Weight</span>
                          <span className="ws__table-footer-value">{formatWeight(data.end_weight)}</span>
                        </div>
                        <div className="ws__table-footer-item">
                          <span className="ws__table-footer-label">Net Change</span>
                          <span className={`ws__table-footer-value ${
                            data.weight_change > 0
                              ? 'ws__table-footer-value--negative'
                              : data.weight_change < 0
                                ? 'ws__table-footer-value--positive'
                                : 'ws__table-footer-value--neutral'
                          }`}>
                            {data.weight_change !== null
                              ? `${data.weight_change > 0 ? '+' : ''}${data.weight_change} kg`
                              : '—'}
                          </span>
                        </div>
                        <div className="ws__table-footer-item">
                          <span className="ws__table-footer-label">Trend</span>
                          <div className={`ws__weight-trend ${
                            data.weight_change > 0
                              ? 'ws__weight-trend--up'
                              : data.weight_change < 0
                                ? 'ws__weight-trend--down'
                                : 'ws__weight-trend--stable'
                          }`}>
                            {data.weight_change > 0 ? <TrendingUp size={16} /> : data.weight_change < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                            {data.weight_change > 0 ? 'Gaining' : data.weight_change < 0 ? 'Losing' : 'Stable'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="ws__empty" style={{ padding: 'var(--space-6) 0' }}>
                      <div className="ws__empty-icon">⚖️</div>
                      <h3 className="ws__empty-title" style={{ fontSize: 'var(--font-size-lg)' }}>No weight data</h3>
                      <p className="ws__empty-sub">Log your daily weight to track progress.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Consistency Section ── */}
              <div className="ws__section" id="ws-consistency-section">
                <div className="ws__section-header">
                  <div className="ws__section-icon ws__section-icon--purple">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="ws__section-title">Consistency</h3>
                </div>
                <div className="ws__section-body">
                  <div className="ws__consistency-grid">
                    <ConsistencyRing
                      value={data.days_tracked}
                      max={7}
                      variant="orange"
                      label="Days Logged"
                      displayValue={`${data.days_tracked}/7`}
                    />
                    <ConsistencyRing
                      value={data.meals_logged}
                      max={21}
                      variant="green"
                      label="Meals Logged"
                      displayValue={data.meals_logged}
                    />
                    <ConsistencyRing
                      value={data.workout_completion_pct || 0}
                      max={100}
                      variant="blue"
                      label="Workout %"
                      displayValue={`${data.workout_completion_pct || 0}%`}
                    />
                    <ConsistencyRing
                      value={data.water_days || 0}
                      max={7}
                      variant="blue"
                      label="Water Days"
                      displayValue={`${data.water_days || 0}/7`}
                    />
                    <ConsistencyRing
                      value={data.goal_achievement_pct || 0}
                      max={100}
                      variant="green"
                      label="Goal Hit %"
                      displayValue={`${data.goal_achievement_pct || 0}%`}
                    />
                    <ConsistencyRing
                      value={data.streak_count || 0}
                      max={7}
                      variant="purple"
                      label="Streak"
                      displayValue={data.streak_count || 0}
                    />
                  </div>
                </div>
              </div>

              {/* ── AI Insights Section ── */}
              <div className="ws__section" id="ws-ai-insights-section">
                <div className="ws__section-header">
                  <div className="ws__section-icon ws__section-icon--yellow">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="ws__section-title">
                    {isPremium ? 'AI Insights' : 'Insights'}
                    {isPremium && <Crown size={14} style={{ marginLeft: 6, color: 'var(--color-primary-500)' }} />}
                  </h3>
                </div>
                <div className="ws__section-body">
                  {data.ai_insights && data.ai_insights.length > 0 ? (
                    <div className="ws__insights-list">
                      {data.ai_insights.map((insight, i) => (
                        <div key={i} className="ws__insight-item">
                          <span className="ws__insight-icon">💡</span>
                          {insight}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ws__empty" style={{ padding: 'var(--space-4) 0' }}>
                      <p className="ws__empty-sub">Not enough data to generate insights yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── AI Coach Summary ── */}
              <div className="ws__section" id="ws-coach-summary-section">
                <div className="ws__section-header">
                  <div className="ws__section-icon ws__section-icon--orange">
                    <Award size={18} />
                  </div>
                  <h3 className="ws__section-title">
                    Coach Summary
                    <Crown size={14} style={{ marginLeft: 6, color: 'var(--color-primary-500)' }} />
                  </h3>
                </div>
                <div className="ws__section-body">
                  {isPremium ? (
                    data.ai_coach_summary ? (
                      <div className="ws__coach-summary">
                        <p>{data.ai_coach_summary}</p>
                      </div>
                    ) : (
                      <div className="ws__empty" style={{ padding: 'var(--space-4) 0' }}>
                        <p className="ws__empty-sub">Coach summary will appear once you have enough weekly data.</p>
                      </div>
                    )
                  ) : (
                    <PremiumLock>
                      <div className="ws__coach-summary">
                        <p>Great progress this week. You stayed within your calorie goal on 5 of 7 days and increased protein intake. Focus on hydration and workout consistency next week.</p>
                      </div>
                    </PremiumLock>
                  )}
                </div>
              </div>

              {/* ── Charts ── */}
              <div className="ws__charts-grid" id="ws-charts-section">
                <CaloriesBarChart
                  dailyBreakdown={dailyBreakdown}
                  target={data.targets?.calories || 2000}
                />
                <WeightLineChart dailyBreakdown={dailyBreakdown} />
                <MacroDonutChart
                  totalProtein={data.total_protein || 0}
                  totalCarbs={data.total_carbs || 0}
                  totalFat={data.total_fat || 0}
                />
                <ConsistencyGaugeChart score={consistencyScore} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
