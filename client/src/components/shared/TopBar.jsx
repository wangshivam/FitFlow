import { Flame, Globe, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from './Avatar';
import Modal from './Modal';
import Button from './Button';
import './TopBar.css';

export default function TopBar({ user }) {
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__greeting">
          <h1 className="topbar__hello">
            Namaste, {firstName}! 🙏
          </h1>
          {user?.streak_days > 0 && (
            <p className="topbar__streak">
              <Flame size={14} className="topbar__streak-icon" />
              You're on a {user.streak_days}-day streak. Keep it up!
            </p>
          )}
          {!user?.streak_days && (
            <p className="topbar__streak">
              {getGreeting()}! Let's make today count.
            </p>
          )}
        </div>
      </div>
      <div className="topbar__right">
        <Avatar
          src={user?.avatar_url}
          name={user?.name || 'User'}
          size="md"
        />
        <button
          className="topbar__logout-btn"
          onClick={() => setShowLogoutModal(true)}
          title="Log Out"
          aria-label="Log Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        title="Log Out?"
        size="sm"
      >
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          Are you sure you want to log out of FitFlow?
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <Button
            variant="outline"
            onClick={() => setShowLogoutModal(false)}
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleLogout}
            loading={isLoggingOut}
            style={{ backgroundColor: 'var(--color-error-500)', borderColor: 'var(--color-error-500)' }}
          >
            Log Out
          </Button>
        </div>
      </Modal>
    </header>
  );
}
