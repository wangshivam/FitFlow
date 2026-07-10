import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Utensils, Dumbbell, MessageCircle, Crown, ChevronLeft, Menu, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/diet', label: 'Diet', icon: Utensils },
  { path: '/weekly-summary', label: 'Weekly', icon: BarChart3 },
  { path: '/workout', label: 'Workout', icon: Dumbbell },
  { path: '/coach', label: 'Coach', icon: MessageCircle },
];

export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle menu"
      >
        <Menu size={22} />
      </button>

      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="flame-grad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB923C" />
                  <stop offset="1" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              <path d="M16 4C16 4 10 12 10 18C10 21.3 12.7 24 16 24C19.3 24 22 21.3 22 18C22 12 16 4 16 4Z" fill="url(#flame-grad)" />
              <path d="M16 12C16 12 13 16 13 19C13 20.7 14.3 22 16 22C17.7 22 19 20.7 19 19C19 16 16 12 16 12Z" fill="white" opacity="0.6" />
            </svg>
          </div>
          {!collapsed && <span className="sidebar__logo-text">Fit Flow</span>}
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={20} strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Premium Status */}
        <div className="sidebar__footer">
          {user?.tier === 'premium' ? (
            <div className={`sidebar__premium ${collapsed ? 'sidebar__premium--collapsed' : ''}`}>
              <Crown size={16} />
              {!collapsed && (
                <div className="sidebar__premium-info">
                  <span className="sidebar__premium-label">Premium Active</span>
                  <span className="sidebar__premium-sub">AI Coach unlocked</span>
                </div>
              )}
            </div>
          ) : (
            !collapsed && (
              <NavLink to="/premium" className="sidebar__upgrade">
                <Crown size={16} />
                <div className="sidebar__upgrade-info">
                  <span className="sidebar__upgrade-label">Go Premium</span>
                  <span className="sidebar__upgrade-sub">₹299/month</span>
                </div>
              </NavLink>
            )
          )}

          {/* Collapse Toggle */}
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={18}
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s ease',
              }}
            />
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
