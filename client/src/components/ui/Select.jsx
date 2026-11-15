import { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

/**
 * SCHOLARA Premium Select Component
 */
export const Select = forwardRef(({
  label,
  name,
  options = [],
  placeholder = 'Select an option',
  error,
  hint,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  className = '',
  wrapperClassName = '',
  children,
  ...props
}, ref) => {
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

        <select
          ref={ref}
          id={name}
          name={name}
          disabled={disabled}
          className={`
            w-full appearance-none rounded border bg-white text-sm text-charcoal transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest
            disabled:bg-sage/40 disabled:text-muted disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-9' : 'pl-3.5'}
            pr-10 py-2
            ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-sage-dark hover:border-muted'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-muted">
              {placeholder}
            </option>
          )}

          {children ||
            options.map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
        </select>

        <div className="absolute right-3 pointer-events-none text-muted flex items-center">
          <ChevronDown className="w-4 h-4" />
        </div>
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

Select.displayName = 'Select';
export default Select;
