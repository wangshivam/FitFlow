import './Card.css';

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'card',
    `card--${variant}`,
    `card--pad-${padding}`,
    hover && 'card--hover',
    onClick && 'card--clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`card__header ${className}`}>
      <div className="card__header-content">{children}</div>
      {action && <div className="card__header-action">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card__body ${className}`}>{children}</div>;
}
