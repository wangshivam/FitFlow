import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, Menu, X, Check,
  Home, Utensils, CalendarDays, Dumbbell, MessageCircle,
  Brain, Zap, BarChart3, Heart, Apple, Send, Bot,
  Flame, Users, Target, Activity,
} from 'lucide-react';
import { ThemeToggle } from '../components/shared';
import './LandingPage.css';

// ── Flame Logo SVG (reused from index.html) ──
function FlameLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flameLogo" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <path d="M16 4C16 4 10 12 10 18C10 21.3 12.7 24 16 24C19.3 24 22 21.3 22 18C22 12 16 4 16 4Z" fill="url(#flameLogo)" />
    </svg>
  );
}

// ── Scroll fade-up wrapper ──
function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Animated counter hook ──
function useAnimatedCounter(end, duration = 2000, inView = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return count;
}

// ── Chat streaming hook ──
function useStreamText(text, speed = 25, trigger = false) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!trigger || hasStarted.current) return;
    hasStarted.current = true;
    setDisplayed('');
    setIsDone(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [trigger, text, speed]);

  return { displayed, isDone };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SOCIAL_PROOF = [
  { label: 'Meals Logged', value: 12000, suffix: '+' },
  { label: 'Active Users', value: 2400, suffix: '+' },
  { label: 'Calories Tracked', value: 1800000, suffix: '', format: true },
  { label: 'Workout Sessions', value: 8500, suffix: '+' },
];

const WHY_CARDS = [
  {
    icon: '🥗',
    title: 'AI Nutrition',
    desc: 'Understands everything from whey protein to homemade dal. Log anything — Arya knows the macros.',
  },
  {
    icon: '🏋️',
    title: 'Adaptive Workouts',
    desc: 'Schedules that adapt to your energy levels and home equipment. Gym or bedroom floor — it works.',
  },
  {
    icon: '🤖',
    title: 'Arya Memory',
    desc: 'Never repeat yourself. Arya remembers your goals, preferences, and even that you skipped leg day.',
  },
];

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Workout Planner',
    desc: 'Plans for gym or home — with or without equipment. Adjusted to your level.',
  },
  {
    icon: BarChart3,
    title: 'Weekly AI Reports',
    desc: 'Visualize your consistency with clear, actionable weekly summaries from Arya.',
  },
  {
    icon: Apple,
    title: 'Indian Food Database',
    desc: 'Accurate macros for regional dishes — from Hyderabadi biryani to Gujarati thepla.',
  },
  {
    icon: Zap,
    title: 'Smart Recommendations',
    desc: 'Actionable, realistic advice based on what you actually eat and how you actually train.',
  },
  {
    icon: Activity,
    title: 'Progress Analytics',
    desc: 'Clean, easy-to-read charts that show your trajectory — calories, protein, workouts.',
  },
  {
    icon: Heart,
    title: 'Health Integrations',
    desc: 'Works with your lifestyle. Log meals via text, and let Arya connect the dots.',
  },
];

const STEPS = [
  { title: 'Log Your Meal', desc: 'Just type what you ate — "2 roti with paneer" — Arya does the rest.' },
  { title: 'Arya Analyses', desc: 'AI parses your food, estimates calories, protein, carbs, and fat instantly.' },
  { title: 'Personalized Advice', desc: 'Get real-time feedback on your meal. Too few protein? Arya suggests what to add.' },
  { title: 'Improve Daily', desc: 'Watch your patterns change week over week as Arya helps you build better habits.' },
];

