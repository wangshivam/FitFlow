import './SkeletonLoader.css';

export default function SkeletonLoader({
  width,
  height = '16px',
  borderRadius,
  variant = 'text',
  count = 1,
  className = '',
}) {
  const variants = {
    text: { height: '14px', borderRadius: 'var(--radius-sm)' },
    title: { height: '24px', borderRadius: 'var(--radius-sm)', width: '60%' },
    circle: { borderRadius: '50%' },
    card: { height: '120px', borderRadius: 'var(--radius-xl)' },
    button: { height: '40px', borderRadius: 'var(--radius-lg)', width: '120px' },
  };

  const style = {
    width: width || variants[variant]?.width || '100%',
    height: height || variants[variant]?.height,
    borderRadius: borderRadius || variants[variant]?.borderRadius,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{
            ...style,
            ...(variant === 'circle' ? { width: height, height } : {}),
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <SkeletonLoader variant="title" />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <SkeletonLoader count={3} height="14px" />
      </div>
    </div>
  );
}

export function SkeletonMealCard() {
  return (
    <div className="skeleton-meal">
      <SkeletonLoader variant="circle" height="40px" />
      <div className="skeleton-meal__content">
        <SkeletonLoader width="180px" height="16px" />
        <SkeletonLoader width="100px" height="12px" />
      </div>
      <div className="skeleton-meal__right">
        <SkeletonLoader width="60px" height="16px" />
        <SkeletonLoader width="40px" height="12px" />
      </div>
    </div>
  );
}
