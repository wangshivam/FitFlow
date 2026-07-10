import './Avatar.css';

export default function Avatar({
  src,
  name = '',
  size = 'md',
  className = '',
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizes = { sm: 32, md: 40, lg: 48, xl: 64 };

  return (
    <div
      className={`avatar avatar--${size} ${className}`}
      style={{ width: sizes[size], height: sizes[size] }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <span className="avatar__initials">{initials || '?'}</span>
      )}
    </div>
  );
}
