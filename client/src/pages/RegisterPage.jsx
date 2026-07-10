import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/shared';
import './AuthPages.css';

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
    <div className="auth-page">
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
        <div className="auth-page__features">
          <div className="auth-feature">
            <span className="auth-feature__icon">✅</span>
            <span>Free to start, no credit card needed</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature__icon">🇮🇳</span>
            <span>Built for Indian food & lifestyle</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature__icon">🔒</span>
            <span>Your data stays private & secure</span>
          </div>
        </div>
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
              Create Account
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
    </div>
  );
}
