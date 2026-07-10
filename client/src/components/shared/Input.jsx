import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  hint,
  icon: Icon,
  suffix,
  fullWidth = true,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const wrapperClasses = [
    'input-wrapper',
    fullWidth && 'input-wrapper--full',
    className,
  ].filter(Boolean).join(' ');

  const fieldClasses = [
    'input-field',
    `input-field--${size}`,
    error && 'input-field--error',
    Icon && 'input-field--has-icon',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {Icon && (
          <Icon className="input-icon" size={size === 'sm' ? 14 : 16} />
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={fieldClasses}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

export function Select({
  label,
  options = [],
  error,
  hint,
  fullWidth = true,
  size = 'md',
  className = '',
  id,
  placeholder,
  ...props
}) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-field input-field--${size} input-field--select ${error ? 'input-field--error' : ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  id,
  rows = 3,
  ...props
}) {
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full' : ''} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="input-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`input-field input-field--textarea ${error ? 'input-field--error' : ''}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
}
