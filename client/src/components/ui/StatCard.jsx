import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * SCHOLARA Premium StatCard Component
 * Displays key KPIs with editorial polish, icon accents, and trend indicators.
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: '+12%', isPositive: true, label: 'vs last month' }
  accent = 'forest', // 'forest' | 'gold' | 'sage' | 'success' | 'danger'
  className = '',
  ...props
}) => {
  const iconAccentStyles = {
    forest: 'bg-forest/10 text-forest',
    gold: 'bg-gold/20 text-gold-dark',
    sage: 'bg-sage text-charcoal',
    success: 'bg-success-bg text-success',
    danger: 'bg-danger-bg text-danger',
  };

  return (
    <div
      className={`bg-white rounded-lg border border-sage p-5 shadow-card hover:shadow-card-md transition-shadow duration-150 ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted truncate">
            {title}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-editorial text-2xl lg:text-3xl font-bold text-charcoal tracking-tight">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${iconAccentStyles[accent] || iconAccentStyles.forest}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3.5 pt-3 border-t border-sage/60 flex items-center justify-between text-xs text-muted">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs font-semibold ${
                  trend.isPositive === true
                    ? 'bg-success-bg text-success'
                    : trend.isPositive === false
                    ? 'bg-danger-bg text-danger'
                    : 'bg-sage text-muted'
                }`}
              >
                {trend.isPositive === true && <TrendingUp className="w-3 h-3" />}
                {trend.isPositive === false && <TrendingDown className="w-3 h-3" />}
                {trend.isPositive === undefined && <Minus className="w-3 h-3" />}
                {trend.value}
              </span>
              <span className="text-muted/80">{trend.label || 'vs last term'}</span>
            </div>
          ) : (
            <span className="text-muted/80">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
