import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * SCHOLARA Premium Button Component
 * Variants: primary | secondary | gold | danger | ghost | outline
 * Sizes: sm | md | lg
 */
export const Button = forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-forest text-white hover:bg-forest-light active:bg-forest-dark focus:ring-forest/40 shadow-sm',
    secondary: 'bg-sage text-charcoal border border-sage-dark hover:bg-sage-dark/70 focus:ring-charcoal/20',
    gold: 'bg-gold text-charcoal font-semibold hover:bg-gold-light active:bg-gold-dark focus:ring-gold/40 shadow-sm',
    danger: 'bg-danger text-white hover:bg-danger/90 active:bg-danger/95 focus:ring-danger/40 shadow-sm',
    ghost: 'bg-transparent text-muted hover:bg-sage/70 hover:text-charcoal focus:ring-charcoal/10',
    outline: 'bg-transparent border border-forest/30 text-forest hover:bg-forest/5 focus:ring-forest/30',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2 leading-5',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 text-current shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && RightIcon ? (
        <RightIcon className="w-4 h-4 text-current shrink-0" />
      ) : null}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