const MEMORY_TAGS = [
  {
    icon: '🎯',
    text: 'Goal: Fat Loss',
    demoTitle: 'Arya permanently remembers your goal.',
    demoDesc: 'Every calorie recommendation, meal suggestion and workout adapts automatically.',
    aiMessage: "I noticed your goal is Fat Loss.\nI've reduced today's calories by 120 because yesterday you exceeded your target.\nWould you like a high-protein dinner instead?",
    action: 'Suggest Dinner'
  },
  {
    icon: '🍳',
    text: 'Fav: Paneer, Eggs, Roti',
    demoTitle: 'Arya remembers foods you actually enjoy.',
    demoDesc: 'Instead of generic meal plans, recommendations stay realistic.',
    aiMessage: "You usually enjoy Paneer and Eggs.\nHere's a healthier version with 32g protein.",
    action: 'View Meal'
  },
  {
    icon: '🏋️',
    text: 'Skipped leg day Tue',
    demoTitle: 'Arya remembers missed workouts.',
    demoDesc: 'Instead of breaking your plan, it intelligently reschedules.',
    aiMessage: "Looks like Tuesday's Leg Workout was skipped.\nI've moved it to Thursday and adjusted recovery.",
    action: 'Accept Changes'
  },
  {
    icon: '😴',
    text: 'Sleep: 6h avg',
    demoTitle: 'Arya tracks recovery.',
    demoDesc: '',
    aiMessage: "You averaged only 6 hours of sleep.\nToday's workout intensity has been reduced by 10%.",
    action: 'See Why'
  },
  {
    icon: '💬',
    text: 'Recent chats: 12',
    demoTitle: 'Arya remembers previous conversations.',
    demoDesc: '',
    aiMessage: "Last week you asked for vegetarian protein sources.\nI've included more paneer, soy chunks and lentils in today's suggestions.",
    action: ''
  },
  {
    icon: '🥛',
    text: 'Lactose tolerant',
    demoTitle: 'Arya filters recommendations automatically.',
    demoDesc: '',
    aiMessage: "Milk-based recipes are allowed.\nProtein shakes are included in today's meal plan.",
    action: ''
  },
  {
    icon: '🏠',
    text: 'Home workouts preferred',
    demoTitle: 'Arya adapts to your environment.',
    demoDesc: '',
    aiMessage: "No gym today?\nI've converted your Push Workout into a bodyweight version.",
    action: ''
  },
  {
    icon: '📊',
    text: 'Protein target: 100g',
    demoTitle: 'Arya tracks specific macro goals.',
    demoDesc: '',
    aiMessage: "Today's target: 100g\nCurrent: 72g\nRemaining: 28g\nSuggested Meal: Paneer Sandwich",
    action: ''
  },
  {
    icon: '🕐',
    text: 'Usually eats dinner at 9pm',
    demoTitle: 'Arya learns your schedule.',
    demoDesc: '',
    aiMessage: "It's almost 9 PM.\nBased on your routine, here's tonight's dinner.",
    action: ''
  },
  {
    icon: '💪',
    text: 'Upper body day today',
    demoTitle: 'Arya prepares your session.',
    demoDesc: '',
    aiMessage: "Today's workout: Upper Body\nEstimated Time: 42 min\nReady to begin?",
    action: ''
  },
];

const TESTIMONIALS = [
  {
    text: "Finally, an app that actually knows the macros in my mom's homemade sabzi. Arya understood everything I threw at it.",
    name: 'Priya S.',
    detail: 'Lost 3kg in 6 weeks',
    initials: 'PS',
  },
  {
    text: "I lost 4kg without aggressively counting calories. Arya just guided my portion sizes and I naturally started eating better.",
    name: 'Rahul K.',
    detail: 'Consistent for 3 months',
    initials: 'RK',
  },
  {
    text: "I've finally started hitting 100g of protein daily on a vegetarian diet. Arya showed me how with foods I already eat.",
    name: 'Meera D.',
    detail: 'Vegetarian, 100g protein daily',
    initials: 'MD',
  },
];

