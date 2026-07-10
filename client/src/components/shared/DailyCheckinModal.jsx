import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CheckCircle2, Zap } from 'lucide-react';
import './DailyCheckinModal.css';

const ENERGY_OPTIONS = [
  { value: 'low', label: 'Low', emoji: '🥱' },
  { value: 'normal', label: 'Normal', emoji: '😊' },
  { value: 'high', label: 'High', emoji: '🔥' },
];

const SORENESS_OPTIONS = [
  { value: 'none', label: 'None', emoji: '✨' },
  { value: 'mild', label: 'Mild', emoji: '🤕' },
  { value: 'severe', label: 'Severe', emoji: '😫' },
];

export default function DailyCheckinModal({ isOpen, onClose, onGenerate, isGenerating }) {
  const [energy, setEnergy] = useState('normal');
  const [soreness, setSoreness] = useState('none');
  const [missedYesterday, setMissedYesterday] = useState(false);

  const handleSubmit = () => {
    onGenerate({ energy, soreness, missedYesterday });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Check-In"
      size="md"
    >
      <div className="daily-checkin-modal">
        <p className="daily-checkin__intro">
          Let's tailor today's workout to exactly how you feel.
        </p>

        <div className="daily-checkin__section">
          <label className="daily-checkin__label">How is your energy today?</label>
          <div className="daily-checkin__options">
            {ENERGY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`daily-checkin__btn ${energy === opt.value ? 'daily-checkin__btn--selected' : ''}`}
                onClick={() => setEnergy(opt.value)}
              >
                <span className="daily-checkin__emoji">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="daily-checkin__section">
          <label className="daily-checkin__label">Muscle Soreness?</label>
          <div className="daily-checkin__options">
            {SORENESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`daily-checkin__btn ${soreness === opt.value ? 'daily-checkin__btn--selected' : ''}`}
                onClick={() => setSoreness(opt.value)}
              >
                <span className="daily-checkin__emoji">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="daily-checkin__section">
          <label className="daily-checkin__label">Did you miss yesterday's workout?</label>
          <div className="daily-checkin__options">
            <button
              className={`daily-checkin__btn ${missedYesterday === true ? 'daily-checkin__btn--selected' : ''}`}
              onClick={() => setMissedYesterday(true)}
            >
              <span className="daily-checkin__emoji">🙈</span>
              <span>Yes, missed it</span>
            </button>
            <button
              className={`daily-checkin__btn ${missedYesterday === false ? 'daily-checkin__btn--selected' : ''}`}
              onClick={() => setMissedYesterday(false)}
            >
              <span className="daily-checkin__emoji">💪</span>
              <span>No, crushed it</span>
            </button>
          </div>
        </div>

        <div className="daily-checkin__actions">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            loading={isGenerating}
            icon={Zap}
            fullWidth
          >
            Generate Adaptive Workout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
