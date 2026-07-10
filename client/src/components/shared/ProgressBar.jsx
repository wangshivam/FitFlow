import { useEffect, useState } from 'react';
import './ProgressBar.css';

export default function ProgressBar({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className = '',
}) {
  const [width, setWidth] = useState(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(percentage), 50);
      return () => clearTimeout(timer);
    } else {
      setWidth(percentage);
    }
  }, [percentage, animated]);

  return (
    <div className={`progress ${className}`}>
      {showLabel && (
        <div className="progress__label">
          <span className="progress__label-text">{label}</span>
          <span className="progress__label-value">
            {value}<span className="progress__label-max">/{max}</span>
          </span>
        </div>
      )}
      <div className={`progress__track progress__track--${size}`}>
        <div
          className={`progress__fill progress__fill--${variant}`}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
