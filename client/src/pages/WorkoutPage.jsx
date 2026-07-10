import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { plannerAPI } from '../api';
import {
  Dumbbell, Flame, Clock, CheckCircle2, Check,
  ChevronDown, ChevronLeft, ChevronRight, Moon,
  Zap, RefreshCw, Loader2, Trophy, Sparkles, Circle,
} from 'lucide-react';
import './WorkoutPage.css';

// ── Helpers ──

function isoDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(selectedDate) {
  const sel = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = sel.getDay();
  const startOfWeek = new Date(sel);
  startOfWeek.setDate(sel.getDate() - dayOfWeek);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const rows = [];
  const cursor = new Date(year, month, 1 - startDay);
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      row.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }
  return rows;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Week Scroller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function WeekScroller({ selectedDate, onSelectDate, weekPlans }) {
  const todayStr = isoDate(new Date());
  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="wk__week-scroller">
      {weekDates.map((d) => {
        const iso = isoDate(d);
        const isSelected = iso === selectedDate;
        const isToday = iso === todayStr;
        const plan = weekPlans.find((p) => p.plan_date === iso);
        const isCompleted = plan?.status === 'completed';
        const isRestDay = plan?.is_rest_day;
        const isFuture = d > new Date();

        return (
          <button
            key={iso}
            className={[
              'wk__week-day',
              isSelected && 'wk__week-day--selected',
              isToday && 'wk__week-day--today',
            ].filter(Boolean).join(' ')}
            onClick={() => onSelectDate(iso)}
            type="button"
          >
            <span className="wk__week-day-name">{SHORT_DAYS[d.getDay()]}</span>
            <span className="wk__week-day-num">{d.getDate()}</span>
            <span className="wk__week-day-dot">
              {isCompleted ? (
                <Check size={10} className="wk__dot--done" />
              ) : isRestDay ? (
                <Moon size={8} className="wk__dot--rest" />
              ) : plan && !isFuture ? (
                <Circle size={6} className="wk__dot--pending" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Full Calendar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FullCalendar({ selectedDate, onSelectDate, onClose }) {
  const sel = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth());
  const todayStr = isoDate(new Date());
  const grid = getMonthGrid(viewYear, viewMonth);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else { setViewMonth((m) => m - 1); }
  };

  const goNextMonth = () => {
    const now = new Date();
    if (viewYear === now.getFullYear() && viewMonth >= now.getMonth()) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else { setViewMonth((m) => m + 1); }
  };

  const handleDayClick = (d) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    if (d > tomorrow) return;
    onSelectDate(isoDate(d));
    onClose();
  };

  const now = new Date();
  const isNextDisabled = viewYear === now.getFullYear() && viewMonth >= now.getMonth();

  return (
    <motion.div
      className="wk__calendar"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="wk__cal-nav">
        <button className="wk__cal-nav-btn" onClick={goPrevMonth} type="button" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <span className="wk__cal-month">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="wk__cal-nav-btn" onClick={goNextMonth} type="button" disabled={isNextDisabled} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="wk__cal-grid">
        {CAL_DAYS.map((d) => (
          <span key={d} className="wk__cal-head">{d}</span>
        ))}
        {grid.flat().map((d, i) => {
          const iso = isoDate(d);
          const isCurrentMonth = d.getMonth() === viewMonth;
          const isSelected = iso === selectedDate;
          const isToday = iso === todayStr;
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(23, 59, 59, 999);
          const isFuture = d > tomorrow;

          return (
            <button
              key={i}
              className={[
                'wk__cal-day',
                !isCurrentMonth && 'wk__cal-day--outside',
                isSelected && 'wk__cal-day--selected',
                isToday && !isSelected && 'wk__cal-day--today',
                isFuture && 'wk__cal-day--disabled',
              ].filter(Boolean).join(' ')}
              onClick={() => handleDayClick(d)}
              disabled={isFuture}
              type="button"
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Month Header
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MonthHeader({ selectedDate, isOpen, onToggle }) {
  const sel = new Date(selectedDate + 'T00:00:00');
  const todayStr = isoDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = isoDate(tomorrowDate);
  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;

  const label = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : sel.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <button className="wk__month-header" onClick={onToggle} type="button">
      <span className="wk__month-label">{label}</span>
      <ChevronDown
        size={18}
        className={`wk__month-chevron ${isOpen ? 'wk__month-chevron--open' : ''}`}
      />
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Exercise Card (with checkbox)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ExerciseCard({ exercise, index, isCompleted, onToggle, isToday, disabled }) {
  const [expanded, setExpanded] = useState(false);

  const setRep = exercise.reps
    ? `${exercise.sets} × ${exercise.reps} reps`
    : `${exercise.sets} × ${Math.floor((exercise.duration_sec || 30) / 60) > 0
        ? `${Math.floor(exercise.duration_sec / 60)}m `
        : ''}${(exercise.duration_sec || 30) % 60 > 0 ? `${(exercise.duration_sec || 30) % 60}s` : ''}`;

  return (
    <motion.div
      className={`wk__exercise ${isCompleted ? 'wk__exercise--done' : ''}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <div className="wk__exercise-row">
        {isToday && (
          <button
            className={`wk__exercise-check ${isCompleted ? 'wk__exercise-check--checked' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            disabled={disabled}
            type="button"
            aria-label={isCompleted ? 'Unmark exercise' : 'Mark exercise complete'}
          >
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Check size={14} />
              </motion.div>
            ) : (
              <span className="wk__exercise-check-ring" />
            )}
          </button>
        )}
        <div
          className="wk__exercise-body"
          onClick={() => exercise.instructions && setExpanded(!expanded)}
          role={exercise.instructions ? 'button' : undefined}
        >
          <div className="wk__exercise-num">{index + 1}</div>
          <div className="wk__exercise-info">
            <span className="wk__exercise-name">{exercise.name}</span>
            <span className="wk__exercise-meta">{setRep}</span>
          </div>
          {exercise.muscle_group && (
            <span className="wk__exercise-muscle">{exercise.muscle_group.replace('_', ' ')}</span>
          )}
          {exercise.rest_sec && (
            <span className="wk__exercise-rest">{exercise.rest_sec}s rest</span>
          )}
          {exercise.instructions && (
            <ChevronDown
              size={14}
              className={`wk__exercise-chevron ${expanded ? 'wk__exercise-chevron--open' : ''}`}
            />
          )}
        </div>
      </div>
      <AnimatePresence>
        {expanded && exercise.instructions && (
          <motion.div
            className="wk__exercise-instructions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p>{exercise.instructions}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Exercise Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ExerciseSection({ title, icon, exercises, completedExercises, onToggle, isToday, disabled, sectionKey }) {
  if (!exercises || exercises.length === 0) return null;

  return (
    <div className="wk__section">
      <div className="wk__section-header">
        <span className="wk__section-icon">{icon}</span>
        <span className="wk__section-title">{title}</span>
        <span className="wk__section-count">{exercises.length}</span>
      </div>
      <div className="wk__section-list">
        {exercises.map((ex, i) => {
          const exKey = `${sectionKey}-${i}`;
          const isDone = completedExercises.includes(exKey);
          return (
            <ExerciseCard
              key={exKey}
              exercise={ex}
              index={i}
              isCompleted={isDone}
              onToggle={() => onToggle(exKey)}
              isToday={isToday}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Completion Celebration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CompletionCelebration() {
  return (
    <motion.div
      className="wk__celebration"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.div
        className="wk__celebration-icon"
        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Trophy size={28} />
      </motion.div>
      <span className="wk__celebration-text">Workout Complete 🔥</span>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Skeleton Loader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function WorkoutSkeleton() {
  return (
    <div className="wk__skeleton">
      <div className="wk__skeleton-header" />
      <div className="wk__skeleton-stats" />
      <div className="wk__skeleton-exercise" />
      <div className="wk__skeleton-exercise" />
      <div className="wk__skeleton-exercise" />
      <div className="wk__skeleton-exercise" />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN WORKOUT PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FEEDBACK_OPTIONS = [
  { value: 'too_easy', label: 'Too Easy', emoji: '😎', color: 'blue' },
  { value: 'perfect', label: 'Perfect!', emoji: '🎯', color: 'green' },
  { value: 'too_hard', label: 'Too Hard', emoji: '😓', color: 'orange' },
];

export default function WorkoutPage() {
  const { profile, isOnboarded } = useAuth();
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [plan, setPlan] = useState(null);
  const [weekPlans, setWeekPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const todayStr = isoDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = isoDate(tomorrowDate);
  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;
  const isPastDay = selectedDate < todayStr;
  const isCompleted = plan?.status === 'completed';
  const savingRef = useRef(false);

  // Total exercises across all sections
  const allExerciseKeys = [];
  (plan?.warm_up || []).forEach((_, i) => allExerciseKeys.push(`warmup-${i}`));
  (plan?.workout || []).forEach((_, i) => allExerciseKeys.push(`main-${i}`));
  (plan?.cool_down || []).forEach((_, i) => allExerciseKeys.push(`cooldown-${i}`));

  const totalExercises = allExerciseKeys.length;
  const doneCount = completedExercises.filter((k) => allExerciseKeys.includes(k)).length;
  const progressPct = totalExercises > 0 ? Math.round((doneCount / totalExercises) * 100) : 0;
  const allDone = totalExercises > 0 && doneCount === totalExercises;

  // Fetch plan for selected date
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (selectedDate === todayStr) {
        const res = await plannerAPI.getToday();
        data = res.data;
      } else {
        const res = await plannerAPI.getDate(selectedDate);
        data = res.data;
      }
      setPlan(data.plan);
      setCompletedExercises(data.plan?.completed_exercises || []);
    } catch {
      setPlan(null);
      setCompletedExercises([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, todayStr]);

  // Fetch week status
  const fetchWeekPlans = useCallback(async () => {
    try {
      const { data } = await plannerAPI.getWeek(selectedDate);
      setWeekPlans(data.plans || []);
    } catch {
      setWeekPlans([]);
    }
  }, [selectedDate]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);
  useEffect(() => { fetchWeekPlans(); }, [fetchWeekPlans]);

  // Toggle exercise completion
  const handleToggleExercise = useCallback(async (exerciseKey) => {
    if (!plan || !isToday || isCompleted || savingRef.current) return;

    const newCompleted = completedExercises.includes(exerciseKey)
      ? completedExercises.filter((k) => k !== exerciseKey)
      : [...completedExercises, exerciseKey];

    setCompletedExercises(newCompleted);

    // Debounced save to server
    savingRef.current = true;
    try {
      await plannerAPI.updateExercises(plan.id, { completed_exercises: newCompleted });
    } catch { /* silent */ } finally {
      savingRef.current = false;
    }
  }, [plan, isToday, isCompleted, completedExercises]);

  // Auto-show celebration when all exercises done
  useEffect(() => {
    if (allDone && isToday && !isCompleted && totalExercises > 0) {
      setShowCelebration(true);
      // Auto show feedback after celebration
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowCelebration(false);
    }
  }, [allDone, isToday, isCompleted, totalExercises]);

  // Complete workout with feedback
  const handleComplete = async () => {
    if (!plan || !selectedFeedback) return;
    setCompleting(true);
    try {
      const { data } = await plannerAPI.complete(plan.id, {
        feedback: selectedFeedback,
        completed_exercises: completedExercises,
      });
      setPlan(data.plan);
      setShowFeedback(false);
      setShowCelebration(false);
      fetchWeekPlans();
    } catch { /* ignore */ } finally {
      setCompleting(false);
    }
  };

  // Regenerate workout
  const handleRegenerate = async () => {
    if (!isToday || regenerating) return;
    setRegenerating(true);
    try {
      const { data } = await plannerAPI.regenerate({});
      setPlan(data.plan);
      setCompletedExercises([]);
      fetchWeekPlans();
    } catch { /* ignore */ } finally {
      setRegenerating(false);
    }
  };

  // Date selection
  const handleDateSelect = (iso) => {
    setSelectedDate(iso);
    setShowFeedback(false);
    setShowCelebration(false);
    setSelectedFeedback(null);
  };

  // ── Render ──

  return (
    <div className="wk">
      {/* Month Header + Calendar */}
      <MonthHeader
        selectedDate={selectedDate}
        isOpen={calendarOpen}
        onToggle={() => setCalendarOpen((o) => !o)}
      />

      <AnimatePresence>
        {calendarOpen && (
          <FullCalendar
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onClose={() => setCalendarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Week Scroller */}
      <WeekScroller
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        weekPlans={weekPlans}
      />

      {/* Content */}
      {loading ? (
        <WorkoutSkeleton />
      ) : !plan ? (
        <motion.div
          className="wk__empty"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Dumbbell size={36} className="wk__empty-icon" />
          {isToday ? (
            <>
              <h3>No Workout Plan</h3>
              <p>{isOnboarded ? 'Generating your personalized workout...' : 'Complete onboarding to get your AI-powered workout plan.'}</p>
            </>
          ) : isPastDay ? (
            <>
              <h3>No Workout Logged</h3>
              <p>You didn't have a workout planned for this day.</p>
            </>
          ) : (
            <>
              <h3>Tomorrow's Plan</h3>
              <p>Your workout plan will be generated when the day arrives.</p>
            </>
          )}
        </motion.div>
      ) : plan.is_rest_day ? (
        <motion.div
          className="wk__rest"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="wk__rest-icon-wrap">
            <Moon size={32} />
          </div>
          <h3>Rest Day 🌙</h3>
          <p>{plan.rest_reason || 'Your body needs time to recover and grow stronger.'}</p>
          <div className="wk__rest-tip">
            <Sparkles size={14} />
            <span>Rest days are where gains happen. Stay hydrated and sleep well!</span>
          </div>
          {isToday && (
            <button className="wk__rest-override" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? <Loader2 size={14} className="wk__spin" /> : <RefreshCw size={14} />}
              <span>Generate workout instead</span>
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="wk__plan"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Plan Header */}
          <div className="wk__plan-header">
            <div className="wk__plan-top">
              <div>
                <span className={`wk__diff-badge wk__diff-badge--${plan.difficulty}`}>
                  {plan.difficulty}
                </span>
                <h2 className="wk__plan-title">
                  {isToday ? "Today's Workout" : isTomorrow ? "Tomorrow's Preview" : 'Workout Plan'}
                </h2>
                <p className="wk__plan-date">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </p>
              </div>
              <div className="wk__plan-stats">
                <div className="wk__plan-stat">
                  <Clock size={14} />
                  <span>{plan.estimated_duration_min} min</span>
                </div>
                <div className="wk__plan-stat">
                  <Flame size={14} />
                  <span>~{plan.estimated_calories_burn} kcal</span>
                </div>
                <div className="wk__plan-stat">
                  <Dumbbell size={14} />
                  <span>{(plan.workout || []).length} exercises</span>
                </div>
              </div>
            </div>

            {/* Progress Bar (today only, not rest day) */}
            {isToday && !isCompleted && totalExercises > 0 && (
              <div className="wk__progress">
                <div className="wk__progress-bar">
                  <motion.div
                    className="wk__progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <span className="wk__progress-text">{doneCount}/{totalExercises} completed</span>
              </div>
            )}

            {/* Completed Banner */}
            {isCompleted && (
              <motion.div
                className="wk__completed-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CheckCircle2 size={18} />
                <span>Workout completed! {plan.feedback === 'perfect' ? '🎯' : plan.feedback === 'too_easy' ? '😎' : '💪'}</span>
              </motion.div>
            )}

            {/* Missed Banner (past day, not completed) */}
            {isPastDay && !isCompleted && (
              <div className="wk__missed-banner">
                <span>Missed</span>
              </div>
            )}
          </div>

          {/* Coach Tip */}
          {plan.coach_tip && (
            <motion.div
              className="wk__tip"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Zap size={14} />
              <p>{plan.coach_tip}</p>
            </motion.div>
          )}

          {/* Exercise Sections */}
          <ExerciseSection
            title="Warm Up"
            icon="🔥"
            exercises={plan.warm_up}
            completedExercises={completedExercises}
            onToggle={handleToggleExercise}
            isToday={isToday && !isCompleted}
            disabled={completing}
            sectionKey="warmup"
          />
          <ExerciseSection
            title="Main Workout"
            icon="💪"
            exercises={plan.workout}
            completedExercises={completedExercises}
            onToggle={handleToggleExercise}
            isToday={isToday && !isCompleted}
            disabled={completing}
            sectionKey="main"
          />
          <ExerciseSection
            title="Cool Down"
            icon="🧘"
            exercises={plan.cool_down}
            completedExercises={completedExercises}
            onToggle={handleToggleExercise}
            isToday={isToday && !isCompleted}
            disabled={completing}
            sectionKey="cooldown"
          />

          {/* Regenerate button (today only) */}
          {isToday && !isCompleted && (
            <button className="wk__regen" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? <Loader2 size={14} className="wk__spin" /> : <RefreshCw size={14} />}
              <span>Regenerate Workout</span>
            </button>
          )}
        </motion.div>
      )}

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && <CompletionCelebration />}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            className="wk__feedback-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="wk__feedback"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3>How was your workout?</h3>
              <p>Your feedback helps us tailor tomorrow's plan</p>
              <div className="wk__feedback-options">
                {FEEDBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`wk__feedback-btn ${selectedFeedback === opt.value ? `wk__feedback-btn--selected wk__feedback-btn--${opt.color}` : ''}`}
                    onClick={() => setSelectedFeedback(opt.value)}
                  >
                    <span className="wk__feedback-emoji">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="wk__feedback-actions">
                <button
                  className="wk__feedback-cancel"
                  onClick={() => { setShowFeedback(false); setShowCelebration(false); }}
                >
                  Skip
                </button>
                <button
                  className="wk__feedback-submit"
                  disabled={!selectedFeedback || completing}
                  onClick={handleComplete}
                >
                  {completing ? <Loader2 size={16} className="wk__spin" /> : <CheckCircle2 size={16} />}
                  <span>Complete Workout</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
