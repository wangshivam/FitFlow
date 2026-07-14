import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
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

export default function LoginPage() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;

    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.profile?.onboarding_complete) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
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
                <linearGradient id="auth-flame" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB923C" />
                  <stop offset="1" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              <path d="M16 4C16 4 10 12 10 18C10 21.3 12.7 24 16 24C19.3 24 22 21.3 22 18C22 12 16 4 16 4Z" fill="url(#auth-flame)" />
              <path d="M16 12C16 12 13 16 13 19C13 20.7 14.3 22 16 22C17.7 22 19 20.7 19 19C19 16 16 12 16 12Z" fill="white" opacity="0.6" />
            </svg>
          </div>
          <h2 className="auth-page__brand-name">Fit Flow</h2>
        </div>
        <div className="auth-page__tagline">
          <h1>Your AI fitness partner,<br />designed for India.</h1>
          <p>Track nutrition, get personalized workouts, and chat with your AI coach — all in one place.</p>
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
            <h2>Welcome back</h2>
            <p>Sign in to continue your fitness journey</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              icon={Lock}
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <div className="auth-options">
              <label className="auth-checkbox">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: 'var(--font-size-sm)' }}>
                Forgot Password?
              </Link>
            </div>

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
              {loading ? 'Signing you in...' : 'Sign In'}
            </Button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              disabled
            >
              Continue with Google
            </Button>
          </form>

          <div className="auth-card__footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
