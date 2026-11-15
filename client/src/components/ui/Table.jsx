import { ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import Button from './Button.jsx';

/**
 * SCHOLARA Premium Data Table Suite
 */
export const TableContainer = ({ children, className = '' }) => (
  <div className={`w-full overflow-hidden bg-white rounded-lg border border-sage shadow-card ${className}`}>
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
);

export const Table = ({ children, className = '', ...props }) => (
  <table className={`w-full text-sm border-collapse text-left ${className}`} {...props}>
    {children}
  </table>
);

export const Thead = ({ children, className = '', ...props }) => (
  <thead className={`bg-ivory/60 border-b border-sage-dark ${className}`} {...props}>
    {children}
  </thead>
);

export const Tbody = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-sage/60 ${className}`} {...props}>
    {children}
  </tbody>
);

export const Tr = ({ children, className = '', isClickable = false, ...props }) => (
  <tr
    className={`
      transition-colors duration-100
      ${isClickable ? 'cursor-pointer hover:bg-ivory/80' : 'hover:bg-ivory/40'}
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);

export const Th = ({ children, className = '', align = 'left', ...props }) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const Td = ({ children, className = '', align = 'left', ...props }) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td className={`px-4 py-3.5 text-charcoal ${alignClass} ${className}`} {...props}>
      {children}
    </td>
  );
};

export const TableEmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is no data available to display at this time.',
  action,
  colSpan = 6,
}) => (
  <tr>
    <td colSpan={colSpan} className="py-16 text-center">
      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-muted mb-3">
          <Icon className="w-6 h-6" />
        </div>
        <h4 className="font-editorial text-lg text-charcoal font-semibold mb-1">
          {title}
        </h4>
        <p className="text-xs text-muted mb-4 text-center">
          {description}
        </p>
        {action && <div>{action}</div>}
      </div>
    </td>
  </tr>
);

export const TableLoadingState = ({ rows = 5, cols = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <td key={cIdx} className="px-4 py-3.5">
            <div className="h-4 bg-sage rounded w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const TablePagination = ({
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className={`px-6 py-3.5 border-t border-sage bg-ivory/30 flex items-center justify-between text-xs text-muted ${className}`}>
      <div>
        Showing <span className="font-semibold text-charcoal">{startItem}</span> to{' '}
        <span className="font-semibold text-charcoal">{endItem}</span> of{' '}
        <span className="font-semibold text-charcoal">{total}</span> records
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          leftIcon={ChevronLeft}
        >
          Previous
        </Button>

        <span className="px-2 font-medium text-charcoal">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          rightIcon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Table;
