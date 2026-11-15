import { Menu, Bell, Search, Calendar } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

export const Topbar = ({
  onMenuToggle,
  title,
  subtitle,
  user = { name: 'Dr. Arthur Vance', role: 'admin' },
  session = 'Academic Year 2024–2025',
}) => {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-sage px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden text-charcoal p-1.5 rounded hover:bg-sage focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="font-editorial text-lg sm:text-xl font-bold text-charcoal truncate leading-tight">
            {title || 'Scholara Administration'}
          </h1>
          {subtitle && (
            <p className="text-2xs text-muted truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Academic Session, Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Session Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-sage/70 border border-sage-dark text-xs text-charcoal/80 font-medium">
          <Calendar className="w-3.5 h-3.5 text-forest" />
          <span>{session}</span>
        </div>

        {/* Search icon / placeholder */}
        <div className="hidden sm:flex items-center relative">
          <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search (Ctrl+K)..."
            className="w-48 lg:w-64 pl-9 pr-3 py-1.5 bg-ivory rounded border border-sage-dark text-xs text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-forest/30 focus:border-forest transition-all"
          />
        </div>

        {/* Notifications button */}
        <button
          type="button"
          className="relative text-muted hover:text-charcoal p-2 rounded-full hover:bg-sage/70 transition-colors focus:outline-none"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-sage hidden sm:block" />

        {/* User Mini Avatar & Role */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-forest text-ivory flex items-center justify-center font-editorial font-bold text-xs border border-forest-light">
            {user.name ? user.name[0] : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-charcoal leading-none">
              {user.name}
            </span>
            <Badge variant="gold" size="sm" className="mt-1">
              {user.role}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
