import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../api';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import {
  Crown, Check, X, Zap, MessageCircle,
  Utensils, Dumbbell, TrendingUp, Shield, Loader2,
} from 'lucide-react';
import './PremiumPage.css';

const FREE_FEATURES = [
  { text: '5 food logs per day', icon: Utensils, included: true },
  { text: '10 AI coach messages/day', icon: MessageCircle, included: true },
  { text: 'AI food parser (Indian foods)', icon: Zap, included: true },
  { text: 'Daily workout plans', icon: Dumbbell, included: true },
  { text: 'Basic nutrition tracking', icon: TrendingUp, included: true },
  { text: 'Unlimited food logs', icon: Utensils, included: false },
  { text: 'Unlimited AI coach messages', icon: MessageCircle, included: false },
  { text: 'Advanced analytics', icon: TrendingUp, included: false },
  { text: 'Priority support', icon: Shield, included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Unlimited food logs', icon: Utensils },
  { text: 'Unlimited AI coach (Arya) messages', icon: MessageCircle },
  { text: 'Advanced nutrition analytics', icon: TrendingUp },
  { text: 'AI workout personalization', icon: Dumbbell },
  { text: 'Indian food calorie database', icon: Zap },
  { text: 'Priority AI processing', icon: Zap },
  { text: 'Weekly progress reports', icon: TrendingUp },
  { text: 'Priority customer support', icon: Shield },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PremiumPage() {
  const { user, isPremium, refreshUser } = useAuth();
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await paymentAPI.getStatus();
      setSubStatus(data);
    } catch {
      setSubStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setPaying(true);
    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please check your internet connection.');
        return;
      }

      // Create order
      const { data: order } = await paymentAPI.createSubscription();

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Fit Flow Premium',
        description: 'Monthly Premium Subscription — ₹299/month',
        order_id: order.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#F97316' },
        handler: async (response) => {
          try {
            await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccess(true);
            await refreshUser();
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to initiate payment. Please try again.';
      alert(msg);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="premium-page animate-fade-in">
        <div className="premium-page__loading">
          <Loader2 size={32} className="premium-page__spinner" />
          <span>Loading plan details…</span>
        </div>
      </div>
    );
  }

  if (success || isPremium) {
    return (
      <div className="premium-page animate-fade-in">
        <div className="premium-page__success">
          <div className="premium-success__icon">
            <Crown size={40} />
          </div>
          <h1>You're Premium! 🎉</h1>
          <p>You have full access to all Fit Flow features. Enjoy unlimited AI coaching, food logging, and advanced analytics.</p>
          {subStatus?.subscription?.expires_at && (
            <div className="premium-success__exp">
              Active until: <strong>
                {new Date(subStatus.subscription.expires_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </strong>
            </div>
          )}
          <div className="premium-success__features">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f.text} className="premium-success__feature">
                <Check size={16} />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <a href="/" className="premium-success__cta">Go to Dashboard →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page animate-fade-in">
      {/* Hero */}
      <div className="premium-hero">
        <div className="premium-hero__badge">
          <Crown size={16} />
          Fit Flow Premium
        </div>
        <h1 className="premium-hero__title">
          Unlock your full<br />fitness potential
        </h1>
        <p className="premium-hero__sub">
          Get unlimited AI coaching, advanced analytics, and everything you need to crush your goals.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="premium-cards">
        {/* Free Plan */}
        <Card variant="default" padding="lg" className="premium-plan-card">
          <div className="premium-plan__header">
            <h3>Free</h3>
            <div className="premium-plan__price">
              <span className="premium-plan__amount">₹0</span>
              <span className="premium-plan__period">/month</span>
            </div>
          </div>
          <ul className="premium-plan__features">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className={`premium-plan__feature ${f.included ? '' : 'premium-plan__feature--disabled'}`}>
                {f.included
                  ? <Check size={15} className="premium-plan__check" />
                  : <X size={15} className="premium-plan__x" />
                }
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <div className="premium-plan__current">Current Plan</div>
        </Card>

        {/* Premium Plan */}
        <Card variant="highlight" padding="lg" className="premium-plan-card premium-plan-card--featured">
          <div className="premium-plan__popular">Most Popular</div>
          <div className="premium-plan__header">
            <div className="premium-plan__crown">
              <Crown size={20} />
              <h3>Premium</h3>
            </div>
            <div className="premium-plan__price">
              <span className="premium-plan__amount premium-plan__amount--premium">₹299</span>
              <span className="premium-plan__period">/month</span>
            </div>
            <span className="premium-plan__tagline">Everything in Free, plus:</span>
          </div>
          <ul className="premium-plan__features">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.text} className="premium-plan__feature">
                <Check size={15} className="premium-plan__check premium-plan__check--orange" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            icon={Crown}
            onClick={handleSubscribe}
            loading={paying}
            id="premium-subscribe-btn"
          >
            {paying ? 'Opening Payment…' : 'Subscribe — ₹299/month'}
          </Button>
          <p className="premium-plan__disclaimer">
            Secure payment via Razorpay · Cancel anytime · Auto-renews monthly
          </p>
        </Card>
      </div>

      {/* Trust Badges */}
      <div className="premium-trust">
        <div className="premium-trust__item">
          <Shield size={18} />
          <span>Secure SSL Payment</span>
        </div>
        <div className="premium-trust__item">
          <Zap size={18} />
          <span>Instant Activation</span>
        </div>
        <div className="premium-trust__item">
          <Check size={18} />
          <span>Cancel Anytime</span>
        </div>
      </div>

      {/* FAQ */}
      <Card variant="default" padding="lg" className="premium-faq">
        <h3>Common Questions</h3>
        <div className="premium-faq__list">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes — you can cancel your subscription at any time. You\'ll retain premium access until your billing period ends.' },
            { q: 'How does the AI coach work?', a: 'Arya, our AI coach, uses Claude Sonnet and reads your actual food logs and workout data to give personalized, context-aware advice — in a friendly Indian-English tone.' },
            { q: 'Is my data safe?', a: 'Absolutely. All data is encrypted in transit and at rest. We never share your personal health data with third parties.' },
            { q: 'What payment methods are accepted?', a: 'We accept all major UPI apps, credit/debit cards, and net banking via Razorpay — India\'s most trusted payment gateway.' },
          ].map(({ q, a }) => (
            <div key={q} className="premium-faq__item">
              <h4>{q}</h4>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
