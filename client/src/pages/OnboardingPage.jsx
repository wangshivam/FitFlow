import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Ruler, Target, Dumbbell, Heart,
  ArrowRight, ArrowLeft, Check, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/shared';
import './OnboardingPage.css';

const STEPS = [
  { id: 'basics', title: 'Tell us about yourself', subtitle: 'Let\'s get to know you', icon: User },
  { id: 'body', title: 'Your body metrics', subtitle: 'We\'ll calculate your daily targets', icon: Ruler },
  { id: 'goal', title: 'What\'s your goal?', subtitle: 'Pick what matters most to you', icon: Target },
  { id: 'preferences', title: 'Your preferences', subtitle: 'Help us personalize your workouts', icon: Dumbbell },
  { id: 'health', title: 'Health information', subtitle: 'So we can keep you safe', icon: Heart },
];

const GOALS = [
  { value: 'weight_loss', label: 'Lose Weight', emoji: '🔥', desc: 'Shed extra kilos healthily' },
  { value: 'muscle_gain', label: 'Build Muscle', emoji: '💪', desc: 'Gain strength and mass' },
  { value: 'stamina', label: 'Build Stamina', emoji: '🏃', desc: 'Improve endurance' },
  { value: 'flexibility', label: 'Flexibility', emoji: '🧘', desc: 'Better mobility and balance' },
  { value: 'general', label: 'General Fitness', emoji: '✨', desc: 'Overall health improvement' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary — Desk job, minimal exercise' },
  { value: 'light', label: 'Light — Light walks, 1-2 days/week' },
  { value: 'moderate', label: 'Moderate — Exercise 3-5 days/week' },
  { value: 'active', label: 'Active — Daily exercise, active job' },
  { value: 'very_active', label: 'Very Active — Intense daily training' },
];

const HEALTH_CONDITIONS = [
  { value: 'pcod', label: 'PCOD/PCOS' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'thyroid', label: 'Thyroid' },
  { value: 'heart', label: 'Heart Condition' },
  { value: 'bp', label: 'Blood Pressure' },
  { value: 'asthma', label: 'Asthma' },
  { value: 'none', label: 'None of the above' },
];

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    target_weight_kg: '',
    goal: '',
    activity_level: '',
    workout_preference: '',
    equipment: '',
    diet_type: '',
    health_conditions: [],
    city: '',
  });

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleHealthCondition = (value) => {
    setForm((prev) => {
      if (value === 'none') return { ...prev, health_conditions: ['none'] };
      const conditions = prev.health_conditions.filter((c) => c !== 'none');
      return {
        ...prev,
        health_conditions: conditions.includes(value)
          ? conditions.filter((c) => c !== value)
          : [...conditions, value],
      };
    });
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        ...form,
        age: parseInt(form.age),
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        target_weight_kg: parseFloat(form.target_weight_kg),
        health_conditions: form.health_conditions.filter((c) => c !== 'none'),
      });
      navigate('/');
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return form.age && form.gender;
      case 1: return form.height_cm && form.weight_kg && form.target_weight_kg;
      case 2: return form.goal && form.activity_level;
      case 3: return form.workout_preference && form.equipment && form.diet_type;
      case 4: return form.health_conditions.length > 0;
      default: return true;
    }
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="onboarding">
      <div className="onboarding__sidebar">
        <div className="onboarding__brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="ob-flame" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FB923C" />
                <stop offset="1" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            <path d="M16 4C16 4 10 12 10 18C10 21.3 12.7 24 16 24C19.3 24 22 21.3 22 18C22 12 16 4 16 4Z" fill="url(#ob-flame)" />
            <path d="M16 12C16 12 13 16 13 19C13 20.7 14.3 22 16 22C17.7 22 19 20.7 19 19C19 16 16 12 16 12Z" fill="white" opacity="0.6" />
          </svg>
          <span>Fit Flow</span>
        </div>

        <div className="onboarding__steps">
          {STEPS.map(({ id, title, icon: Icon }, i) => (
            <div
              key={id}
              className={`onboarding-step ${i === step ? 'onboarding-step--active' : ''} ${i < step ? 'onboarding-step--done' : ''}`}
            >
              <div className="onboarding-step__indicator">
                {i < step ? <Check size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className="onboarding-step__label">{title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding__main">
        <div className="onboarding__progress">
          <div className="onboarding__progress-bar" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className="onboarding__content">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="onboarding__form"
            >
              <div className="onboarding__form-header">
                <h2>{STEPS[step].title}</h2>
                <p>{STEPS[step].subtitle}</p>
              </div>

              {/* Step 1: Basics */}
              {step === 0 && (
                <div className="onboarding__fields">
                  <Input
                    label="Age"
                    type="number"
                    placeholder="e.g., 25"
                    value={form.age}
                    onChange={(e) => updateForm('age', e.target.value)}
                    min={14}
                    max={80}
                    suffix="years"
                  />
                  <div className="onboarding__field-group">
                    <label className="input-label">Gender</label>
                    <div className="onboarding__options">
                      {['male', 'female', 'other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`onboarding__option ${form.gender === g ? 'onboarding__option--selected' : ''}`}
                          onClick={() => updateForm('gender', g)}
                        >
                          {g === 'male' ? '👨' : g === 'female' ? '👩' : '🧑'}{' '}
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Body */}
              {step === 1 && (
                <div className="onboarding__fields">
                  <Input
                    label="Height"
                    type="number"
                    placeholder="e.g., 170"
                    value={form.height_cm}
                    onChange={(e) => updateForm('height_cm', e.target.value)}
                    min={100}
                    max={250}
                    suffix="cm"
                  />
                  <Input
                    label="Current Weight"
                    type="number"
                    placeholder="e.g., 72"
                    value={form.weight_kg}
                    onChange={(e) => updateForm('weight_kg', e.target.value)}
                    min={30}
                    max={200}
                    suffix="kg"
                  />
                  <Input
                    label="Target Weight"
                    type="number"
                    placeholder="e.g., 65"
                    value={form.target_weight_kg}
                    onChange={(e) => updateForm('target_weight_kg', e.target.value)}
                    min={30}
                    max={200}
                    suffix="kg"
                  />
                </div>
              )}

              {/* Step 3: Goal */}
              {step === 2 && (
                <div className="onboarding__fields">
                  <div className="onboarding__field-group">
                    <label className="input-label">Your primary goal</label>
                    <div className="onboarding__goal-grid">
                      {GOALS.map(({ value, label, emoji, desc }) => (
                        <button
                          key={value}
                          type="button"
                          className={`onboarding__goal-card ${form.goal === value ? 'onboarding__goal-card--selected' : ''}`}
                          onClick={() => updateForm('goal', value)}
                        >
                          <span className="onboarding__goal-emoji">{emoji}</span>
                          <span className="onboarding__goal-label">{label}</span>
                          <span className="onboarding__goal-desc">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Select
                    label="Activity Level"
                    value={form.activity_level}
                    onChange={(e) => updateForm('activity_level', e.target.value)}
                    placeholder="Select your activity level"
                    options={ACTIVITY_LEVELS}
                  />
                </div>
              )}

              {/* Step 4: Preferences */}
              {step === 3 && (
                <div className="onboarding__fields">
                  <div className="onboarding__field-group">
                    <label className="input-label">Where do you work out?</label>
                    <div className="onboarding__options">
                      {[
                        { value: 'home', label: '🏠 Home', },
                        { value: 'gym', label: '🏋️ Gym' },
                        { value: 'outdoor', label: '🌳 Outdoor' },
                        { value: 'mixed', label: '🔄 Mixed' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          className={`onboarding__option ${form.workout_preference === value ? 'onboarding__option--selected' : ''}`}
                          onClick={() => updateForm('workout_preference', value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="onboarding__field-group">
                    <label className="input-label">Equipment available</label>
                    <div className="onboarding__options">
                      {[
                        { value: 'none', label: 'No equipment' },
                        { value: 'basic', label: 'Basic (dumbbells, mat)' },
                        { value: 'full_gym', label: 'Full gym access' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          className={`onboarding__option ${form.equipment === value ? 'onboarding__option--selected' : ''}`}
                          onClick={() => updateForm('equipment', value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="onboarding__field-group">
                    <label className="input-label">Diet type</label>
                    <div className="onboarding__options">
                      {[
                        { value: 'veg', label: '🥬 Vegetarian' },
                        { value: 'non_veg', label: '🍗 Non-Veg' },
                        { value: 'eggetarian', label: '🥚 Eggetarian' },
                        { value: 'vegan', label: '🌱 Vegan' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          className={`onboarding__option ${form.diet_type === value ? 'onboarding__option--selected' : ''}`}
                          onClick={() => updateForm('diet_type', value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Health */}
              {step === 4 && (
                <div className="onboarding__fields">
                  <div className="onboarding__field-group">
                    <label className="input-label">Do you have any health conditions?</label>
                    <p className="onboarding__field-hint">Select all that apply. This helps us create safe workout plans.</p>
                    <div className="onboarding__health-grid">
                      {HEALTH_CONDITIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          className={`onboarding__health-chip ${form.health_conditions.includes(value) ? 'onboarding__health-chip--selected' : ''}`}
                          onClick={() => toggleHealthCondition(value)}
                        >
                          {form.health_conditions.includes(value) && <Check size={14} />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="City (optional)"
                    type="text"
                    placeholder="e.g., Mumbai, Delhi, Bengaluru"
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    hint="Helps us consider your local climate"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="onboarding__actions">
          {step > 0 && (
            <Button variant="ghost" onClick={prevStep} icon={ArrowLeft}>
              Back
            </Button>
          )}
          <div className="onboarding__actions-spacer" />
          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!isStepValid()}
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isStepValid()}
              loading={loading}
              icon={Check}
              iconPosition="right"
            >
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