const FREE_FEATURES = [
  { text: '5 food logs per day', included: true },
  { text: '10 AI coach messages/day', included: true },
  { text: 'AI food parser (Indian foods)', included: true },
  { text: 'Daily workout plans', included: true },
  { text: 'Unlimited food logs', included: false },
  { text: 'Unlimited AI coaching', included: false },
  { text: 'Advanced analytics', included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Everything in Free', included: true },
  { text: 'Unlimited food logs', included: true },
  { text: 'Unlimited AI coach (Arya)', included: true },
  { text: 'Advanced nutrition analytics', included: true },
  { text: 'Weekly AI progress reports', included: true },
  { text: 'Priority AI processing', included: true },
  { text: 'Priority support', included: true },
];

const DEMO_USER_MSG = "I only have paneer and rice for dinner. How do I hit my protein goal?";
const DEMO_AI_MSG = "Let's balance that! 150g of paneer and a cup of rice gives you about 28g of protein. Add a side of dal or a dollop of Greek yogurt, and you're perfectly on track! 🍛";

// ── Hero mockup chat messages ──
const HERO_CHAT_MESSAGES = [
  { role: 'user', content: 'I had 2 roti with dal for lunch' },
  { role: 'ai', content: 'Logged! That\'s about 340 kcal with 14g protein. You\'ve got 1,460 kcal and 86g protein left for today. Great start! 🎯' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── 1. Navbar ──
function Navbar({ onScrollTo }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNav = (id) => {
    setMenuOpen(false);
    onScrollTo(id);
  };

  return (
    <nav
      className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="landing-nav__inner">
        <a href="#" className="landing-nav__logo" aria-label="FitFlow Home">
          <FlameLogo className="landing-nav__logo-icon" />
          <span className="landing-nav__logo-text">FitFlow</span>
        </a>

        <ul className="landing-nav__links">
          <li><button className="landing-nav__link" onClick={() => handleNav('features')}>Features</button></li>
          <li><button className="landing-nav__link" onClick={() => handleNav('how-it-works')}>How It Works</button></li>
          <li><button className="landing-nav__link" onClick={() => handleNav('pricing')}>Pricing</button></li>
        </ul>

        <div className="landing-nav__actions">
          <ThemeToggle />
          <Link to="/login" className="landing-nav__login">Log In</Link>
          <Link to="/register" className="landing-nav__cta">
            Start Free <ArrowRight size={14} />
          </Link>
          <button
            className="landing-nav__menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`landing-nav__mobile ${menuOpen ? 'landing-nav__mobile--open' : ''}`}>
        <button className="landing-nav__mobile-link" onClick={() => handleNav('features')}>Features</button>
        <button className="landing-nav__mobile-link" onClick={() => handleNav('how-it-works')}>How It Works</button>
        <button className="landing-nav__mobile-link" onClick={() => handleNav('pricing')}>Pricing</button>
        <Link to="/login" className="landing-nav__mobile-link">Log In</Link>
        <Link to="/register" className="landing-nav__mobile-cta">Start Free →</Link>
      </div>
    </nav>
  );
}

// ── 2. Hero Section ──
function HeroSection() {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const [chatPhase, setChatPhase] = useState(0);
  const [streamedText, setStreamedText] = useState('');

  // Cursor-following glow
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px';
        glowRef.current.style.top = e.clientY + 'px';
      }
    };

    hero.addEventListener('mousemove', handleMove, { passive: true });
    return () => hero.removeEventListener('mousemove', handleMove);
  }, []);

  // Auto-play chat sequence
  useEffect(() => {
    const timers = [];
    // Phase 1: show chips (already visible)
    // Phase 2: show user message
    timers.push(setTimeout(() => setChatPhase(1), 1500));
    // Phase 3: show typing indicator
    timers.push(setTimeout(() => setChatPhase(2), 2500));
    // Phase 4: stream AI response
    timers.push(setTimeout(() => setChatPhase(3), 4000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stream AI response text
  useEffect(() => {
    if (chatPhase !== 3) return;
    const text = HERO_CHAT_MESSAGES[1].content;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedText(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [chatPhase]);

  return (
    <section className="landing-hero" ref={heroRef}>
      <div className="landing-hero__glow" ref={glowRef} />

      <div className="landing-hero__inner">
        {/* Left content */}
        <motion.div
          className="landing-hero__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="landing-hero__badge">
            <span className="landing-hero__badge-dot" />
            AI-Powered Fitness for India
          </div>

          <h1 className="landing-hero__title">
            Meet <span>Arya</span> — Your AI Fitness&nbsp;Coach.
          </h1>

          <p className="landing-hero__subtitle">
            Track meals, build smarter workouts, understand your nutrition, and stay consistent with an AI coach that remembers you and your lifestyle.
          </p>

          <div className="landing-hero__ctas">
            <Link to="/register" className="landing-hero__cta-primary" id="hero-start-free">
              Start Free <ArrowRight size={16} />
            </Link>
            <button
              className="landing-hero__cta-secondary"
              onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Play size={14} /> Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Right mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="landing-mockup">
            {/* Header */}
            <div className="landing-mockup__header">
              <div>
                <div className="landing-mockup__greeting">Welcome! Let's make today count.</div>
                <div className="landing-mockup__greeting-sub">Your daily coach is ready</div>
              </div>
              <div className="landing-mockup__avatar">
                <Bot size={16} />
              </div>
            </div>

            {/* Body */}
            <div className="landing-mockup__body">
              {/* Suggestion chips */}
              <div className="landing-mockup__chips">
                <div className="landing-mockup__chip">🍛 What should I eat for dinner?</div>
                <div className="landing-mockup__chip">💪 Build muscle at home?</div>
                <div className="landing-mockup__chip">📊 Analyse my nutrition</div>
              </div>

              {/* Chat messages */}
              <div className="landing-mockup__chat">
                {chatPhase >= 1 && (
                  <motion.div
                    className="landing-mockup__msg landing-mockup__msg--user"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {HERO_CHAT_MESSAGES[0].content}
                  </motion.div>
                )}

                {chatPhase === 2 && (
                  <div className="landing-mockup__typing">
                    <span /><span /><span />
                  </div>
                )}

                {chatPhase >= 3 && (
                  <motion.div
                    className="landing-mockup__msg landing-mockup__msg--ai"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="landing-mockup__msg-label">
                      <Bot size={11} /> Arya
                    </div>
                    {streamedText}
                    {streamedText.length < HERO_CHAT_MESSAGES[1].content.length && (
                      <span className="landing-demo__cursor" />
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottom nav */}
            <div className="landing-mockup__nav">
              <div className="landing-mockup__nav-item landing-mockup__nav-item--active">
                <Home size={16} />
                <span>Home</span>
              </div>
              <div className="landing-mockup__nav-item">
                <Utensils size={16} />
                <span>Diet</span>
              </div>
              <div className="landing-mockup__nav-item">
                <CalendarDays size={16} />
                <span>Weekly</span>
              </div>
              <div className="landing-mockup__nav-item">
                <Dumbbell size={16} />
                <span>Workout</span>
              </div>
              <div className="landing-mockup__nav-item">
                <MessageCircle size={16} />
                <span>Coach</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── 3. Social Proof ──
function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="landing-proof" ref={ref}>
      <div className="landing__section">
        <div className="landing-proof__grid">
          {SOCIAL_PROOF.map((item) => (
            <ProofItem key={item.label} item={item} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofItem({ item, inView }) {
  const count = useAnimatedCounter(
    item.format ? item.value / 1000 : item.value,
    2000,
    inView
  );

  const display = item.format
    ? `${(count / 1000).toFixed(1)}M`
    : count.toLocaleString();

  return (
    <div className="landing-proof__item">
      <div className="landing-proof__number">
        {display}{item.suffix}
      </div>
      <div className="landing-proof__label">{item.label}</div>
    </div>
  );
}

// ── 4. Why FitFlow ──
function WhySection() {
  return (
    <section className="landing-why">
      <div className="landing__section">
        <FadeUp>
          <div className="landing-why__header">
            <div className="landing__section-label">
              <Zap size={14} /> Why FitFlow
            </div>
            <h2 className="landing__section-title">Built for how India eats and trains</h2>
            <p className="landing__section-subtitle">
              Not another Western calorie tracker. FitFlow understands desi food, Indian lifestyles, and your unique goals.
            </p>
          </div>
        </FadeUp>

        <div className="landing-why__grid">
          {WHY_CARDS.map((card, i) => (
            <FadeUp key={card.title} delay={i * 0.1}>
              <div className="landing-why__card">
                <span className="landing-why__card-icon">{card.icon}</span>
                <h3 className="landing-why__card-title">{card.title}</h3>
                <p className="landing-why__card-desc">{card.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 5. Interactive Demo ──
function DemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [phase, setPhase] = useState(0); // 0=idle, 1=user msg, 2=typing, 3=streaming
  const { displayed: aiText, isDone } = useStreamText(DEMO_AI_MSG, 22, phase === 3);

  useEffect(() => {
    if (!inView) return;
    const timers = [];
    timers.push(setTimeout(() => setPhase(1), 600));
    timers.push(setTimeout(() => setPhase(2), 1800));
    timers.push(setTimeout(() => setPhase(3), 3200));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section className="landing-demo" id="demo" ref={ref}>
      <div className="landing__section">
        <div className="landing-demo__inner">
          <FadeUp>
            <div className="landing-demo__content">
              <div className="landing__section-label">
                <MessageCircle size={14} /> Live Demo
              </div>
              <h2 className="landing__section-title">See Arya in action</h2>
              <p className="landing__section-subtitle">
                Watch how Arya handles a real question about Indian food and protein goals — with specific, actionable advice.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="landing-demo__chat">
              {/* Chat header */}
              <div className="landing-demo__chat-header">
                <div className="landing-demo__chat-avatar">
                  <Bot size={14} />
                </div>
                <div>
                  <div className="landing-demo__chat-name">Arya</div>
                  <div className="landing-demo__chat-status">AI Coach · Online</div>
                </div>
              </div>

              {/* Messages */}
              <div className="landing-demo__messages">
                {phase >= 1 && (
                  <motion.div
                    className="landing-demo__msg landing-demo__msg--user"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {DEMO_USER_MSG}
                  </motion.div>
                )}

                {phase === 2 && (
                  <motion.div
                    className="landing-demo__typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span /><span /><span />
                  </motion.div>
                )}

                {phase >= 3 && (
                  <motion.div
                    className="landing-demo__msg landing-demo__msg--ai"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="landing-demo__msg-label">
                      <Bot size={11} /> Arya
                    </div>
                    {aiText}
                    {!isDone && <span className="landing-demo__cursor" />}
                  </motion.div>
                )}
              </div>

              {/* Fake input */}
              <div className="landing-demo__input">
                <span className="landing-demo__input-field">Ask Arya anything…</span>
                <div className="landing-demo__input-send">
                  <Send size={14} />
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ── 6. Features Bento Grid ──
function FeaturesSection() {
  return (
    <section className="landing-features" id="features">
      <div className="landing__section">
        <FadeUp>
          <div className="landing-features__header">
            <div className="landing__section-label">
              <Target size={14} /> Features
            </div>
            <h2 className="landing__section-title">Everything you need to get fitter</h2>
            <p className="landing__section-subtitle">
              A complete platform designed for the Indian fitness journey — from roti to reps.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="landing-features__grid">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="landing-features__card">
                  <div className="landing-features__card-icon">
                    <Icon size={20} />
                  </div>
                  <h3 className="landing-features__card-title">{f.title}</h3>
                  <p className="landing-features__card-desc">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── 7. How It Works ──
function StepsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-200px' });

  return (
    <section className="landing-steps" id="how-it-works" ref={ref}>
      <div className="landing__section">
        <FadeUp>
          <div className="landing-steps__header">
            <div className="landing__section-label">
              <ArrowRight size={14} /> How It Works
            </div>
            <h2 className="landing__section-title">Four steps to a better you</h2>
            <p className="landing__section-subtitle">
              Simple, intuitive, and effective. Here's how FitFlow fits into your day.
            </p>
          </div>
        </FadeUp>

        <div className="landing-steps__flow">


          {STEPS.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.15}>
              <div className="landing-steps__item">
                <div className={`landing-steps__number ${inView ? 'landing-steps__number--active' : ''}`}>
                  {i + 1}
                </div>
                <h3 className="landing-steps__item-title">{step.title}</h3>
                <p className="landing-steps__item-desc">{step.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 8. AI Memory ──
function MemorySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const handleChipClick = (index) => {
    if (activeIndex === index) return;
    setActiveIndex(index);
    setIsTyping(true);
  };

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => setIsTyping(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isTyping, activeIndex]);

  const activeData = MEMORY_TAGS[activeIndex];

  return (
    <section className="landing-memory">
      <div className="landing__section">
        <FadeUp>
          <div className="landing-memory__card">
            <div className="landing-memory__content">
              <div className="landing__section-label">
                <Brain size={14} /> AI Memory
              </div>

              <div className="landing-memory__demo-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="landing-memory__demo-content"
                  >
                    <h2 className="landing-memory__title">{activeData.demoTitle}</h2>
                    {activeData.demoDesc && (
                      <p className="landing-memory__desc">{activeData.demoDesc}</p>
                    )}

                    <div className="landing-memory__demo-chat-container">
                      <div className="landing-memory__demo-chat-header">
                        <Bot size={14} className="landing-memory__demo-bot-icon" />
                        <span>Arya</span>
                      </div>
                      
                      {isTyping ? (
                        <div className="landing-memory__demo-typing">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="landing-memory__demo-chat-bubble"
                        >
                          {activeData.aiMessage.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                          {activeData.action && (
                            <button className="landing-memory__demo-btn">
                              {activeData.action}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="landing-memory__brain">
              {MEMORY_TAGS.map((tag, i) => {
                const isActive = activeIndex === i;
                return (
                  <FadeUp key={tag.text} delay={i * 0.04}>
                    <button 
                      className={`landing-memory__tag ${isActive ? 'landing-memory__tag--highlight' : ''}`}
                      onClick={() => handleChipClick(i)}
                      aria-pressed={isActive}
                    >
                      <span className="landing-memory__tag-icon">{tag.icon}</span>
                      {tag.text}
                    </button>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── 9. Testimonials ──
function TestimonialsSection() {
  return (
    <section className="landing-testimonials">
      <div className="landing__section">
        <FadeUp>
          <div className="landing-testimonials__header">
            <div className="landing__section-label">
              <Users size={14} /> Real Users
            </div>
            <h2 className="landing__section-title">What people are saying</h2>
            <p className="landing__section-subtitle">
              Unfiltered reactions from real FitFlow users who are transforming their health.
            </p>
          </div>
        </FadeUp>

        <div className="landing-testimonials__grid">
          {TESTIMONIALS.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div className="landing-testimonial">
                <div className="landing-testimonial__bubble">
                  {t.text}
                </div>
                <div className="landing-testimonial__meta">
                  <div className="landing-testimonial__avatar">{t.initials}</div>
                  <div className="landing-testimonial__info">
                    <span className="landing-testimonial__name">{t.name}</span>
                    <span className="landing-testimonial__detail">{t.detail}</span>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 10. Pricing ──
function PricingSection() {
  return (
    <section className="landing-pricing" id="pricing">
      <div className="landing__section">
        <FadeUp>
          <div className="landing-pricing__header">
            <div className="landing__section-label">
              <Flame size={14} /> Pricing
            </div>
            <h2 className="landing__section-title">Simple, transparent pricing</h2>
            <p className="landing__section-subtitle">
              Start free. Upgrade when you're ready for unlimited AI coaching and advanced features.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="landing-pricing__grid">
            {/* Free */}
            <div className="landing-pricing__card">
              <h3 className="landing-pricing__plan-name">Free</h3>
              <div className="landing-pricing__price">
                <span className="landing-pricing__amount">₹0</span>
                <span className="landing-pricing__period">/month</span>
              </div>
              <div className="landing-pricing__divider" />
              <ul className="landing-pricing__features">
                {FREE_FEATURES.map((f) => (
                  <li
                    key={f.text}
                    className={`landing-pricing__feature ${!f.included ? 'landing-pricing__feature--disabled' : ''}`}
                  >
                    {f.included
                      ? <Check size={15} className="landing-pricing__check" />
                      : <X size={15} className="landing-pricing__x" />
                    }
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-pricing__cta landing-pricing__cta--outline">
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="landing-pricing__card landing-pricing__card--featured">
              <div className="landing-pricing__badge">Most Popular</div>
              <h3 className="landing-pricing__plan-name">Premium</h3>
              <div className="landing-pricing__price">
                <span className="landing-pricing__amount">₹299</span>
                <span className="landing-pricing__period">/month</span>
              </div>
              <div className="landing-pricing__divider" />
              <ul className="landing-pricing__features">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.text} className="landing-pricing__feature">
                    <Check size={15} className="landing-pricing__check" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-pricing__cta landing-pricing__cta--primary" id="pricing-start-free">
                Start Free Trial <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── 11. Final CTA ──
function FinalCTA() {
  return (
    <section className="landing-final-cta">
      <div className="landing__section">
        <FadeUp>
          <h2 className="landing-final-cta__title">
            Ready to train with an AI that actually knows you?
          </h2>
          <p className="landing-final-cta__subtitle">
            Join thousands of Indians building healthier habits with Arya.
          </p>
          <Link to="/register" className="landing-final-cta__btn" id="final-start-free">
            Start Free <ArrowRight size={16} />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}

// ── 12. Footer ──
function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing__section">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <FlameLogo className="landing-footer__logo-icon" />
            <span className="landing-footer__name">FitFlow</span>
            <span className="landing-footer__copy">© {new Date().getFullYear()} FitFlow. All rights reserved.</span>
          </div>
          <ul className="landing-footer__links">
            <li><a href="#" className="landing-footer__link">Privacy Policy</a></li>
            <li><a href="#" className="landing-footer__link">Terms of Service</a></li>
            <li><a href="#" className="landing-footer__link">Contact</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function LandingPage() {
  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing">
      <Navbar onScrollTo={scrollTo} />
      <HeroSection />
      <SocialProof />
      <WhySection />
      <DemoSection />
      <FeaturesSection />
      <StepsSection />
      <MemorySection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
