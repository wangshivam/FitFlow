import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Flame, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './MicroOnboardingModal.css';

const GOALS = [
  { value: 'weight_loss', label: 'Lose Weight', emoji: '🔥', desc: '-500 kcal/day deficit' },
  { value: 'muscle_gain', label: 'Build Muscle', emoji: '💪', desc: '+300 kcal/day surplus' },
  { value: 'general',     label: 'Stay Healthy', emoji: '✨', desc: 'Maintenance calories' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Mostly sitting', sub: 'Desk job, no exercise' },
  { value: 'light',     label: 'A little active', sub: 'Light walks, 1–2x/week' },
  { value: 'moderate',  label: 'Moderately active', sub: 'Exercise 3–5x/week' },
  { value: 'active',    label: 'Very active', sub: 'Daily intense exercise' },
];

/**
 * Compact 3-step modal for users who skipped full onboarding.
 * Collects: gender + weight + height → goal → activity level
 * Calls profileAPI.onboarding() then refreshes user context.
 */
export default function MicroOnboardingModal({ isOpen, onClose }) {
  const { completeOnboarding, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [calculatedPlan, setCalculatedPlan] = useState(null);

  const [form, setForm] = useState({
    gender: '',
    age: '25',
    weight_kg: '',
    height_cm: '',
    goal: '',
    activity_level: '',
    health_conditions: [],
    diet_type: 'veg',
    workout_preference: 'home',
    equipment: 'none',
    target_weight_kg: '',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const stepValid = [
    form.gender && form.age && form.weight_kg && form.height_cm,
    !!form.goal,
    !!form.activity_level,
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await completeOnboarding({
        ...form,
        age: parseInt(form.age) || 25,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        target_weight_kg: parseFloat(form.weight_kg) * (form.goal === 'weight_loss' ? 0.9 : form.goal === 'muscle_gain' ? 1.05 : 1),
        health_conditions: [],
      });
      // result = { profile, user, targets } from profileAPI.onboarding
      setCalculatedPlan(result?.targets || result?.profile || null);
      await refreshUser();
      setDone(true);
    } catch {
      // ignore — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setDone(false);
    setCalculatedPlan(null);
    onClose();
  };

  const STEPS = ['Your Stats', 'Your Goal', 'Activity Level'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mico__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="mico__panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mico__header">
              <div className="mico__header-left">
                <div className="mico__icon"><Flame size={18} /></div>
                <div>
                  <h3 className="mico__title">
                    {done ? 'Your FitFlow Plan' : 'Personalise Your Plan'}
                  </h3>
                  {!done && (
                    <p className="mico__subtitle">Takes 30 seconds · 3 quick questions</p>
                  )}
                </div>
              </div>
              <button className="mico__close" onClick={handleClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Step progress */}
            {!done && (
              <div className="mico__progress">
                {STEPS.map((s, i) => (
                  <div
                    key={i}
                    className={`mico__progress-step ${i === step ? 'mico__progress-step--active' : ''} ${i < step ? 'mico__progress-step--done' : ''}`}
                  >
                    <div className="mico__progress-dot">
                      {i < step ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="mico__body">
              <AnimatePresence mode="wait">

                {/* ── Done State ─────────────────────────────── */}
                {done && (
                  <motion.div
                    key="done"
                    className="mico__done"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mico__done-icon">🎯</div>
                    <p className="mico__done-label">Your daily targets</p>
                    <div className="mico__plan-grid">
                      <div className="mico__plan-item mico__plan-item--calories">
                        <span className="mico__plan-value">{calculatedPlan?.daily_calorie_target ?? '—'}</span>
                        <span className="mico__plan-unit">kcal</span>
                      </div>
                      <div className="mico__plan-item">
                        <span className="mico__plan-value">{calculatedPlan?.daily_protein_target ?? '—'}<span className="mico__plan-unit-sm">g</span></span>
                        <span className="mico__plan-label-sm">Protein</span>
                      </div>
                      <div className="mico__plan-item">
                        <span className="mico__plan-value">{calculatedPlan?.daily_carb_target ?? '—'}<span className="mico__plan-unit-sm">g</span></span>
                        <span className="mico__plan-label-sm">Carbs</span>
                      </div>
                      <div className="mico__plan-item">
                        <span className="mico__plan-value">{calculatedPlan?.daily_fat_target ?? '—'}<span className="mico__plan-unit-sm">g</span></span>
                        <span className="mico__plan-label-sm">Fat</span>
                      </div>
                    </div>
                    <p className="mico__done-note">Calculated using Mifflin-St Jeor formula</p>
                    <button className="mico__btn mico__btn--primary mico__btn--full" onClick={handleClose}>
                      Start Tracking 🚀
                    </button>
                  </motion.div>
                )}

                {/* ── Step 0: Stats ─────────────────────────── */}
                {!done && step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="mico__step"
                  >
                    <div className="mico__field-group">
                      <label className="mico__label">I am a</label>
                      <div className="mico__options">
                        {[{ v: 'male', l: '👨 Male' }, { v: 'female', l: '👩 Female' }, { v: 'other', l: '🧑 Other' }].map(g => (
                          <button
                            key={g.v}
                            className={`mico__option ${form.gender === g.v ? 'mico__option--sel' : ''}`}
                            onClick={() => update('gender', g.v)}
                          >{g.l}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mico__row">
                      <div className="mico__field">
                        <label className="mico__label">Age</label>
                        <div className="mico__input-wrap">
                          <input
                            className="mico__input"
                            type="number"
                            value={form.age}
                            onChange={e => update('age', e.target.value)}
                            min={14} max={80}
                            placeholder="25"
                          />
                          <span className="mico__input-suffix">yrs</span>
                        </div>
                      </div>
                      <div className="mico__field">
                        <label className="mico__label">Weight</label>
                        <div className="mico__input-wrap">
                          <input
                            className="mico__input"
                            type="number"
                            value={form.weight_kg}
                            onChange={e => update('weight_kg', e.target.value)}
                            min={30} max={200}
                            placeholder="70"
                          />
                          <span className="mico__input-suffix">kg</span>
                        </div>
                      </div>
                      <div className="mico__field">
                        <label className="mico__label">Height</label>
                        <div className="mico__input-wrap">
                          <input
                            className="mico__input"
                            type="number"
                            value={form.height_cm}
                            onChange={e => update('height_cm', e.target.value)}
                            min={100} max={250}
                            placeholder="170"
                          />
                          <span className="mico__input-suffix">cm</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 1: Goal ──────────────────────────── */}
                {!done && step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="mico__step"
                  >
                    <label className="mico__label">What's your primary goal?</label>
                    <div className="mico__goal-list">
                      {GOALS.map(g => (
                        <button
                          key={g.value}
                          className={`mico__goal-card ${form.goal === g.value ? 'mico__goal-card--sel' : ''}`}
                          onClick={() => update('goal', g.value)}
                        >
                          <span className="mico__goal-emoji">{g.emoji}</span>
                          <div className="mico__goal-info">
                            <span className="mico__goal-label">{g.label}</span>
                            <span className="mico__goal-desc">{g.desc}</span>
                          </div>
                          {form.goal === g.value && <CheckCircle2 size={18} className="mico__goal-check" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Activity ──────────────────────── */}
                {!done && step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="mico__step"
                  >
                    <label className="mico__label">How active are you?</label>
                    <div className="mico__activity-list">
                      {ACTIVITY_LEVELS.map(a => (
                        <button
                          key={a.value}
                          className={`mico__activity-card ${form.activity_level === a.value ? 'mico__activity-card--sel' : ''}`}
                          onClick={() => update('activity_level', a.value)}
                        >
                          <div className="mico__activity-info">
                            <span className="mico__activity-label">{a.label}</span>
                            <span className="mico__activity-sub">{a.sub}</span>
                          </div>
                          {form.activity_level === a.value && <CheckCircle2 size={16} className="mico__activity-check" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            {!done && (
              <div className="mico__footer">
                {step > 0 && (
                  <button className="mico__btn mico__btn--ghost" onClick={() => setStep(s => s - 1)}>
                    Back
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {step < 2 ? (
                  <button
                    className="mico__btn mico__btn--primary"
                    disabled={!stepValid[step]}
                    onClick={() => setStep(s => s + 1)}
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    className="mico__btn mico__btn--primary"
                    disabled={!stepValid[2] || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Calculating…' : 'Get My Plan →'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
