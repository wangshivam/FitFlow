import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/shared';
import './AuthPages.css';

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const getPasswordStrength = (password) => {
  if (!password) return 0;
  if (password.length < 6) return 1;
  if (password.length < 8) return 2;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 8) return 4;
  return 3;
};

const getStrengthLabel = (strength) => {
  if (strength === 0) return '';
  if (strength <= 1) return 'Weak';
  if (strength === 2) return 'Fair';
  if (strength === 3) return 'Good';
  return 'Strong';
};

export default function RegisterPage() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    setError(null);
    setFormErrors({});
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/onboarding');
    } catch {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="auth-page__left">
        <div className="auth-page__brand">
          <div className="auth-page__logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="auth-flame-reg" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB923C" />
                  <stop offset="1" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              <path d="M16 4C16 4 10 12 10 18C10 21.3 12.7 24 16 24C19.3 24 22 21.3 22 18C22 12 16 4 16 4Z" fill="url(#auth-flame-reg)" />
              <path d="M16 12C16 12 13 16 13 19C13 20.7 14.3 22 16 22C17.7 22 19 20.7 19 19C19 16 16 12 16 12Z" fill="white" opacity="0.6" />
            </svg>
          </div>
          <h2 className="auth-page__brand-name">Fit Flow</h2>
        </div>
        <div className="auth-page__tagline">
          <h1>Start your fitness journey today.</h1>
          <p>Join thousands of Indians transforming their health with AI-powered guidance.</p>
        </div>
        <motion.div 
          className="auth-page__features"
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="auth-feature" variants={itemVariants}>
            <span className="auth-feature__icon">🍛</span>
            <div className="auth-feature__text">
              <span className="auth-feature__title">AI Nutrition</span>
              <span className="auth-feature__desc">Log meals instantly via typing and understand your exact macros.</span>
            </div>
          </motion.div>
          <motion.div className="auth-feature" variants={itemVariants}>
            <span className="auth-feature__icon">🏋️</span>
            <div className="auth-feature__text">
              <span className="auth-feature__title">Adaptive Workouts</span>
              <span className="auth-feature__desc">Personalized training plans that evolve with your daily progress.</span>
            </div>
          </motion.div>
          <motion.div className="auth-feature" variants={itemVariants}>
            <span className="auth-feature__icon">🤖</span>
            <div className="auth-feature__text">
              <span className="auth-feature__title">Arya AI Coach</span>
              <span className="auth-feature__desc">An intelligent fitness partner that remembers your history and goals.</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="auth-page__right">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Create your account</h2>
            <p>It takes less than a minute to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Arjun Sharma"
              icon={User}
              value={form.name}
              onChange={handleChange}
              error={formErrors.name}
              autoComplete="name"
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={handleChange}
              error={formErrors.email}
              autoComplete="email"
              required
            />

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                icon={Lock}
                value={form.password}
                onChange={handleChange}
                error={formErrors.password}
                autoComplete="new-password"
                required
              />
              {form.password && (
                <div>
                  <div className="password-strength">
                    <div className={`password-strength__bar ${getPasswordStrength(form.password) >= 1 ? 'password-strength__bar--active weak' : ''}`} />
                    <div className={`password-strength__bar ${getPasswordStrength(form.password) >= 2 ? 'password-strength__bar--active fair' : ''}`} />
                    <div className={`password-strength__bar ${getPasswordStrength(form.password) >= 3 ? 'password-strength__bar--active good' : ''}`} />
                    <div className={`password-strength__bar ${getPasswordStrength(form.password) >= 4 ? 'password-strength__bar--active strong' : ''}`} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    {getStrengthLabel(getPasswordStrength(form.password))}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              icon={Lock}
              value={form.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              autoComplete="new-password"
              required
            />

            {error && <div className="auth-error">{error}</div>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="auth-card__footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
