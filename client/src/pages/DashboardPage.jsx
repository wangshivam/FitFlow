import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { foodAPI } from '../api';
import Card from '../components/shared/Card';
import ProgressBar from '../components/shared/ProgressBar';
import SkeletonLoader from '../components/shared/SkeletonLoader';
import MicroOnboardingModal from '../components/shared/MicroOnboardingModal';
import {
  Flame, Plus, Utensils, Coffee, Sun,
  Moon, Dumbbell, TrendingUp, Target, Droplets, Sparkles,
} from 'lucide-react';
import './DashboardPage.css';

const mealIcons = {
  breakfast: Coffee,
  morning_chai: Coffee,
  lunch: Sun,
  dinner: Moon,
  evening_snack: Utensils,
  pre_workout: Dumbbell,
  post_workout: Dumbbell,
};

const mealLabels = {
  breakfast: 'Breakfast',
  morning_chai: 'Morning Chai',
  lunch: 'Lunch',
  dinner: 'Dinner',
  evening_snack: 'Evening Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function DashboardPage() {
  const { profile, isOnboarded } = useAuth();
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTodayData();
  }, []);

  // Auto-open onboarding modal if not onboarded and no targets
  useEffect(() => {
    if (!isOnboarded && !loading) {
      setShowOnboarding(true);
    }
  }, [isOnboarded, loading]);

  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const [summaryRes, logsRes] = await Promise.all([
        foodAPI.getSummary(today),
        foodAPI.getLogs(today),
      ]);
      setSummary(summaryRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      // Fallback to empty state if backend not available
      setSummary(null);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const caloriesConsumed = summary?.consumed?.calories || 0;
  const caloriesTarget = summary?.targets?.calories || profile?.daily_calorie_target || null;
  const caloriesLeft = caloriesTarget ? Math.max(0, caloriesTarget - caloriesConsumed) : null;
  const onboardingRequired = summary?.onboarding_required || (!isOnboarded && !caloriesTarget);

  const macros = [
    {
      key: 'protein',
      label: 'Protein',
      current: Math.round(summary?.consumed?.protein || 0),
      target: summary?.targets?.protein || profile?.daily_protein_target || null,
      unit: 'g',
      variant: 'primary',
    },
    {
      key: 'carbs',
      label: 'Carbs',
      current: Math.round(summary?.consumed?.carbs || 0),
      target: summary?.targets?.carbs || profile?.daily_carb_target || null,
      unit: 'g',
      variant: 'warning',
    },
    {
      key: 'fat',
      label: 'Fats',
      current: Math.round(summary?.consumed?.fat || 0),
      target: summary?.targets?.fat || profile?.daily_fat_target || null,
      unit: 'g',
      variant: 'info',
    },
  ];

  return (
    <div className="dashboard animate-fade-in">
      {/* Onboarding Banner — shown when targets not set */}
      {onboardingRequired && !showOnboarding && (
        <div className="dashboard__onboarding-banner">
          <Sparkles size={16} />
          <span>Set up your plan to see accurate calorie & macro targets</span>
          <button className="dashboard__onboarding-btn" onClick={() => setShowOnboarding(true)}>
            Personalise →
          </button>
        </div>
      )}

      <MicroOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
      {/* Daily Calories Card */}
      <Card variant="highlight" padding="lg" className="dashboard__calories">
        {loading ? (
          <>
            <SkeletonLoader height={20} width="40%" className="mb-2" />
            <SkeletonLoader height={48} width="60%" className="mb-3" />
            <SkeletonLoader height={12} width="100%" />
          </>
        ) : (
          <>
            <div className="dashboard__calories-header">
              <div className="dashboard__calories-label">
                <span className="dashboard__calories-dot" />
                Daily Calories
              </div>
              {onboardingRequired ? (
                <button
                  className="dashboard__calories-left dashboard__calories-left--cta"
                  onClick={() => setShowOnboarding(true)}
                >
                  Set up your plan →
                </button>
              ) : (
                <span className="dashboard__calories-left">
                  {caloriesConsumed > 0
                    ? caloriesLeft > 0
                      ? `${caloriesLeft} kcal left`
                      : '🎯 Target reached!'
                    : 'Start logging meals'}
                </span>
              )}
            </div>
            <div className="dashboard__calories-value">
              <span className="dashboard__calories-number">{caloriesConsumed.toLocaleString()}</span>
              <span className="dashboard__calories-target">
                {caloriesTarget ? `/ ${caloriesTarget.toLocaleString()} kcal` : '/ — kcal'}
              </span>
            </div>
            {caloriesTarget && (
              <ProgressBar
                value={caloriesConsumed}
                max={caloriesTarget}
                variant="primary"
                size="lg"
              />
            )}
            <div className="dashboard__calories-meta">
              <span><Flame size={13} /> {caloriesConsumed} eaten</span>
              <span><Target size={13} /> {caloriesLeft !== null ? caloriesLeft : '—'} remaining</span>
            </div>
          </>
        )}
      </Card>

      {/* Macro Cards */}
      <div className="dashboard__macros">
        {loading
          ? [1, 2, 3].map((i) => (
              <Card key={i} variant="default" padding="md">
                <SkeletonLoader height={16} width="50%" className="mb-2" />
                <SkeletonLoader height={32} width="70%" className="mb-2" />
                <SkeletonLoader height={8} width="100%" />
              </Card>
            ))
          : macros.map(({ key, label, current, target, unit, variant }) => (
              <Card key={key} variant="default" padding="md" className="dashboard__macro-card">
                <div className="dashboard__macro-label">{label}</div>
                <div className="dashboard__macro-value">
                  <span className="dashboard__macro-number">{current}</span>
                  <span className="dashboard__macro-unit">/{target ?? '—'}{target ? unit : ''}</span>
                </div>
                {target ? (
                  <ProgressBar value={current} max={target} variant={variant} size="md" />
                ) : (
                  <div className="dashboard__macro-no-target" onClick={() => setShowOnboarding(true)}>
                    Set target →
                  </div>
                )}
              </Card>
            ))}
      </div>

      {/* Today's Meals */}
      <Card variant="default" padding="lg" className="dashboard__meals">
        <div className="dashboard__meals-header">
          <h3>Today's Meals</h3>
          <a href="/diet" className="dashboard__meals-view-all">View All →</a>
        </div>

        {loading ? (
          <div className="dashboard__meals-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dashboard__meal-item">
                <SkeletonLoader height={40} width={40} className="dashboard__meal-icon-skel" />
                <div style={{ flex: 1 }}>
                  <SkeletonLoader height={14} width="60%" className="mb-1" />
                  <SkeletonLoader height={12} width="40%" />
                </div>
                <SkeletonLoader height={14} width={60} />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="dashboard__meals-empty">
            <Utensils size={32} className="dashboard__meals-empty-icon" />
            <p>No meals logged today</p>
            <span>Tap the + button to log your first meal</span>
          </div>
        ) : (
          <div className="dashboard__meals-list">
            {logs.slice(0, 5).map((log) => {
              const MealIcon = mealIcons[log.meal_slot] || Utensils;
              return (
                <div key={log.id} className="dashboard__meal-item">
                  <div className="dashboard__meal-icon">
                    <MealIcon size={18} />
                  </div>
                  <div className="dashboard__meal-info">
                    <span className="dashboard__meal-name">{log.raw_input}</span>
                    <span className="dashboard__meal-meta">
                      {mealLabels[log.meal_slot] || log.meal_slot} • {formatTime(log.created_at)}
                    </span>
                  </div>
                  <div className="dashboard__meal-stats">
                    <span className="dashboard__meal-cal">{log.total_calories} kcal</span>
                    <span className="dashboard__meal-protein">P: {Math.round(log.total_protein)}g</span>
                  </div>
                </div>
              );
            })}
            {logs.length > 5 && (
              <p className="dashboard__meals-more">+{logs.length - 5} more meals today</p>
            )}
          </div>
        )}
      </Card>

      {/* Stats Row */}
      <div className="dashboard__stats">
        <Card variant="default" padding="md" className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--orange">
            <TrendingUp size={20} />
          </div>
          <div className="dashboard__stat-info">
            <span className="dashboard__stat-value">{logs.length}</span>
            <span className="dashboard__stat-label">Meals logged</span>
          </div>
        </Card>
        <Card variant="default" padding="md" className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--blue">
            <Droplets size={20} />
          </div>
          <div className="dashboard__stat-info">
            <span className="dashboard__stat-value">—</span>
            <span className="dashboard__stat-label">Water intake</span>
          </div>
        </Card>
        <Card variant="default" padding="md" className="dashboard__stat-card" hover onClick={() => window.location.href = '/weekly-summary'}>
          <div className="dashboard__stat-icon dashboard__stat-icon--green">
            <TrendingUp size={20} />
          </div>
          <div className="dashboard__stat-info">
            <span className="dashboard__stat-value">Weekly</span>
            <span className="dashboard__stat-label">View Summary →</span>
          </div>
        </Card>
      </div>

      {/* FAB — Log Food */}
      <a href="/diet" className="dashboard__fab" aria-label="Log food">
        <Plus size={24} />
      </a>
    </div>
  );
}
