import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * SCHOLARA Premium Textarea Component
 */
export const Textarea = forwardRef(({
  label,
  name,
  rows = 4,
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
  wrapperClassName = '',
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

      <textarea
        ref={ref}
        id={name}
        name={name}
        rows={rows}
        disabled={disabled}
        className={`
          w-full rounded border bg-white px-3.5 py-2 text-sm text-charcoal transition-all duration-150 resize-y
          placeholder:text-muted/60
          focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest
          disabled:bg-sage/40 disabled:text-muted disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-sage-dark hover:border-muted'}
          ${className}
        `}
        {...props}
      />

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

Textarea.displayName = 'Textarea';
export default Textarea;
