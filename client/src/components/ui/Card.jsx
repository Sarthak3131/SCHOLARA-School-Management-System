/**
 * SCHOLARA Premium Card Components
 */
export const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-sage shadow-card
        ${hover ? 'transition-all duration-200 hover:shadow-card-md hover:border-sage-dark cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
  action,
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 border-b border-sage flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardTitle = ({
  children,
  className = '',
  as: Component = 'h3',
  editorial = false,
  ...props
}) => {
  return (
    <Component
      className={`
        ${editorial ? 'font-editorial text-lg text-charcoal' : 'text-sm font-semibold uppercase tracking-wider text-charcoal'}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardDescription = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-xs text-muted mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({
  children,
  className = '',
  noPadding = false,
  ...props
}) => {
  return (
    <div className={`${noPadding ? 'p-0' : 'px-6 py-5'} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-6 py-3.5 border-t border-sage bg-ivory/40 rounded-b-lg flex items-center justify-between text-xs text-muted ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
