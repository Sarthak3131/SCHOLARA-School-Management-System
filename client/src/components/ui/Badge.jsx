/**
 * SCHOLARA Premium Badge Component
 * Variants: success | warning | danger | info | sage | forest | gold | outline
 * Sizes: sm | md
 */
export const Badge = ({
  children,
  variant = 'sage',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full tracking-wide select-none';

  const variantStyles = {
    success: 'bg-success-bg text-success border border-success/20',
    warning: 'bg-warning-bg text-warning border border-warning/20',
    danger: 'bg-danger-bg text-danger border border-danger/20',
    info: 'bg-info-bg text-info border border-info/20',
    sage: 'bg-sage text-charcoal/80 border border-sage-dark',
    forest: 'bg-forest text-ivory border border-forest-light/40',
    gold: 'bg-gold/15 text-gold-dark border border-gold/30',
    outline: 'bg-transparent text-charcoal border border-sage-dark',
  };

  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    sage: 'bg-muted',
    forest: 'bg-gold',
    gold: 'bg-gold',
    outline: 'bg-charcoal',
  };

  const sizeStyles = {
    sm: 'text-2xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.sage} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.sage}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
