import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { foodAPI } from '../api';
import {
  Send, Camera, Trash2, Loader2,
  CheckCircle2, AlertCircle, Search,
  ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { FoodSearchModal } from '../components/shared';
import './DietPage.css';

// ── Helpers ──

function EditableText({ value, onChange, type = 'text', className = '', ...props }) {
  return (
    <div className={`diet-v2__editable-wrap ${className}`}>
      <span className="diet-v2__editable-measure">{value || ' '}</span>
      <input
        type={type}
        className="diet-v2__editable-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}

function getWeekDates(selectedDate) {
  const sel = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = sel.getDay(); // 0=Sun
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

function isoDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getMealLabel(slot) {
  const labels = {
    breakfast: 'Breakfast',
    morning_chai: 'Morning Chai',
    lunch: 'Lunch',
    evening_snack: 'Snack',
    dinner: 'Dinner',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
  };
  return labels[slot] || 'Meal';
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];



/**
 * Build a 6-row × 7-col grid of Date objects for a given month.
 * Pads with days from the previous/next month to fill the grid.
 */
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0=Sun
  const rows = [];
  // Start from the Sunday before (or on) the 1st
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Week Scroller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function WeekScroller({ selectedDate, onSelectDate }) {
  const todayStr = isoDate(new Date());
  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="diet-v2__week-scroller">
      {weekDates.map((d) => {
        const iso = isoDate(d);
        const isSelected = iso === selectedDate;
        const isToday = iso === todayStr;

        return (
          <button
            key={iso}
            className={[
              'diet-v2__week-day',
              isSelected && 'diet-v2__week-day--selected',
              isToday && 'diet-v2__week-day--today',
            ].filter(Boolean).join(' ')}
            onClick={() => onSelectDate(iso)}
            type="button"
          >
            <span className="diet-v2__week-day-name">{SHORT_DAYS[d.getDay()]}</span>
            <span className="diet-v2__week-day-num">{d.getDate()}</span>
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
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    const now = new Date();
    // Don't go past current month
    if (viewYear === now.getFullYear() && viewMonth >= now.getMonth()) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (d) => {
    if (d > new Date()) return; // no future
    onSelectDate(isoDate(d));
    onClose();
  };

  const now = new Date();
  const isNextDisabled = viewYear === now.getFullYear() && viewMonth >= now.getMonth();

  return (
    <motion.div
      className="diet-v2__calendar"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Month nav */}
      <div className="diet-v2__cal-nav">
        <button className="diet-v2__cal-nav-btn" onClick={goPrevMonth} type="button" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <span className="diet-v2__cal-month">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          className="diet-v2__cal-nav-btn"
          onClick={goNextMonth}
          type="button"
          disabled={isNextDisabled}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="diet-v2__cal-grid">
        {CAL_DAYS.map((d) => (
          <span key={d} className="diet-v2__cal-head">{d}</span>
        ))}

        {/* Day cells */}
        {grid.flat().map((d, i) => {
          const iso = isoDate(d);
          const isCurrentMonth = d.getMonth() === viewMonth;
          const isSelected = iso === selectedDate;
          const isToday = iso === todayStr;
          const isFuture = d > now;

          return (
            <button
              key={i}
              className={[
                'diet-v2__cal-day',
                !isCurrentMonth && 'diet-v2__cal-day--outside',
                isSelected && 'diet-v2__cal-day--selected',
                isToday && !isSelected && 'diet-v2__cal-day--today',
                isFuture && 'diet-v2__cal-day--disabled',
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
// Month Header (tap to expand calendar)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MonthHeader({ selectedDate, isOpen, onToggle }) {
  const sel = new Date(selectedDate + 'T00:00:00');
  const todayStr = isoDate(new Date());
  const isToday = selectedDate === todayStr;

  const label = isToday
    ? 'Today'
    : sel.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <button className="diet-v2__month-header" onClick={onToggle} type="button">
      <span className="diet-v2__month-label">{label}</span>
      <ChevronDown
        size={18}
        className={`diet-v2__month-chevron ${isOpen ? 'diet-v2__month-chevron--open' : ''}`}
      />
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Calories Card
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CalorieCard({ consumed, burned, target }) {
  const remaining = Math.max(0, target - consumed + burned);

  return (
    <div className="diet-v2__cal-card">
      <div className="diet-v2__cal-header">
        <span className="diet-v2__cal-icon">🔥</span>
        <span className="diet-v2__cal-title">Calories</span>
      </div>
      <div className="diet-v2__cal-stats">
        <div className="diet-v2__cal-stat">
          <span className="diet-v2__cal-stat-value">{Math.round(consumed)}</span>
          <span className="diet-v2__cal-stat-label">Food</span>
        </div>
        <div className="diet-v2__cal-stat">
          <span className="diet-v2__cal-stat-value">{Math.round(burned)}</span>
          <span className="diet-v2__cal-stat-label">Exercise</span>
        </div>
        <div className="diet-v2__cal-stat">
          <span className="diet-v2__cal-stat-value diet-v2__cal-stat-value--remaining">
            {remaining.toLocaleString()}
          </span>
          <span className="diet-v2__cal-stat-label">Remaining</span>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Macro Ring SVG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MacroRing({ value, max, variant, label }) {
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="diet-v2__macro-item">
      <div className="diet-v2__macro-ring-wrap">
        <svg className="diet-v2__macro-ring-svg" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} className="diet-v2__macro-ring-bg" />
          <circle
            cx="22" cy="22" r={r}
            className={`diet-v2__macro-ring-fill diet-v2__macro-ring-fill--${variant}`}
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <span className="diet-v2__macro-ring-text">{Math.round(value)}</span>
      </div>
      <span className="diet-v2__macro-values">{Math.round(value)}/{max}</span>
      <span className="diet-v2__macro-label">{label}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Macros Card
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MacroCard({ consumed, targets }) {
  return (
    <div className="diet-v2__macro-card">
      <div className="diet-v2__macro-header">
        <span className="diet-v2__macro-icon">🍽️</span>
        <span className="diet-v2__macro-title">Macros</span>
      </div>
      <div className="diet-v2__macro-rings">
        <MacroRing value={consumed.carbs} max={targets.carbs} variant="carbs" label="Carbs (g)" />
        <MacroRing value={consumed.protein} max={targets.protein} variant="protein" label="Protein (g)" />
        <MacroRing value={consumed.fat} max={targets.fat} variant="fat" label="Fat (g)" />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Empty State
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EmptyState() {
  return (
    <motion.div
      className="diet-v2__empty"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className="diet-v2__empty-wave">👋</span>
      <h3 className="diet-v2__empty-title">Chat with me right away!</h3>
      <p className="diet-v2__empty-subtitle">
        Tell me what you ate or exercised (or snap a photo) and I'll calculate the nutritional content or calories burned.
      </p>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Timeline Feed Item
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FeedItem({ log, onDelete, onEdit, isDeleting }) {
  return (
    <motion.div
      className="diet-v2__feed-item"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, padding: 0 }}
      transition={{ duration: 0.25 }}
    >
      <span className="diet-v2__feed-time">{formatTime(log.created_at)}</span>
      <div className="diet-v2__feed-body">
        <span className="diet-v2__feed-badge">{getMealLabel(log.meal_slot)}</span>
        <div className="diet-v2__feed-name">{log.raw_input}</div>
        <div className="diet-v2__feed-macros">
          <span className="diet-v2__feed-cal">{Math.round(log.total_calories)} kcal</span>
          <span>P {Math.round(log.total_protein)}g</span>
          <span>C {Math.round(log.total_carbs)}g</span>
          <span>F {Math.round(log.total_fat)}g</span>
        </div>
      </div>
      <div className="diet-v2__feed-actions">
        <button
          className="diet-v2__feed-action-btn diet-v2__feed-action-btn--edit"
          onClick={() => onEdit(log)}
          disabled={isDeleting}
          aria-label="Edit log"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button
          className="diet-v2__feed-action-btn diet-v2__feed-action-btn--delete"
          onClick={() => onDelete(log.id)}
          disabled={isDeleting}
          aria-label="Delete log"
          type="button"
        >
          {isDeleting ? (
            <Loader2 size={14} className="diet-v2__feed-spinning" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </motion.div>
  );
}



// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inline Confirmation Panel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConfirmPanel({ parsed, setParsed, mealSlot, setMealSlot, step, onSave, onCancel, error }) {
  // Live Nutrition Recalculation
  useEffect(() => {
    if (!parsed || step !== 'confirm') return;

    const timer = setTimeout(async () => {
      let changed = false;
      const newItems = await Promise.all(
        parsed.items.map(async (item) => {
          if (!item.food_name || !item.quantity) return item;
          
          try {
            const { data } = await foodAPI.calculate({
              name: item.food_name,
              quantity: parseFloat(item.quantity) || 1,
              unit: item.unit
            });
            
            const res = data.result;
            const suggestion = (res.food_name.toLowerCase() !== item.food_name.toLowerCase()) 
              ? res.food_name 
              : null;
            
            if (
              res.calories !== item.calories ||
              res.protein !== item.protein ||
              res.carbs !== item.carbs ||
              res.fat !== item.fat ||
              suggestion !== item.suggestion
            ) {
              changed = true;
              return { 
                ...item, 
                calories: res.calories,
                protein: res.protein,
                carbs: res.carbs,
                fat: res.fat,
                suggestion 
              };
            }
            return item;
          } catch (e) {
            return item;
          }
        })
      );

      if (changed) {
        setParsed({ ...parsed, items: newItems });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [parsed, step, setParsed]);

  if (!parsed && step !== 'parsing') return null;

  const totalCals = parsed?.items?.reduce((s, i) => s + i.calories, 0) || 0;

  return (
    <div className="diet-v2__confirm-wrap">
      <motion.div
        className="diet-v2__confirm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        {step === 'parsing' && (
          <div className="diet-v2__parsing">
            <Loader2 size={28} className="diet-v2__parsing-spinner" />
            <span className="diet-v2__parsing-text">Analysing your food…</span>
            <span className="diet-v2__parsing-sub">AI is calculating nutrition</span>
          </div>
        )}

        {step === 'confirm' && parsed && (
          <>
            <div className="diet-v2__confirm-header">
              <div className="diet-v2__confirm-title">
                <CheckCircle2 size={16} />
                <span>Confirm &amp; Log</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  className="diet-v2__edit-select"
                  value={mealSlot} 
                  onChange={(e) => setMealSlot(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="morning_chai">Morning Chai</option>
                  <option value="lunch">Lunch</option>
                  <option value="evening_snack">Snack</option>
                  <option value="dinner">Dinner</option>
                  <option value="pre_workout">Pre-Workout</option>
                  <option value="post_workout">Post-Workout</option>
                </select>
                <span className="diet-v2__confirm-cals">{Math.round(totalCals)} kcal</span>
              </div>
            </div>
            <div className="diet-v2__confirm-items">
              {parsed.items.map((item, i) => (
                <div key={i} className="diet-v2__confirm-item-container">
                  <div className="diet-v2__confirm-item">
                    <div className="diet-v2__confirm-item-name">
                      <EditableText
                        value={item.food_name}
                        onChange={(val) => {
                          const newItems = [...parsed.items];
                          newItems[i].food_name = val;
                          setParsed({ ...parsed, items: newItems });
                        }}
                      />
                      {item.food_name_hi && <span> · {item.food_name_hi}</span>}
                      <span> (</span>
                      <EditableText
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="diet-v2__editable-qty"
                        value={item.quantity}
                        onChange={(val) => {
                          const newItems = [...parsed.items];
                          newItems[i].quantity = val;
                          setParsed({ ...parsed, items: newItems });
                        }}
                      />
                      <select
                        className="diet-v2__editable-select"
                        value={item.unit}
                        onChange={(e) => {
                          const newItems = [...parsed.items];
                          newItems[i].unit = e.target.value;
                          setParsed({ ...parsed, items: newItems });
                        }}
                      >
                        <option value="piece">piece</option>
                        <option value="serving">serving</option>
                        <option value="gram">grams</option>
                        <option value="ml">ml</option>
                        <option value="cup">cup</option>
                        <option value="plate">plate</option>
                        <option value="bowl">bowl</option>
                        <option value="katori">katori</option>
                        <option value="tablespoon">tablespoon</option>
                      </select>
                      <span>)</span>
                    </div>
                    <div className="diet-v2__confirm-item-macros">
                      <span className="diet-v2__confirm-item-cal">{item.calories} kcal</span>
                      <span>P{item.protein}g</span>
                      <span>C{item.carbs}g</span>
                      <span>F{item.fat}g</span>
                    </div>
                  </div>
                  {item.suggestion && (
                    <div className="diet-v2__confirm-suggestion" onClick={() => {
                      const newItems = [...parsed.items];
                      newItems[i].food_name = item.suggestion;
                      newItems[i].suggestion = null;
                      setParsed({ ...parsed, items: newItems });
                    }}>
                      Did you mean <strong>{item.suggestion}</strong>?
                    </div>
                  )}
                </div>
              ))}
            </div>
            {error && (
              <div className="diet-v2__error">
                <AlertCircle size={14} />
                {error}
                {error.includes('limit') && (
                  <a href="/premium">Upgrade →</a>
                )}
              </div>
            )}
            <div className="diet-v2__confirm-actions">
              <button className="diet-v2__confirm-btn diet-v2__confirm-btn--cancel" onClick={onCancel} type="button">
                Cancel
              </button>
              <button className="diet-v2__confirm-btn diet-v2__confirm-btn--save" onClick={onSave} type="button">
                Save Log
              </button>
            </div>
          </>
        )}

        {step === 'saving' && (
          <div className="diet-v2__parsing">
            <Loader2 size={28} className="diet-v2__parsing-spinner" />
            <span className="diet-v2__parsing-text">Saving your meal…</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bottom Input Bar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BottomInputBar({ value, onChange, onSubmit, disabled, onOpenSearch }) {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="diet-v2__input-wrap">
      <div className="diet-v2__input-inner">
        <input
          ref={inputRef}
          className="diet-v2__input"
          type="text"
          placeholder="What did you eat or exercise?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          id="diet-input"
        />
        <button className="diet-v2__input-btn" title="Manual search" onClick={onOpenSearch} type="button" aria-label="Manual search">
          <Search size={20} />
        </button>
        <button className="diet-v2__input-btn" title="Take photo" type="button" aria-label="Take photo">
          <Camera size={20} />
        </button>
        <button
          className="diet-v2__input-btn diet-v2__input-btn--send"
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          title="Send"
          type="button"
          aria-label="Send"
        >
          {disabled ? <Loader2 size={18} className="diet-v2__feed-spinning" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN DIET PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function DietPage() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);

  // Input bar state
  const [inputText, setInputText] = useState('');
  const [step, setStep] = useState('idle'); // idle | parsing | confirm | saving
  const [parsed, setParsed] = useState(null);
  const [mealSlot, setMealSlot] = useState('lunch');
  const [error, setError] = useState(null);
  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Fetch data for selected date
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, logRes] = await Promise.all([
        foodAPI.getSummary(selectedDate),
        foodAPI.getLogs(selectedDate),
      ]);
      setSummary(sumRes.data);
      setLogs(logRes.data.logs || []);
    } catch {
      setSummary(null);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Targets
  const targets = {
    calories: summary?.targets?.calories || profile?.daily_calorie_target || 2000,
    protein: summary?.targets?.protein || profile?.daily_protein_target || 125,
    carbs: summary?.targets?.carbs || profile?.daily_carb_target || 250,
    fat: summary?.targets?.fat || profile?.daily_fat_target || 56,
  };
  const consumed = summary?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // ── Parse food ──
  const handleSubmit = async () => {
    if (!inputText.trim() || step !== 'idle') return;
    setStep('parsing');
    setError(null);
    setParsed(null);

    try {
      const { data } = await foodAPI.parse({ raw_input: inputText, meal_slot: mealSlot });
      setParsed(data);
      setMealSlot(data.meal_suggestion || mealSlot);
      setStep('confirm');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse food. Try again.');
      setStep('idle');
    }
  };

  // ── Save log ──
  const handleSave = async () => {
    if (!parsed) return;
    setStep('saving');
    
    try {
      // Items are already recalculated live by the useEffect in ConfirmPanel!
      // We can just save them directly without another API call.
      
      if (editingLogId) {
        await foodAPI.updateLog(editingLogId, {
          meal_slot: mealSlot,
          raw_input: inputText,
          items: parsed.items,
        });
      } else {
        await foodAPI.log({
          meal_slot: mealSlot,
          raw_input: inputText,
          items: parsed.items,
        });
      }
      
      // Reset
      setInputText('');
      setParsed(null);
      setStep('idle');
      setError(null);
      setEditingLogId(null);
      // Refresh
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
      setStep('confirm');
    }
  };

  // ── Cancel confirm ──
  const handleCancel = () => {
    setStep('idle');
    setParsed(null);
    setError(null);
    setEditingLogId(null);
    if (editingLogId) {
      setInputText('');
    }
  };

  // ── Delete log ──
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await foodAPI.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      const sumRes = await foodAPI.getSummary(selectedDate);
      setSummary(sumRes.data);
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };



  // ── Edit log ──
  const handleEdit = (log) => {
    setEditingLogId(log.id);
    setInputText(log.raw_input || '');
    setMealSlot(log.meal_slot);
    setParsed({ items: log.items || [], meal_suggestion: log.meal_slot });
    setStep('confirm');
  };

  const showConfirm = step === 'parsing' || step === 'confirm' || step === 'saving';

  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateFromCalendar = (iso) => {
    setSelectedDate(iso);
  };

  return (
    <div className="diet-v2">
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
            onSelectDate={handleDateFromCalendar}
            onClose={() => setCalendarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Week Scroller */}
      <WeekScroller selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Summary Cards */}
      {loading ? (
        <div className="diet-v2__summary-skeleton">
          <div className="diet-v2__skeleton-card" />
          <div className="diet-v2__skeleton-card" />
        </div>
      ) : (
        <div className="diet-v2__summary">
          <CalorieCard
            consumed={consumed.calories}
            burned={0}
            target={targets.calories}
          />
          <MacroCard consumed={consumed} targets={targets} />
        </div>
      )}

      {/* Timeline Feed or Empty State */}
      {!loading && logs.length === 0 && <EmptyState />}

      {!loading && logs.length > 0 && (
        <div className="diet-v2__feed">
          <span className="diet-v2__feed-title">{selectedDate === isoDate(new Date()) ? "Today's Log" : 'Food Log'}</span>
          <AnimatePresence mode="popLayout">
            {logs.map((log) => (
              <FeedItem
                key={log.id}
                log={log}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isDeleting={deletingId === log.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}



      {/* Inline Confirmation Panel */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmPanel
            parsed={parsed}
            setParsed={setParsed}
            mealSlot={mealSlot}
            setMealSlot={setMealSlot}
            step={step}
            onSave={handleSave}
            onCancel={handleCancel}
            error={error}
          />
        )}
      </AnimatePresence>

      {/* Bottom Input Bar */}
      <BottomInputBar
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        disabled={step !== 'idle'}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Manual Search Modal */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <FoodSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            onLogSuccess={fetchData}
            defaultMealSlot={mealSlot}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
