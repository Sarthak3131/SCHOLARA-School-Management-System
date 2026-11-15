import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * SCHOLARA Premium Input Component
 * Supports label, error, hint, left/right icons, password toggle, and standard HTML input props.
 */
export const Input = forwardRef(({
  label,
  name,
  type = 'text',
  error,
  hint,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wider text-charcoal/80 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-danger ml-1" title="Required">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 pointer-events-none text-muted flex items-center">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={name}
          name={name}
          type={effectiveType}
          disabled={disabled}
          className={`
            w-full rounded border bg-white text-sm text-charcoal transition-all duration-150
            placeholder:text-muted/60
            focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest
            disabled:bg-sage/40 disabled:text-muted disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-9' : 'pl-3.5'}
            ${(RightIcon || isPassword) ? 'pr-10' : 'pr-3.5'}
            py-2
            ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-sage-dark hover:border-muted'}
            ${className}
          `}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-muted hover:text-charcoal focus:outline-none transition-colors p-0.5"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : RightIcon ? (
          <div className="absolute right-3 pointer-events-none text-muted flex items-center">
            <RightIcon className="w-4 h-4" />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-danger flex items-center gap-1 mt-0.5" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-muted mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
